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
make db-migrate       # Run pending Prisma migrations (interactive)
make db-push          # Push schema changes directly (no migration file)
make db-reset         # Drop and recreate DB (destroys data)
make db-studio        # Prisma Studio on port 5555
make shell-db         # psql session
```

After editing `server/prisma/schema.prisma`, run `make db-migrate` to generate and apply a migration.

### Type Checking

```bash
make typecheck        # Runs tsc --noEmit on both server and client
```

No test framework or linter is configured.

## Architecture

Monorepo with two independent npm projects (`client/` and `server/`) orchestrated by Docker Compose. No shared packages between them.

### Server (Express + Prisma + PostgreSQL)

- Entry: `server/src/index.ts` — Express app mounting route modules under `/api/*`
- Routes: `server/src/routes/{accounts,balance,income,expenses,actuals,projections,categories,spreadsheet}.ts` — each exports a Router
- DB client: `server/src/lib/prisma.ts` — singleton Prisma instance
- Schema: `server/prisma/schema.prisma` — 7 models: `Account`, `BalanceSnapshot`, `IncomeSource`, `PlannedExpense`, `PriceAdjustment`, `ActualSpend`, `CategoryColor`
- Hot reload via `tsx watch` in Docker

### Client (React 19 + Vite + Tailwind v4 + DaisyUI v5)

- Entry: `client/src/main.tsx` → `client/src/App.tsx` (single-page app, no router)
- API layer: `client/src/api.ts` — typed fetch wrapper, all endpoints in one file
- Types: `client/src/types.ts` — shared client-side types (manually kept in sync with Prisma schema, not generated)
- Components in `client/src/components/` — DaisyUI class-based styling
- Charts: Recharts (`ProjectionChart.tsx`)
- Vite proxies `/api` requests to the server container in development

### Key Domain Concepts

- **Multi-account**: Users can create multiple accounts (checking, savings, etc.). All data is scoped to accounts. The `Account` model is the top-level entity.
- **Projections engine** (`server/src/routes/projections.ts`): The core feature. Simulates day-by-day balance from today forward, applying income/expense events based on their `Interval` (ONE_TIME, DAILY, WEEKLY, BIWEEKLY, MONTHLY, QUARTERLY, YEARLY). Supports date-range queries and client-side toggle overrides for what-if analysis. Also includes incoming transfers from other accounts as virtual income.
- **Transfers**: Expenses with `isTransfer: true` and `transferToAccountId` set represent money moving between accounts. They appear as expenses in the source account and income in the target account's projections.
- **Variable expenses**: Expenses with `isVariable: true` can have `PriceAdjustment` records that change the effective amount at specific dates.
- **Actual spending** (`server/src/routes/actuals.ts`): Records real transactions with optional links to forecast expenses. When an actual links to a forecast expense on a day it would fire, the projection engine uses the actual amount instead of the forecast. Unlinked actuals appear as additional deductions. Events marked with `isActual: true` in projections.
- **Overrides**: Client-side only — toggles income/expenses on/off temporarily without persisting, passed as query params to the projections endpoint.
- **Spreadsheet exchange** (`server/src/routes/spreadsheet.ts`): Export all data to a formatted Excel workbook with instructions, data validation, and color-coded sheets. Import a modified workbook to create/update/delete records. Uses `exceljs` and `multer`.

### API Routes

All data routes are scoped under `/api/accounts/:accountId/`. Categories and health remain global.

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/accounts` | GET, POST | List/create accounts |
| `/api/accounts/:id` | PUT, DELETE | Rename/delete account |
| `/api/accounts/:accountId/balance` | GET, POST | Current balance snapshot |
| `/api/accounts/:accountId/income` | GET, POST | Income sources CRUD |
| `/api/accounts/:accountId/income/:id` | PUT, DELETE | Update/delete income |
| `/api/accounts/:accountId/income/:id/toggle` | PATCH | Toggle active state |
| `/api/accounts/:accountId/expenses` | GET, POST | Planned expenses CRUD |
| `/api/accounts/:accountId/expenses/:id` | PUT, DELETE | Update/delete expense |
| `/api/accounts/:accountId/expenses/:id/toggle` | PATCH | Toggle active state |
| `/api/accounts/:accountId/expenses/:id/prices` | GET, POST | Price adjustments for variable expenses |
| `/api/accounts/:accountId/expenses/:id/prices/:priceId` | PUT, DELETE | Update/delete price adjustment |
| `/api/accounts/:accountId/actuals` | GET, POST | List/create actual spending records |
| `/api/accounts/:accountId/actuals/:id` | PUT, DELETE | Update/delete actual spending record |
| `/api/accounts/:accountId/projections` | GET | Balance forecast (integrates actuals, query: startDate/endDate or days, overrides) |
| `/api/accounts/:accountId/spreadsheet/export` | GET | Download account data as formatted Excel workbook |
| `/api/accounts/:accountId/spreadsheet/import` | POST | Upload modified workbook to sync account data |
| `/api/categories` | GET | List category colors (global) |
| `/api/categories/:name` | PUT | Set category color (global) |
| `/api/health` | GET | Health check |

### Ports

- **5173**: Client (Vite dev server)
- **3001**: Server (Express API)
- **5432**: PostgreSQL
