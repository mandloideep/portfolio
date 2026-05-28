# Skills

## Languages

TypeScript and Python are the daily drivers. Java for the Spring Boot
side of CommentDraw. JavaScript when a project still has unmigrated
files. SQL when the ORM is in the way. Bash for one-off operations.

## Backend

Spring Boot 3.5 on Java 25 for the SaaS surface. FastAPI on Python
for everything else; Workflow Builder runs on FastAPI + SQLAlchemy
2.0 async. Express on Node for the ACOSUS backend. Flask for the ML
service. Pydantic 2 for schemas; Zod when the schema is on the
TypeScript side.

## Frontend

React 19 with Vite. TanStack Query is the default for server cache;
Redux Toolkit + RTK Query when the API surface gets dense (CommentDraw,
ACOSUS). shadcn/ui on top of Radix + Tailwind 4. React Flow for any
graph-shaped UI. Lexical for rich-text. Recharts for dashboards.

## Data

Postgres is the default. Mongo when the schema actually is
document-shaped (ACOSUS). MySQL on Aiven for CommentDraw because the
free tier was good enough until it wasn't. Redis / DragonflyDB for
caches, queues, and distributed rate-limit state. Qdrant for vectors
in Atelier. SQLAlchemy 2.0 async, Mongoose, and JPA on the ORM side.
Deep has shipped against all three.

## AI

LangGraph + LangChain for the multi-branch RAG pipeline in Atelier.
scikit-learn for the production KNN in ACOSUS; TensorFlow lives in
the archived path. DeepEval for the eval pipeline (contextual
precision / recall / faithfulness scored at a 0.7 threshold). Gemini
2.5-flash as the default LLM (free tier), with OpenAI as the
fallback through a small factory. OpenRouter for the agent on this
site. Direct HTTP + SSE for streaming; no adapter library.

## Infra

Docker for everything that goes to prod. GitHub Actions for CI/CD,
typically a manual `workflow_dispatch` build to GHCR to Dokploy
webhook redeploy. Hetzner 4GB VPS for the side projects. Cloudflare
in front; Traefik terminating TLS via Let's Encrypt. Multi-stage
Dockerfiles to keep the runtime image small.

## Games

Call of Duty Mobile — qualified for the Indian regionals in 2020.
Mobile-first by conviction; he'll argue mobile beats PC and console.
Plays chess well enough to mean it.

## Fun

Anime, plus a manga and manhwa backlog he swears he'll finish. Cooks
most Indian dishes from memory, no recipe open. Types on a Kinesis
split keyboard. Chai over coffee, Taco Bell over every other fast
food — neither up for debate.
