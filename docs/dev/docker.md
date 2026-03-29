# Docker Setup

The application runs as three Docker Compose services: a PostgreSQL database, a Node.js API server, and a Vite dev server for the React client.

## Services

### db (PostgreSQL)

- **Image:** `postgres:16-alpine`
- **Port:** 5432 (mapped to host)
- **Volume:** Named volume `pgdata` at `/var/lib/postgresql/data` for persistent storage
- **Environment:** `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` from `.env` file
- **Health check:** `pg_isready -U $POSTGRES_USER -d $POSTGRES_DB` every 2 seconds, 5-second timeout, 10 retries

### server (Express API)

- **Base image:** `node:20-alpine`
- **Port:** 3001 (mapped to host)
- **Depends on:** `db` (healthy)
- **Environment:** `DATABASE_URL`, `PORT=3001`
- **Health check:** `wget -qO- http://localhost:3001/api/health || exit 1` every 3 seconds, 5-second timeout, 15 retries, 30-second start period

### client (Vite Dev Server)

- **Base image:** `node:20-alpine`
- **Port:** 5173 (mapped to host)
- **Depends on:** `server` (healthy)
- **No health check** configured

## Dockerfiles

### Server Dockerfile (`server/Dockerfile`)

```dockerfile
FROM node:20-alpine

WORKDIR /app/server

COPY server/package.json server/package-lock.json* ./
RUN npm install

COPY server/prisma ./prisma
RUN npx prisma generate

COPY server/ .

CMD ["sh", "-c", "npx prisma db push --skip-generate && npx prisma generate && npx tsx prisma/seed-accounts.ts && npx tsx watch src/index.ts"]
```

**Build steps:**
1. Copy and install npm dependencies.
2. Copy the Prisma schema and run `prisma generate` to create the client library.
3. Copy the rest of the server source.

**Startup sequence (CMD):**
1. `prisma db push --skip-generate` -- apply the schema to the database. This creates or alters tables to match `schema.prisma`. The `--skip-generate` flag avoids regenerating the client (done in the next step).
2. `prisma generate` -- regenerate the Prisma client. This is needed because `db push` with `--skip-generate` may have updated the schema.
3. `tsx prisma/seed-accounts.ts` -- run the seed script. Creates a default "Primary" account if no accounts exist.
4. `tsx watch src/index.ts` -- start the Express server with hot reload. File changes in `src/` trigger automatic restarts.

### Client Dockerfile (`client/Dockerfile`)

```dockerfile
FROM node:20-alpine

WORKDIR /app/client

COPY client/package.json client/package-lock.json* ./
RUN npm install

COPY client/ .

CMD ["npx", "vite", "--host"]
```

The `--host` flag makes Vite listen on `0.0.0.0` so it is accessible outside the container.

## Volume Mounts

Volume mounts enable hot reload by mapping source files from the host into the containers.

### Server volumes

```yaml
volumes:
  - ./server/src:/app/server/src
  - ./server/prisma:/app/server/prisma
```

- `server/src` -- TypeScript source files. Changes trigger `tsx watch` to restart the server.
- `server/prisma` -- Schema and seed files. Schema changes require running `make db-push` manually.

### Client volumes

```yaml
volumes:
  - ./client/src:/app/client/src
  - ./client/index.html:/app/client/index.html
```

- `client/src` -- React components, API layer, types. Changes trigger Vite HMR (Hot Module Replacement).
- `client/index.html` -- The HTML entry point. Changes are picked up by Vite.

### Database volume

```yaml
volumes:
  pgdata:
```

A named Docker volume for PostgreSQL data. This persists across `make down` / `make up` cycles. To destroy it:

```bash
make clean-volumes    # docker compose down -v --remove-orphans
```

## Startup Sequence

The dependency chain ensures services start in order:

```
1. db starts
     |
     | pg_isready returns success
     v
2. server starts
     |
     | prisma db push (schema applied)
     | prisma generate (client generated)
     | seed-accounts.ts (default account created)
     | tsx watch (Express listening on :3001)
     |
     | wget /api/health returns 200
     v
3. client starts
     |
     | vite dev server listening on :5173
     v
   Ready
```

The server has a 30-second `start_period` on its health check to allow time for `prisma db push` and `prisma generate` to complete before Docker starts checking.

## Makefile Commands

The Makefile wraps Docker Compose commands for convenience.

### Core Commands

| Command | Action |
|---------|--------|
| `make dev` | `docker compose up --build` (foreground, with live logs) |
| `make up` | `docker compose up -d --build` (detached) |
| `make down` | `docker compose down` |
| `make restart` | `down` then `up -d --build` |

### Database Commands

| Command | Action |
|---------|--------|
| `make db-push` | `docker compose exec server npx prisma db push` |
| `make db-migrate` | `docker compose exec server npx prisma migrate dev` |
| `make db-reset` | `docker compose exec server npx prisma migrate reset --force` |
| `make db-studio` | `docker compose exec server npx prisma studio --port 5555` |
| `make db-seed` | `docker compose exec server npx tsx src/seed.ts` |

### Shell Access

| Command | Action |
|---------|--------|
| `make shell-server` | Open a shell in the server container |
| `make shell-client` | Open a shell in the client container |
| `make shell-db` | Open a `psql` session |

### Logs

| Command | Action |
|---------|--------|
| `make logs` | Tail all service logs |
| `make logs-server` | Tail server logs only |
| `make logs-client` | Tail client logs only |
| `make logs-db` | Tail database logs only |

### Cleanup

| Command | Action |
|---------|--------|
| `make clean` | Stop and remove containers and orphan containers |
| `make clean-volumes` | Above + remove database volume (destroys data) |
| `make clean-all` | Above + remove images and `node_modules`/`dist` directories |

## Environment Variables

The `.env` file (not committed) provides database credentials. Expected variables:

| Variable | Example | Used By |
|----------|---------|---------|
| `POSTGRES_USER` | `budget` | db service |
| `POSTGRES_PASSWORD` | `password` | db service |
| `POSTGRES_DB` | `budget_tracker` | db service |
| `DATABASE_URL` | `postgresql://budget:password@db:5432/budget_tracker` | server service |

Note that `DATABASE_URL` uses `db` as the hostname -- this resolves within the Docker network to the database container.

## Local Development Without Docker

While Docker is the primary development method, you can run services locally:

```bash
make install          # npm install in both server/ and client/
make typecheck        # TypeScript type checking (both projects)
```

You will need a local PostgreSQL instance and must set `DATABASE_URL` accordingly. The Vite proxy expects the server at `http://server:3001`, which will not resolve outside Docker -- you would need to update `vite.config.ts` to point to `http://localhost:3001`.
