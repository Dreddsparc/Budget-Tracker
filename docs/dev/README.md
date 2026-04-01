# Budget Tracker -- Developer Documentation

Welcome to the Budget Tracker developer docs. This guide covers everything you need to understand, run, and extend the application. Whether you are fixing a bug, adding a feature, or learning the codebase, start here and follow the links to the detailed guides.

---

## :rocket: Quick Start

```bash
make dev    # Start all services (frontend + backend + database)
```

Open <http://localhost:5173> for the client. The API is available at <http://localhost:3001/api>.

> **Tip:** Run `make logs-server` in a second terminal to watch Express output while developing.

---

## :book: Documentation Index

| Icon | Guide | Description |
|------|-------|-------------|
| :building_construction: | [Architecture](architecture.md) | System overview: monorepo structure, Docker setup, how client/server/database interact, data flow |
| :floppy_disk: | [Database](database.md) | Prisma schema reference: all 7 models, fields, relations, constraints, indexes, migration strategy, seed script |
| :electric_plug: | [API Reference](api.md) | Complete REST API: every endpoint with method, path, request body, response shape, and error codes |
| :gear: | [Projections Engine](projections-engine.md) | Deep dive into the balance forecasting algorithm: interval matching, variable pricing, transfers, overrides |
| :deciduous_tree: | [Client Architecture](client-architecture.md) | React component tree, state management, data flow, how projections feed charts and the ledger |
| :page_facing_up: | [Spreadsheet Import/Export](spreadsheet.md) | ExcelJS workbook structure, formatting, import validation, round-trip safety, account scoping |
| :whale: | [Docker Setup](docker.md) | Docker Compose services, Dockerfiles, volume mounts, health checks, startup sequence |
| :wrench: | [Adding Features](adding-features.md) | Extension guide: new chart types, expense fields, API endpoints, interval types, projection engine changes |
| :test_tube: | [Testing](testing.md) | Current status, suggested frameworks, and key areas to test |

---

## :file_folder: Repository Layout

```text
Budget-Tracker/
  client/                  # React 19 + Vite + Tailwind v4 + DaisyUI v5
    src/
      api.ts               # Typed fetch wrapper -- all API calls
      types.ts             # Client-side TypeScript interfaces
      App.tsx              # Root component, state management
      components/          # UI components (charts, lists, modals, ChartFullscreen)
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

---

## :bulb: Key Concepts

- **Accounts** -- All financial data (balance, income, expenses) is scoped to an account. Users can manage multiple accounts.
- **Projections** -- The core feature. A day-by-day balance simulation from today forward, applying income and expense events at their configured intervals.
- **Transfers** -- Expenses marked as transfers appear as income in the target account's projections.
- **Overrides** -- Client-side toggles that temporarily enable/disable income or expense items for what-if analysis. Not persisted to the database.
- **Actual Spending** -- Recorded real-world transactions that can optionally link to a forecast expense. When linked, actuals replace the forecast entry in projections for that day, preventing double-counting.
- **Variable Expenses** -- Expenses whose effective amount can change over time via `PriceAdjustment` records.
- **Categories** -- User-defined labels for expenses, with associated colors for chart rendering. Auto-discovered from expense data.

---

## :satellite: Ports

| Service | Port | Purpose |
|---------|------|---------|
| Client  | 5173 | Vite dev server |
| Server  | 3001 | Express API |
| Database | 5432 | PostgreSQL |

---

## Related

- [CLAUDE.md](../../CLAUDE.md) -- AI assistant guidelines and project-level conventions
- [Docker Setup](docker.md) -- Full environment configuration and Makefile reference
