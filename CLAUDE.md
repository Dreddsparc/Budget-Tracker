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
- Routes: `server/src/routes/{balance,income,expenses,projections}.ts` — each exports a Router
- DB client: `server/src/lib/prisma.ts` — singleton Prisma instance
- Schema: `server/prisma/schema.prisma` — 4 models: `BalanceSnapshot`, `IncomeSource`, `PlannedExpense`, `PriceAdjustment`
- Hot reload via `tsx watch` in Docker

### Client (React 19 + Vite + Tailwind v4 + DaisyUI v5)

- Entry: `client/src/main.tsx` → `client/src/App.tsx` (single-page app, no router)
- API layer: `client/src/api.ts` — typed fetch wrapper, all endpoints in one file
- Types: `client/src/types.ts` — shared client-side types (manually kept in sync with Prisma schema, not generated)
- Components in `client/src/components/` — DaisyUI class-based styling
- Charts: Recharts (`ProjectionChart.tsx`)
- Vite proxies `/api` requests to the server container in development

### Key Domain Concepts

- **Projections engine** (`server/src/routes/projections.ts`): The core feature. Simulates day-by-day balance from today forward, applying income/expense events based on their `Interval` (ONE_TIME, DAILY, WEEKLY, BIWEEKLY, MONTHLY, QUARTERLY, YEARLY). Supports date-range queries and client-side toggle overrides for what-if analysis.
- **Variable expenses**: Expenses with `isVariable: true` can have `PriceAdjustment` records that change the effective amount at specific dates.
- **Overrides**: Client-side only — toggles income/expenses on/off temporarily without persisting, passed as query params to the projections endpoint.

### API Routes

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/balance` | GET, POST | Current balance snapshot |
| `/api/income` | GET, POST | Income sources CRUD |
| `/api/income/:id` | PUT, DELETE | Update/delete income |
| `/api/income/:id/toggle` | PATCH | Toggle active state |
| `/api/expenses` | GET, POST | Planned expenses CRUD |
| `/api/expenses/:id` | PUT, DELETE | Update/delete expense |
| `/api/expenses/:id/toggle` | PATCH | Toggle active state |
| `/api/expenses/:id/prices` | GET, POST | Price adjustments for variable expenses |
| `/api/expenses/:id/prices/:priceId` | PUT, DELETE | Update/delete price adjustment |
| `/api/projections` | GET | Balance forecast (query: startDate/endDate or days, overrides) |
| `/api/health` | GET | Health check |

### Ports

- **5173**: Client (Vite dev server)
- **3001**: Server (Express API)
- **5432**: PostgreSQL
