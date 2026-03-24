.PHONY: help dev up down restart build logs logs-server logs-client logs-db \
       status ps shell-server shell-client shell-db \
       db-migrate db-migrate-create db-reset db-studio db-seed \
       clean clean-volumes clean-all \
       install install-server install-client \
       lint typecheck

# ──────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────

COMPOSE := docker compose
SERVER  := $(COMPOSE) exec server
CLIENT  := $(COMPOSE) exec client
DB      := $(COMPOSE) exec db

# Default target
.DEFAULT_GOAL := help

# ──────────────────────────────────────────────
# Help
# ──────────────────────────────────────────────

help: ## Show this help message
	@echo ""
	@echo "Budget Tracker — Development Commands"
	@echo "======================================"
	@echo ""
	@echo "Usage: make <target>"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"} \
		/^##@/ { printf "\n\033[1;36m%s\033[0m\n", substr($$0, 5) } \
		/^[a-zA-Z_-]+:.*##/ { printf "  \033[1;33m%-20s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)
	@echo ""

# ──────────────────────────────────────────────
##@ Getting Started
# ──────────────────────────────────────────────

dev: ## Start all services in development mode (builds if needed)
	$(COMPOSE) up --build

up: ## Start all services in the background
	$(COMPOSE) up -d --build

down: ## Stop all services
	$(COMPOSE) down

restart: ## Restart all services
	$(COMPOSE) down
	$(COMPOSE) up -d --build

# ──────────────────────────────────────────────
##@ Service Management
# ──────────────────────────────────────────────

build: ## Rebuild all containers without starting
	$(COMPOSE) build

build-server: ## Rebuild only the server container
	$(COMPOSE) build server

build-client: ## Rebuild only the client container
	$(COMPOSE) build client

start-server: ## Start only the server and database
	$(COMPOSE) up -d db server

start-client: ## Start only the client (assumes server is running)
	$(COMPOSE) up -d client

stop-server: ## Stop the server container
	$(COMPOSE) stop server

stop-client: ## Stop the client container
	$(COMPOSE) stop client

status: ## Show status of all containers
	$(COMPOSE) ps

ps: status ## Alias for status

# ──────────────────────────────────────────────
##@ Logs
# ──────────────────────────────────────────────

logs: ## Tail logs from all services
	$(COMPOSE) logs -f

logs-server: ## Tail logs from the server
	$(COMPOSE) logs -f server

logs-client: ## Tail logs from the client
	$(COMPOSE) logs -f client

logs-db: ## Tail logs from the database
	$(COMPOSE) logs -f db

# ──────────────────────────────────────────────
##@ Shell Access
# ──────────────────────────────────────────────

shell-server: ## Open a shell in the server container
	$(SERVER) sh

shell-client: ## Open a shell in the client container
	$(CLIENT) sh

shell-db: ## Open a psql session in the database container
	$(DB) psql -U budget -d budget_tracker

# ──────────────────────────────────────────────
##@ Database
# ──────────────────────────────────────────────

db-push: ## Push Prisma schema to the database (creates/updates tables)
	$(SERVER) npx prisma db push

db-migrate: ## Create and run a new Prisma migration (interactive)
	$(SERVER) npx prisma migrate dev

db-reset: ## Reset the database (destroys all data, re-runs migrations)
	$(SERVER) npx prisma migrate reset --force

db-studio: ## Open Prisma Studio (database browser) on port 5555
	$(SERVER) npx prisma studio --port 5555 --browser none

db-seed: ## Seed the database with sample data
	$(SERVER) npx tsx src/seed.ts

# ──────────────────────────────────────────────
##@ Local Development (without Docker)
# ──────────────────────────────────────────────

install: install-server install-client ## Install dependencies for both server and client

install-server: ## Install server dependencies locally
	cd server && npm install

install-client: ## Install client dependencies locally
	cd client && npm install

typecheck: ## Run TypeScript type checking on server and client
	cd server && npx tsc --noEmit
	cd client && npx tsc -b --noEmit

# ──────────────────────────────────────────────
##@ Cleanup
# ──────────────────────────────────────────────

clean: ## Stop services and remove containers
	$(COMPOSE) down --remove-orphans

clean-volumes: ## Stop services and remove containers + database volume (destroys data)
	$(COMPOSE) down -v --remove-orphans

clean-all: ## Full cleanup: containers, volumes, images, and local node_modules
	$(COMPOSE) down -v --remove-orphans --rmi local
	rm -rf server/node_modules client/node_modules
	rm -rf server/dist client/dist
