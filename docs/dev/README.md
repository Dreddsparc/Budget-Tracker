# Budget Tracker -- Developer Documentation

This directory contains the full developer documentation for the Budget Tracker application. Start here to understand the system, then dive into the guide most relevant to your task.

## Quick Start

```bash
make dev    # Start all services (frontend + backend + database)
```

Open <http://localhost:5173> for the client. The API is available at <http://localhost:3001/api>.

## Documentation Index

| Guide | Description |
|-------|-------------|
| [Architecture](architecture.md) | System overview: monorepo structure, Docker setup, how client/server/database interact, data flow |
| [Database](database.md) | Prisma schema reference: all 7 models, fields, relations, constraints, indexes, migration strategy, seed script |
| [API Reference](api.md) | Complete REST API: every endpoint with method, path, request body, response shape, and error codes |
| [Projections Engine](projections-engine.md) | Deep dive into the balance forecasting algorithm: interval matching, variable pricing, transfers, overrides |
| [Client Architecture](client-architecture.md) | React component tree, state management, data flow, how projections feed charts and the ledger |
| [Spreadsheet Import/Export](spreadsheet.md) | ExcelJS workbook structure, formatting, import validation, round-trip safety, account scoping |
| [Docker Setup](docker.md) | Docker Compose services, Dockerfiles, volume mounts, health checks, startup sequence |
| [Adding Features](adding-features.md) | Extension guide: new chart types, expense fields, API endpoints, interval types, projection engine changes |
| [Testing](testing.md) | Current status, suggested frameworks, and key areas to test |

## Repository Layout

```
Budget-Tracker/
  client/                  # React 19 + Vite + Tailwind v4 + DaisyUI v5
    src/
      api.ts               # Typed fetch wrapper -- all API calls
      types.ts             # Client-side TypeScript interfaces
      App.tsx              # Root component, state management
      components/          # UI components (charts, lists, modals)
    Dockerfile
    vite.config.ts
  server/                  # Express + Prisma + PostgreSQL
    src/
      index.ts             # Express app, route mounting
      lib/prisma.ts        # Singleton Prisma client
      routes/              # Route modules (accounts, balance, income, expenses, actuals, projections, categories, spreadsheet)
    prisma/
      schema.prisma        # Database schema
      seed-accounts.ts     # Seed script for default account
    Dockerfile
  docker-compose.yml       # Orchestrates db, server, client
  Makefile                 # Development commands
  CLAUDE.md                # AI assistant guidelines
```

## Key Concepts

- **Accounts**: All financial data (balance, income, expenses) is scoped to an account. Users can manage multiple accounts.
- **Projections**: The core feature. A day-by-day balance simulation from today forward, applying income and expense events at their configured intervals.
- **Transfers**: Expenses marked as transfers appear as income in the target account's projections.
- **Overrides**: Client-side toggles that temporarily enable/disable income or expense items for what-if analysis. Not persisted to the database.
- **Actual Spending**: Recorded real-world transactions that can optionally link to a forecast expense. When linked, actuals replace the forecast entry in projections for that day, preventing double-counting.
- **Variable Expenses**: Expenses whose effective amount can change over time via `PriceAdjustment` records.
- **Categories**: User-defined labels for expenses, with associated colors for chart rendering. Auto-discovered from expense data.

## Ports

| Service | Port | Purpose |
|---------|------|---------|
| Client  | 5173 | Vite dev server |
| Server  | 3001 | Express API |
| Database | 5432 | PostgreSQL |
