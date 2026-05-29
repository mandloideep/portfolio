---
slug: workflow-builder
title: workflow builder
status: running
summary: self-hosted n8n-style automation tool — drag nodes on a canvas, wire them, fire from a webhook
pitch: deep built a workflow automation platform from scratch — react flow on the front, fastapi async on the back. it's the kind of tool he kept paying $20/mo for, so he wrote his own and hosts it on a single hetzner box.
endpoint: "curl -s workflow.deepmandloi.com/api/health"
cta: visit site
meta: self-hosted on hetzner · 18 api routes · 4 alembic migrations
tags:
  - FastAPI
  - React
  - ReactFlow
  - SQLAlchemy
  - TypeScript
  - Postgres
bullets:
  - drag-and-drop canvas with topological execution
  - refresh-token rotation with family revocation
  - credentials encrypted at rest with fernet
  - one-box deploy via dokploy + ghcr
links:
  live: https://workflow.deepmandloi.com
stats:
  - { value: "8.3k", label: "LOC", sublabel: "typescript + python", pulse: true }
  - { value: "79", label: "components", sublabel: "react + reactflow surface" }
  - { value: "4", label: "migrations", sublabel: "auth, tokens, encryption, schema" }
screenshots:
  - { path: "hero.png", caption: "canvas with a webhook → gmail → telegram chain" }
  - { path: "detail.png", caption: "execution trace with millisecond timings" }
---

# workflow builder

## overview

deep built a self-hosted automation tool in the n8n / zapier shape — a canvas where you drop integration nodes (webhook, gmail, telegram, slack), wire them together, and fire the chain by hitting a public webhook url. it's mostly for him: a place to glue his own services together without renting a saas slot, and a sandbox for shipping a real full-stack app end to end.

the frontend is 6,979 lines of typescript across 79 components — react 18, reactflow 11 for the graph, zustand for state, shadcn/ui on top of radix and tailwind. the backend is 1,343 lines of python — fastapi, sqlalchemy 2.0 async, pydantic 2, a small topological-sort executor that walks the graph and awaits each node handler. one repo, one docker image, one box.

## challenges

the async database migration was the first real wall. the project started on sync sqlalchemy + sqlite. moving to postgres meant rewriting every query path through `AsyncSession`, but the painful part was alembic. running migrations on startup inside fastapi's lifespan looks fine until you realize alembic's `command.upgrade()` calls `asyncio.run()` internally, which throws when there's already a running event loop. the fix was wrapping the upgrade call in `asyncio.to_thread()` so migrations run on a worker thread and the loop stays free. one stray blocking call elsewhere would have silently strangled concurrency without raising anything — async hygiene is brittle in a way that linters don't catch.

refresh-token rotation was the second one. naive rotation is easy; rotation that survives two browser tabs refreshing at the same time is not. deep designed a `refresh_tokens` table tracking `jti`, `family_id`, `used_at`, and `replaced_by`, with a 10-second grace window: if a token gets used twice within 10 seconds it's a concurrent tab, not theft, and a new pair is issued. past 10 seconds, the whole family is revoked and the user is forced to sign in again. signin itself runs a dummy argon2 hash on unknown emails so "wrong password" and "no such user" both take ~100ms — defeats the timing oracle. the whole flow is maybe 80 lines but every one of them is load-bearing.

the third was credentials at rest. third-party secrets — gmail app passwords, telegram bot tokens, slack webhook urls — were sitting in a plaintext json column. deep wrote a 30-line `db/encryption.py` wrapping `cryptography.Fernet`: serialize, encrypt, base64, store. the executor decrypts on load before dispatching to handlers. the trade-off is intentional: rotating `CREDENTIALS_ENCRYPTION_KEY` invalidates every stored credential, which forces real key-rotation discipline instead of pretending keys are forever.

## learnings

biggest takeaway: async python is one missed `await` away from quietly serializing everything. nothing crashes, latency just creeps up. deep now treats every new dependency as suspect until he's checked whether it has an async variant or runs through `asyncio.to_thread`.

second: security primitives are short but unforgiving. the refresh-token logic is the smallest file in the routers folder and the one he rewrote the most times. the 10-second grace window came from actually testing it in two safari windows and watching the family revoke fire on a legitimate refresh. constant-time signin came from reading a writeup about a timing attack on a different framework and realizing he'd built the same hole.

third: self-hosting on a single 4 gb hetzner box via dokploy + ghcr is a much better dev loop than he expected. manual deploy via `workflow_dispatch` (no auto-deploy on push) sounds clunky and is actually a feature — every deploy is a deliberate act, and rollback is "redeploy the previous tag." he'd default to this stack for every personal project going forward.

## stack

python 3.11 with fastapi 0.136 and sqlalchemy 2.0 on the async driver, postgres + alembic for the data layer, jwt via python-jose with argon2-cffi for passwords and fernet for credential encryption. react 18 + typescript + vite on the frontend, reactflow 11 for the canvas, zustand for state, tanstack query for server cache, shadcn/ui + tailwind for everything visible. python-telegram-bot, smtp for gmail, plain webhooks for slack. multi-stage dockerfile (node 24 alpine → python 3.14-slim), two uvicorn workers, ghcr image pushed by a manual github action, dokploy webhook for redeploy.

## what's next

more node types (discord, notion, sheets), a websocket execution trace so the canvas lights up live as a workflow runs, and a real test suite — the security audit doc flags it as the biggest hole and he agrees. after that, scheduled triggers (cron nodes) so workflows can fire without an inbound webhook.

---

## resume pointers

> Use proper case + action-verb-first phrasing here — resume voice, not portfolio voice.

### Project header (one-liner)

**Workflow Builder** — self-hosted workflow automation platform (n8n-style) · Python, FastAPI, React, TypeScript, PostgreSQL · [workflow.deepmandloi.com](https://workflow.deepmandloi.com)

### Bullets (pick 3–5)

- Built a full-stack workflow automation platform (~8.3k LOC across TypeScript and Python) with a React 18 + ReactFlow drag-and-drop canvas and a FastAPI + async SQLAlchemy 2.0 backend; deployed end-to-end on a single Hetzner host via Dokploy and GHCR.
- Designed a topological-sort execution engine that walks user-defined DAGs and dispatches async handlers for Gmail, Telegram, Slack, and inbound webhooks across 18 REST endpoints.
- Migrated the persistence layer from synchronous SQLite to asynchronous PostgreSQL; resolved an Alembic / asyncio event-loop conflict by running schema migrations on a worker thread via `asyncio.to_thread()`, keeping the FastAPI event loop unblocked during boot.
- Hardened authentication with refresh-token rotation, family-level revocation on replay, a 10-second concurrent-refresh grace window, and constant-time signin (dummy argon2 hash on unknown emails) to defeat token replay and timing-oracle attacks.
- Encrypted user-stored third-party credentials at rest using Fernet (AES-128-CBC + HMAC-SHA256) so a database dump alone cannot leak Gmail app passwords, Telegram bot tokens, or Slack webhook URLs.
- Packaged the full stack as a multi-stage Docker image (Node 24 Alpine build → Python 3.14-slim runtime, two uvicorn workers) released through a manual `workflow_dispatch` GitHub Action that pushes to GHCR and triggers a Dokploy redeploy.

### Tighter 3-line version (for a dense one-page resume)

- Built and shipped a full-stack n8n-style workflow automation tool (~8.3k LOC, 79 React components, 18 FastAPI routes); live at workflow.deepmandloi.com on a single Hetzner box.
- Migrated to async PostgreSQL on SQLAlchemy 2.0 and resolved an Alembic / asyncio event-loop conflict by running migrations on a worker thread, preserving non-blocking startup.
- Hardened auth (refresh-token rotation with family revocation + 10-second concurrent-refresh grace, constant-time signin) and encrypted stored third-party credentials at rest with Fernet.

### Framing tips by role

- **Backend / platform roles** — lead with the async migration bullet and the execution engine. Emphasize SQLAlchemy 2.0 async, the Alembic `asyncio.to_thread` fix, and topological sort over DAGs.
- **Security-leaning roles** — lead with refresh-token rotation and Fernet encryption. Mention constant-time signin and family revocation as concrete threat models (replay, timing oracle).
- **Full-stack / product roles** — lead with the React + ReactFlow canvas and the shadcn/ui component surface. Mention end-to-end ownership: design → backend → deploy.
- **DevOps / infra-leaning roles** — lead with the single-image multi-stage build, GHCR + Dokploy, and the manual-deploy discipline ("every deploy is a deliberate act").

### Skills line (for a skills section)

Python · FastAPI · async SQLAlchemy · PostgreSQL · Alembic · Pydantic · JWT / argon2 / Fernet · TypeScript · React 18 · ReactFlow · Zustand · TanStack Query · shadcn/ui · Tailwind · Docker · GitHub Actions · Dokploy · Hetzner

### Watch-outs

- Don't claim production traffic or users — there aren't any. Frame it as a personal infrastructure project, not a product.
- Don't say "scalable" or "production-grade" — say what's actually there (single box, two uvicorn workers, async DB, encryption at rest, manual deploy).
- Numbers that are honest and verifiable: 8.3k LOC, 79 components, 18 API routes, 4 Alembic migrations. Drop these — vague claims read worse than small specific ones.
