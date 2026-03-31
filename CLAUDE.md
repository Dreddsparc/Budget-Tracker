# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

Everything runs in Docker. Use the Makefile:

```bash
make dev              # Start all services with live output (frontend + backend + db)
make up               # Start detached
make down             # Stop all services
make restart          # Full rebuild and restart
make logs-server      # Tail server logs
make logs-client      # Tail client logs
```

### Database

```bash
make db-push          # Push schema changes directly (no migration file, use for dev)
make db-migrate       # Run pending Prisma migrations (interactive, use for production-style)
make db-reset         # Drop and recreate DB (destroys data)
make db-studio        # Prisma Studio on port 5555
make shell-db         # psql session
```

After editing `server/prisma/schema.prisma`, run `make db-push` for development. The server Dockerfile CMD runs `prisma db push` + `prisma generate` + seed script on every container start.

### Type Checking

```bash
make typecheck        # Runs tsc --noEmit on both server and client
```

For individual checks during development:
```bash
cd client && npx tsc --noEmit    # Client only
cd server && npx tsc --noEmit    # Server only (categoryColor/actualSpend errors are expected locally — Prisma client needs regeneration in Docker)
```

No test framework or linter is configured.

## Architecture

Monorepo with two independent npm projects (`client/` and `server/`) orchestrated by Docker Compose. No shared packages between them.

### Server (Express + Prisma + PostgreSQL)

- Entry: `server/src/index.ts` — Express app mounting route modules under `/api/*`
- Routes: `server/src/routes/{accounts,balance,income,expenses,actuals,projections,categories,spreadsheet}.ts` — each exports a Router
- DB client: `server/src/lib/prisma.ts` — singleton Prisma instance
- Schema: `server/prisma/schema.prisma` — 7 models: `Account`, `BalanceSnapshot`, `IncomeSource`, `PlannedExpense`, `PriceAdjustment`, `ActualSpend`, `CategoryColor`
- Seed: `server/prisma/seed-accounts.ts` — creates default "Primary" account on first run, backfills orphaned records
- Hot reload via `tsx watch` in Docker

**Critical pattern**: All account-scoped routes use `Router({ mergeParams: true })` so `req.params.accountId` is accessible from the parent mount path. Forgetting this on a new route will cause `accountId` to be `undefined`.

### Client (React 19 + Vite + Tailwind v4 + DaisyUI v5)

- Entry: `client/src/main.tsx` → `client/src/App.tsx` (single-page app, no router)
- API layer: `client/src/api.ts` — typed fetch wrapper, all endpoints in one file. Every data function takes `accountId` as first parameter.
- Types: `client/src/types.ts` — shared client-side types (manually kept in sync with Prisma schema, not generated). Also contains `ChartType` and `ChartFullscreenOptions`.
- Utility: `client/src/monthlyTotal.ts` — client-side interval matching (mirrors server's `matchesInterval`) for calculating current-month totals in collapsed panels.
- Components in `client/src/components/` — DaisyUI class-based styling
- Charts: Recharts v2.15 (5 chart types + `ChartFullscreen` wrapper for fullscreen/zoom)
- Vite proxies `/api` requests to the server container in development
- Source files are volume-mounted in Docker for HMR — client changes reflect without rebuild

### State Management (App.tsx)

App.tsx is the centralized state manager. Key data flow:
1. On mount: fetch accounts, set `activeAccountId` from `localStorage`
2. On account change: `fetchAll()` loads balance, income, incoming transfers, expenses, actuals, categories in parallel
3. On dateRange/overrides/refreshKey change: `fetchProjections()` re-fetches projections
4. `projections` state is shared to all chart components and LedgerView as props (single fetch, no duplication)
5. Child components (IncomeList, ExpenseList, ActualSpendList) make their own CRUD API calls and trigger `onRefresh` callbacks

### Key Domain Concepts

- **Multi-account**: All data scoped to accounts via `accountId` FK. The `Account` model is the top-level entity. Account selection persisted to `localStorage`.
- **Projections engine** (`server/src/routes/projections.ts`): The core feature. Simulates day-by-day balance from today forward using `matchesInterval()` for 7 interval types, `getEffectiveAmount()` for variable pricing, and `applyDay()` which processes income, incoming transfers, actual spends, then forecast expenses (skipping forecasts covered by actuals).
- **Transfers**: Expenses with `isTransfer: true` and `transferToAccountId` set. They appear as expenses in the source account and virtual income in the target account's projections. Target account events named `"{expenseName}-{MonthAbbrev}"` with category `"Transfer from {sourceAccount}"`. Transfer expense events are tagged `isTransfer: true` in projections — the spending analysis charts (pie, bar, cash flow, trends) exclude them since they're not real spending, while the projection chart and ledger include them (they affect account balance).
- **Actual spending**: Records real transactions with optional `forecastExpenseId` link. In `applyDay()`, actuals fire first and build a `coveredForecastIds` set — linked forecast expenses that would fire on the same day are skipped. Unlinked actuals are additional deductions. Events have `isActual: true`.
- **Variable expenses**: `PriceAdjustment` records change effective amount at specific dates. `getEffectiveAmount()` picks the latest adjustment with `startDate <= currentDate`.
- **Categories**: Global (not account-scoped). `GET /api/categories` auto-discovers categories from expense records and creates missing `CategoryColor` entries. Rename via PUT migrates all expenses. Delete clears category from expenses.
- **Overrides**: Client-side what-if toggles. Map of `{id → active}` passed as query param to projections endpoint. Not persisted.
- **Spreadsheet exchange** (`server/src/routes/spreadsheet.ts`): ExcelJS-based export/import with 7 sheets (Instructions, Balance, Income, Expenses, Price Adjustments, Actual Spending, Category Colors). All operations scoped by `accountId`. Import matches rows by ID: existing update, blank ID creates, missing rows delete.
- **Fullscreen charts**: `ChartFullscreen.tsx` renders any chart at full viewport with zoom. Zoom works by slicing the `projections` array by index range. Each chart accepts optional `ChartFullscreenOptions` prop — when absent, renders normally (backward compatible). ProjectionChart uses `"fs-"` prefixed SVG gradient IDs in fullscreen to avoid DOM ID collisions.

### API Routes

All data routes scoped under `/api/accounts/:accountId/`. Categories and health are global.

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/accounts` | GET, POST | List/create accounts |
| `/api/accounts/:id` | PUT, DELETE | Rename/delete account |
| `/api/accounts/:accountId/balance` | GET, POST | Current balance snapshot |
| `/api/accounts/:accountId/income` | GET, POST | Income sources CRUD |
| `/api/accounts/:accountId/income/:id` | PUT, DELETE | Update/delete income |
| `/api/accounts/:accountId/income/:id/toggle` | PATCH | Toggle active state |
| `/api/accounts/:accountId/income/transfers` | GET | Incoming transfers (read-only) |
| `/api/accounts/:accountId/expenses` | GET, POST | Planned expenses CRUD |
| `/api/accounts/:accountId/expenses/:id` | PUT, DELETE | Update/delete expense |
| `/api/accounts/:accountId/expenses/:id/toggle` | PATCH | Toggle active state |
| `/api/accounts/:accountId/expenses/:id/prices` | GET, POST | Price adjustments for variable expenses |
| `/api/accounts/:accountId/expenses/:id/prices/:priceId` | PUT, DELETE | Update/delete price adjustment |
| `/api/accounts/:accountId/actuals` | GET, POST | List/create actual spending records |
| `/api/accounts/:accountId/actuals/:id` | PUT, DELETE | Update/delete actual spending record |
| `/api/accounts/:accountId/projections` | GET | Balance forecast (query: startDate/endDate or days, overrides) |
| `/api/accounts/:accountId/spreadsheet/export` | GET | Download account data as formatted Excel workbook |
| `/api/accounts/:accountId/spreadsheet/import` | POST | Upload modified workbook to sync account data (multipart/form-data) |
| `/api/categories` | GET, POST | List/create categories (global, auto-discovers from expenses) |
| `/api/categories/:name` | PUT, DELETE | Update/delete category (rename migrates expenses) |
| `/api/health` | GET | Health check |

### Ports

- **5173**: Client (Vite dev server)
- **3001**: Server (Express API)
- **5432**: PostgreSQL
