# ─────────────────────────────────────────────────────────────────────────
# Portfolio — local dev orchestration
#
# Wraps the docker compose stack (app + postgres 17) and the common
# Drizzle commands. Run `make help` for the full menu.
#
# Host port mapping:
#   web  →  http://localhost:3000
#   db   →  localhost:5433  (mapped to container 5432)
# ─────────────────────────────────────────────────────────────────────────

COMPOSE        ?= docker compose
COMPOSE_FILE   ?= docker-compose.yml
DB_SERVICE     ?= db
APP_SERVICE    ?= app
DB_USER        ?= postgres
DB_NAME        ?= portfolio
PNPM           ?= pnpm

.DEFAULT_GOAL := help

# ─── Compose lifecycle ───────────────────────────────────────────────────

.PHONY: up
up: ## Start the full stack in the background (app + db)
	$(COMPOSE) up -d --build

.PHONY: up-fg
up-fg: ## Start the stack in the foreground (tail logs inline)
	$(COMPOSE) up --build

.PHONY: down
down: ## Stop containers and remove the network (volumes kept)
	$(COMPOSE) down

.PHONY: nuke
nuke: ## Stop, remove containers + volumes + locally built images (destructive)
	$(COMPOSE) down -v --rmi local --remove-orphans

.PHONY: restart
restart: down up ## Restart the whole stack

.PHONY: rebuild
rebuild: ## Rebuild the app image without cache and recreate containers
	$(COMPOSE) build --no-cache $(APP_SERVICE)
	$(COMPOSE) up -d --force-recreate $(APP_SERVICE)

.PHONY: ps
ps: ## Show container status
	$(COMPOSE) ps

.PHONY: logs
logs: ## Tail logs for all services
	$(COMPOSE) logs -f --tail=100

.PHONY: logs-app
logs-app: ## Tail logs for the app container only
	$(COMPOSE) logs -f --tail=200 $(APP_SERVICE)

.PHONY: logs-db
logs-db: ## Tail logs for the postgres container only
	$(COMPOSE) logs -f --tail=200 $(DB_SERVICE)

# ─── Shell-ins ───────────────────────────────────────────────────────────

.PHONY: sh
sh: ## Open a shell inside the app container
	$(COMPOSE) exec $(APP_SERVICE) sh

.PHONY: psql
psql: ## Open psql against the dev database
	$(COMPOSE) exec $(DB_SERVICE) psql -U $(DB_USER) -d $(DB_NAME)

.PHONY: psql-host
psql-host: ## Open psql from the host (requires local psql client)
	psql postgres://$(DB_USER):postgres@localhost:5433/$(DB_NAME)

# ─── Database ───────────────────────────────────────────────────────────

.PHONY: db-push
db-push: ## Apply schema (drizzle-kit push) inside the app container
	$(COMPOSE) exec $(APP_SERVICE) $(PNPM) db:push

.PHONY: db-generate
db-generate: ## Generate a migration from schema diffs
	$(COMPOSE) exec $(APP_SERVICE) $(PNPM) db:generate

.PHONY: db-migrate
db-migrate: ## Apply pending drizzle migrations
	$(COMPOSE) exec $(APP_SERVICE) $(PNPM) db:migrate

.PHONY: db-studio
db-studio: ## Open Drizzle Studio (browser UI for the dev DB)
	$(COMPOSE) exec $(APP_SERVICE) $(PNPM) db:studio

.PHONY: db-reset
db-reset: ## Drop the db volume and re-init (DESTRUCTIVE)
	$(COMPOSE) rm -sf $(DB_SERVICE)
	docker volume rm portfolio_portfolio-db-data 2>/dev/null || true
	$(COMPOSE) up -d $(DB_SERVICE)

# ─── Code quality ────────────────────────────────────────────────────────

.PHONY: install
install: ## Install dependencies inside the app container
	$(COMPOSE) exec $(APP_SERVICE) $(PNPM) install

.PHONY: test
test: ## Run the test suite
	$(COMPOSE) exec $(APP_SERVICE) $(PNPM) test

.PHONY: lint
lint: ## Biome lint
	$(COMPOSE) exec $(APP_SERVICE) $(PNPM) lint

.PHONY: format
format: ## Biome format --write
	$(COMPOSE) exec $(APP_SERVICE) $(PNPM) format

.PHONY: check
check: ## Biome check (lint + format dry-run)
	$(COMPOSE) exec $(APP_SERVICE) $(PNPM) check

.PHONY: typecheck
typecheck: ## tsc --noEmit
	$(COMPOSE) exec $(APP_SERVICE) $(PNPM) exec tsc --noEmit

.PHONY: build
build: ## Production build inside the container
	$(COMPOSE) exec $(APP_SERVICE) $(PNPM) build

# ─── Bootstrap ───────────────────────────────────────────────────────────

.PHONY: env
env: ## Copy .env.example → .env.development if it doesn't exist
	@test -f .env.development || cp .env.example .env.development
	@echo "→ .env.development ready. Fill OPENROUTER_API_KEY, GITHUB_TOKEN, GITHUB_USERNAME."

.PHONY: bootstrap
bootstrap: env up ## env + up — first-run convenience
	@echo "→ stack starting; once healthy, run 'make db-push' to apply the schema."

.PHONY: doctor
doctor: ## Sanity-check the active LLM provider key inside the container
	@$(COMPOSE) exec $(APP_SERVICE) node -e '\
		const p = (process.env.LLM_PROVIDER || "openrouter").trim(); \
		const vp = (process.env.VITE_LLM_PROVIDER || "openrouter").trim(); \
		const need = p === "gemini" ? "GEMINI_API_KEY" : "OPENROUTER_API_KEY"; \
		const v = (process.env[need] || "").trim(); \
		if (p !== vp) { console.error("✗ LLM_PROVIDER (" + p + ") != VITE_LLM_PROVIDER (" + vp + "). The terminal model list will be wrong."); process.exit(1); } \
		if (!v) { console.error("✗ LLM_PROVIDER=" + p + " but " + need + " is empty. Set it in .env.development and run \"make restart\"."); process.exit(1); } \
		console.log("✓ " + p + " provider configured (" + need + " set, " + v.length + " chars)."); \
		console.log("  Note: editing .env.development requires \"make restart\" — docker only reads env_file at container start.");'

# ─── Help ────────────────────────────────────────────────────────────────

.PHONY: help
help: ## Show this help
	@awk 'BEGIN {FS = ":.*?## "; printf "\nUsage: make <target>\n\nTargets:\n"} \
		/^[a-zA-Z0-9_-]+:.*?## / {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}' \
		$(MAKEFILE_LIST)
	@echo ""
	@echo "Quick start:"
	@echo "  make bootstrap     # copy env + bring stack up"
	@echo "  make db-push       # apply Drizzle schema"
	@echo "  open http://localhost:3000"
	@echo ""
