# Budget Tracker

A personal budget tracking and forecasting tool. Enter your current balance, define income sources and planned expenses with their intervals, and see a day-by-day projected balance on an interactive timeline chart. Toggle items on/off for what-if scenario analysis.

## Tech Stack

| Layer    | Technology                              |
|----------|-----------------------------------------|
| Frontend | React 19, TypeScript, Tailwind CSS v4, DaisyUI v5, Recharts |
| Backend  | Express, TypeScript, Prisma ORM         |
| Database | PostgreSQL 16                           |
| Infra    | Docker Compose                          |

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
- [GNU Make](https://www.gnu.org/software/make/) (pre-installed on macOS and most Linux distros)

## Quick Start

```bash
# 1. Clone the repository
git clone <repo-url> && cd Budget-Tracker

# 2. Start everything
make dev
```

That's it. Docker Compose builds both containers, starts PostgreSQL, runs database migrations, and launches the app. Once you see output from all three services:

- **App**: http://localhost:5173
- **API**: http://localhost:3001

On first load, you'll be prompted to set your starting balance. From there, add income sources and expenses to see your projected balance over time.

To run in the background instead:

```bash
make up       # start detached
make logs     # follow the output
make down     # stop when done
```

## Makefile Reference

Run `make help` to see all available commands. Here's the full list organized by section:

### Getting Started

| Command        | Description                                    |
|----------------|------------------------------------------------|
| `make dev`     | Start all services with live output (builds if needed) |
| `make up`      | Start all services in the background           |
| `make down`    | Stop all services                              |
| `make restart` | Stop and restart everything with a fresh build |

### Service Management

| Command              | Description                              |
|----------------------|------------------------------------------|
| `make build`         | Rebuild all containers without starting  |
| `make build-server`  | Rebuild only the server container        |
| `make build-client`  | Rebuild only the client container        |
| `make start-server`  | Start just the server + database         |
| `make start-client`  | Start just the client                    |
| `make stop-server`   | Stop the server container                |
| `make stop-client`   | Stop the client container                |
| `make status`        | Show running container status            |

### Logs

| Command            | Description                    |
|--------------------|--------------------------------|
| `make logs`        | Tail logs from all services    |
| `make logs-server` | Tail logs from the server only |
| `make logs-client` | Tail logs from the client only |
| `make logs-db`     | Tail logs from PostgreSQL only |

### Shell Access

| Command            | Description                              |
|--------------------|------------------------------------------|
| `make shell-server`| Open a shell inside the server container |
| `make shell-client`| Open a shell inside the client container |
| `make shell-db`    | Open a psql session in PostgreSQL        |

### Database

| Command                 | Description                                       |
|-------------------------|---------------------------------------------------|
| `make db-migrate`       | Run any pending Prisma migrations                 |
| `make db-migrate-create`| Create a new migration (after schema changes)     |
| `make db-reset`         | Drop and recreate the database (destroys all data)|
| `make db-studio`        | Open Prisma Studio (visual DB browser) on port 5555 |
| `make db-seed`          | Seed the database with sample data                |

### Local Development (without Docker)

| Command              | Description                                     |
|----------------------|-------------------------------------------------|
| `make install`       | Install npm dependencies for server and client  |
| `make install-server`| Install server dependencies only                |
| `make install-client`| Install client dependencies only                |
| `make typecheck`     | Run TypeScript type checking on both projects   |

### Cleanup

| Command              | Description                                              |
|----------------------|----------------------------------------------------------|
| `make clean`         | Stop services, remove containers                         |
| `make clean-volumes` | Same as clean + delete database volume (destroys data)   |
| `make clean-all`     | Full reset: containers, volumes, images, and node_modules|

## Common Workflows

### Starting fresh after pulling changes

```bash
make restart
```

### Viewing server logs while developing

```bash
make up              # start in background
make logs-server     # watch server output
```

### Modifying the database schema

1. Edit `server/prisma/schema.prisma`
2. Run `make db-migrate-create` to generate and apply a migration
3. The server auto-restarts and picks up the new schema

### Resetting everything to a clean state

```bash
make clean-all       # removes containers, data, images, node_modules
make dev             # rebuild from scratch
```

### Inspecting the database directly

```bash
make shell-db
# Now in psql:
\dt                          -- list tables
SELECT * FROM "IncomeSource";
SELECT * FROM "PlannedExpense";
\q                           -- exit
```

## Project Structure

```
Budget-Tracker/
├── Makefile                    # All dev commands
├── docker-compose.yml          # Service definitions (db, server, client)
├── .env                        # Database credentials
├── server/
│   ├── Dockerfile
│   ├── package.json
│   ├── prisma/
│   │   └── schema.prisma       # Data model
│   └── src/
│       ├── index.ts            # Express app setup
│       ├── lib/prisma.ts       # Database client
│       └── routes/
│           ├── balance.ts      # GET/POST current balance
│           ├── income.ts       # CRUD income sources
│           ├── expenses.ts     # CRUD planned expenses
│           └── projections.ts  # Balance forecast engine
└── client/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.ts
    └── src/
        ├── App.tsx             # Main dashboard layout
        ├── api.ts              # API client
        ├── types.ts            # Shared TypeScript types
        └── components/
            ├── ProjectionChart.tsx   # Timeline graph (Recharts)
            ├── IncomeList.tsx        # Income management
            ├── ExpenseList.tsx       # Expense management
            ├── EntryForm.tsx         # Add/edit form
            └── SetBalanceModal.tsx   # Balance setup dialog
```

## Environment Variables

All configuration lives in `.env` at the project root. Defaults work out of the box for local development:

| Variable            | Default                                          | Description            |
|---------------------|--------------------------------------------------|------------------------|
| `DATABASE_URL`      | `postgresql://budget:budget@db:5432/budget_tracker` | Prisma connection string |
| `POSTGRES_USER`     | `budget`                                         | PostgreSQL username    |
| `POSTGRES_PASSWORD` | `budget`                                         | PostgreSQL password    |
| `POSTGRES_DB`       | `budget_tracker`                                 | PostgreSQL database name |
