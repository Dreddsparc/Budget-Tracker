# System Architecture

## Overview

Budget Tracker is a monorepo containing two independent Node.js projects -- `client/` and `server/` -- orchestrated by Docker Compose. There are no shared packages or code between them; the client-side TypeScript types in `client/src/types.ts` are manually kept in sync with the Prisma schema on the server.

```
                 Browser
                   |
                   | HTTP (port 5173)
                   v
              +---------+
              |  Client  |  React 19 + Vite + Tailwind + DaisyUI
              |  (SPA)   |
              +---------+
                   |
                   | Vite proxy: /api/* -> server:3001
                   v
              +---------+
              |  Server  |  Express + TypeScript (tsx watch)
              |  (API)   |
              +---------+
                   |
                   | Prisma Client (DATABASE_URL)
                   v
              +---------+
              |   DB     |  PostgreSQL 16 (Alpine)
              +---------+
```

## Monorepo Structure

Each project is self-contained with its own `package.json`, `tsconfig.json`, and `Dockerfile`. The root `docker-compose.yml` and `Makefile` tie them together.

```
Budget-Tracker/
  docker-compose.yml
  Makefile
  client/
    package.json           # React, Vite, Tailwind, DaisyUI, Recharts
    Dockerfile
    vite.config.ts         # Proxy /api to server:3001
    src/
      main.tsx             # ReactDOM entry
      App.tsx              # Root component, all application state
      api.ts               # Typed fetch wrapper
      types.ts             # Client-side type definitions
      components/          # 15 UI components
  server/
    package.json           # Express, Prisma, ExcelJS, multer
    Dockerfile
    tsconfig.json
    prisma/
      schema.prisma        # 6 models + Interval enum
      seed-accounts.ts     # Creates default "Primary" account
    src/
      index.ts             # Express app setup, route mounting
      lib/prisma.ts        # Singleton PrismaClient
      routes/
        accounts.ts        # Account CRUD
        balance.ts         # Balance snapshots
        income.ts          # Income sources + transfers
        expenses.ts        # Planned expenses + price adjustments
        projections.ts     # Day-by-day balance simulation
        categories.ts      # Category colors management
        spreadsheet.ts     # Excel export/import
```

## Data Flow

### Write Path (user creates an income source)

1. User fills out the `EntryForm` component and submits.
2. `IncomeList` calls `api.createIncome(accountId, data)`.
3. `api.ts` sends `POST /api/accounts/:accountId/income` with JSON body.
4. Vite dev server proxies the request to `http://server:3001`.
5. Express routes it to `income.ts`, which calls `prisma.incomeSource.create()`.
6. Prisma generates a SQL `INSERT` and sends it to PostgreSQL.
7. The new record is returned as JSON through the entire chain.
8. `IncomeList` calls `onRefresh()`, which triggers `fetchAll` and `fetchProjections` in `App.tsx`.

### Read Path (projections)

1. `App.tsx` calls `api.getProjections(accountId, range, overrides)`.
2. Request hits `GET /api/accounts/:accountId/projections?days=90`.
3. `projections.ts` queries the latest balance snapshot, all income sources, all expenses (with price adjustments), and incoming transfers -- all in parallel via `Promise.all`.
4. The engine iterates day-by-day from `windowStart` to `windowEnd`, calling `applyDay()` for each date.
5. The resulting `ProjectionDay[]` array is returned as JSON.
6. `App.tsx` stores it in `projections` state, which flows as props to all chart components and `LedgerView`.

## Server Architecture

### Route Mounting (`server/src/index.ts`)

The Express app mounts route modules at specific path prefixes. All account-scoped routes use `Router({ mergeParams: true })` so they can access `:accountId` from the parent path.

```
/api/accounts                          -> accounts.ts (no mergeParams -- global)
/api/accounts/:accountId/balance       -> balance.ts
/api/accounts/:accountId/income        -> income.ts
/api/accounts/:accountId/expenses      -> expenses.ts
/api/accounts/:accountId/projections   -> projections.ts
/api/accounts/:accountId/spreadsheet   -> spreadsheet.ts
/api/categories                        -> categories.ts (global)
/api/health                            -> inline handler
```

### Database Access

All routes import the singleton Prisma client from `server/src/lib/prisma.ts`. There is no ORM abstraction layer, service layer, or repository pattern -- routes call Prisma directly.

## Client Architecture

The client is a single-page application with no client-side router. All state lives in `App.tsx` and flows down via props. See [Client Architecture](client-architecture.md) for a detailed breakdown.

### API Layer (`client/src/api.ts`)

A single file contains every API call. The `request<T>()` helper handles JSON serialization, error handling, and `204 No Content` responses. The `exportSpreadsheet` and `importSpreadsheet` functions bypass the JSON helper since they deal with binary data and `FormData`.

### Proxy Configuration (`client/vite.config.ts`)

In development, Vite proxies all `/api` requests to `http://server:3001`. The `server` hostname resolves within the Docker network.

```typescript
proxy: {
  "/api": {
    target: "http://server:3001",
    changeOrigin: true,
  },
},
```

## Docker Orchestration

Three services run in Docker Compose:

| Service | Image | Depends On | Health Check |
|---------|-------|-----------|--------------|
| `db` | `postgres:16-alpine` | -- | `pg_isready` |
| `server` | Node 20 Alpine (custom) | `db` (healthy) | `wget /api/health` |
| `client` | Node 20 Alpine (custom) | `server` (healthy) | -- |

Startup sequence: database starts first, then server (which runs `prisma db push`, `prisma generate`, seed, and `tsx watch`), then client (Vite dev server). See [Docker Setup](docker.md) for full details.

## Technology Stack

### Server
- **Runtime**: Node.js 20 (Alpine)
- **Framework**: Express 4
- **ORM**: Prisma 6
- **Database**: PostgreSQL 16
- **Spreadsheet**: ExcelJS
- **File Upload**: multer (memory storage)
- **Dev Server**: tsx watch (hot reload)

### Client
- **Framework**: React 19
- **Build Tool**: Vite
- **CSS**: Tailwind CSS v4 + DaisyUI v5
- **Charts**: Recharts
- **Language**: TypeScript 5
