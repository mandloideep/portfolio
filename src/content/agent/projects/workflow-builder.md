# Workflow Builder

## Overview

A small-scale, learning-focused take on n8n. Deep built it to
understand how visual workflow tools actually work under the hood,
not to compete with n8n. The shape is the same (a canvas where you
drop integration nodes, wire them together, fire the chain by hitting
a public webhook), but the scope is deliberately narrow: three node
types, one user, one box.

The point was to ship every layer end-to-end: a React Flow canvas
with proper graph state, a FastAPI backend with a topological-sort
DAG executor, real refresh-token rotation, credentials encrypted at
rest. It works, it runs on one Hetzner host, and it taught him most
of the things he'd want to know before tackling a real automation
platform.

The frontend is 6,979 lines of TypeScript across 79 components: React
18, ReactFlow 11 for the graph, Zustand for state, shadcn/ui on top
of Radix and Tailwind. The backend is 1,343 lines of Python: FastAPI,
SQLAlchemy 2.0 async, Pydantic 2, a small topological-sort executor
that walks the graph and awaits each node handler. One repo, one
Docker image, one box.

## Challenges

The async database migration was the first real wall. The project
started on sync SQLAlchemy + SQLite. Moving to Postgres meant
rewriting every query path through `AsyncSession`, but the painful
part was Alembic. Running migrations on startup inside FastAPI's
lifespan looks fine until you realize Alembic's `command.upgrade()`
calls `asyncio.run()` internally, which throws when there's already a
running event loop. The fix was wrapping the upgrade call in
`asyncio.to_thread()` so migrations run on a worker thread and the
loop stays free. One stray blocking call elsewhere would have
silently strangled concurrency without raising anything; async
hygiene is brittle in a way that linters don't catch.

Refresh-token rotation was the second one. Naive rotation is easy;
rotation that survives two browser tabs refreshing at the same time
is not. Deep designed a `refresh_tokens` table tracking `jti`,
`family_id`, `used_at`, and `replaced_by`, with a 10-second grace
window: if a token gets used twice within 10 seconds it's a
concurrent tab, not theft, and a new pair is issued. Past 10 seconds,
the whole family is revoked and the user is forced to sign in again.
Signin itself runs a dummy argon2 hash on unknown emails so "wrong
password" and "no such user" both take ~100ms, defeating the timing
oracle. The whole flow is maybe 80 lines but every one of them is
load-bearing.

The third was credentials at rest. Third-party secrets like Gmail app
passwords, Telegram bot tokens, and Slack webhook URLs were sitting
in a plaintext JSON column. Deep wrote a 30-line `db/encryption.py`
wrapping `cryptography.Fernet`: serialize, encrypt, base64, store.
The executor decrypts on load before dispatching to handlers. The
trade-off is intentional. Rotating `CREDENTIALS_ENCRYPTION_KEY`
invalidates every stored credential, which forces real key-rotation
discipline instead of pretending keys are forever.

## Learnings

Biggest takeaway: async Python is one missed `await` away from
quietly serializing everything. Nothing crashes, latency just creeps
up. Deep now treats every new dependency as suspect until he's
checked whether it has an async variant or runs through
`asyncio.to_thread`.

Second: security primitives are short but unforgiving. The
refresh-token logic is the smallest file in the routers folder and
the one he rewrote the most times. The 10-second grace window came
from actually testing it in two Safari windows and watching the
family revoke fire on a legitimate refresh. Constant-time signin came
from reading a writeup about a timing attack on a different framework
and realizing he'd built the same hole.

Third: self-hosting on a single 4GB Hetzner box via Dokploy + GHCR is
a much better dev loop than he expected. Manual deploy via
`workflow_dispatch` (no auto-deploy on push) sounds clunky and is
actually a feature, because every deploy is a deliberate act and
rollback is "redeploy the previous tag." He'd default to this stack
for every personal project going forward.

## Stack

Python 3.11 with FastAPI 0.136 and SQLAlchemy 2.0 on the async
driver, Postgres + Alembic for the data layer, JWT via python-jose
with argon2-cffi for passwords and Fernet for credential encryption.
React 18 + TypeScript + Vite on the frontend, ReactFlow 11 for the
canvas, Zustand for state, TanStack Query for server cache,
shadcn/ui + Tailwind for everything visible. python-telegram-bot,
SMTP for Gmail, plain webhooks for Slack. Multi-stage Dockerfile
(Node 24 Alpine to Python 3.14-slim), two uvicorn workers, GHCR image
pushed by a manual GitHub Action, Dokploy webhook for redeploy.

## What's next

This stays a learning project, not a product. The realistic next
steps are the ones that round out the lessons: a websocket execution
trace so the canvas lights up live as a workflow runs, a real test
suite (the security audit doc flags it as the biggest hole and he
agrees), and scheduled triggers (cron nodes) so workflows can fire
without an inbound webhook. New node types come if and when he needs
them for his own glue work.
