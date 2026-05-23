<!-- intent-skills:start -->
## Skill Loading

Before substantial work:
- Skill check: run `pnpm dlx @tanstack/intent@latest list`, or use skills already listed in context.
- Skill guidance: if one local skill clearly matches the task, run `pnpm dlx @tanstack/intent@latest load <package>#<skill>` and follow the returned `SKILL.md`.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.
<!-- intent-skills:end -->

# Portfolio — Project Context

This file is the durable knowledge base for human + agent collaboration on the
repo. The block above is managed by `@tanstack/intent` — do not edit between
the markers; agent rules and project rules live in **CLAUDE.md**.

## Scaffold provenance

Bootstrapped with the official TanStack CLI. Exact command used:

```bash
npx @tanstack/cli@latest create my-tanstack-app \
  --target-dir . \
  --framework React \
  --add-ons ai,shadcn,store,tanstack-query,form,drizzle,neon \
  --toolchain biome \
  --intent \
  --package-manager pnpm \
  --no-git --force --yes --non-interactive
```

Notes on what was adjusted from the user-supplied command:
- `--agent` is not a flag on the current CLI; `--intent` is the documented
  equivalent and is what wires `AGENTS.md` / `CLAUDE.md`.
- `--tailwind` is now a deprecated compatibility flag (Tailwind is always
  enabled); dropped from the command.
- Added `neon` and `biome` as explicit add-ons (Neon is the prod DB; biome is
  the requested toolchain). The `biome` toolchain add-on is in addition to
  `--toolchain biome` and ensures the config + scripts ship.
- Added `drizzle` (the original command lacked a DB layer).
- `--target-dir .` + `--force` + `--no-git` so the scaffold lands directly in
  the existing `portfolio` repo rather than a `my-tanstack-app/` subdirectory.

After scaffolding: `package.json` was edited to set
`"name": "portfolio"`, `"version": "0.1.0"`, `"packageManager": "pnpm@10.30.0"`.

## Stack & integrations

| Layer       | Tech                                                                       |
|-------------|----------------------------------------------------------------------------|
| Framework   | TanStack Start (React 19), file-based router (`src/routes/`)               |
| Data fetch  | `@tanstack/react-query` + `@tanstack/react-router-ssr-query`               |
| Forms       | `@tanstack/react-form`                                                     |
| State       | `@tanstack/store` + `@tanstack/react-store`                                |
| AI          | `@tanstack/ai` + adapters (Anthropic/OpenAI/Gemini/Ollama)                 |
| UI          | shadcn/ui + Magic UI components, Tailwind v4, `tw-animate-css`, lucide    |
| DB / ORM    | Drizzle ORM (`drizzle-orm`, `drizzle-kit`) on Postgres                     |
| Prod DB     | Neon (`@neondatabase/serverless`)                                          |
| Dev DB      | Local Postgres 16 (via `docker-compose.yml`) or Neon Launchpad (vite)      |
| Lint/format | Biome 2.x                                                                  |
| Devtools    | `@tanstack/devtools` + `@tanstack/devtools-vite` (must be first plugin)    |
| Runtime     | Node 24, pnpm 10.30.0, Vite 8                                              |

## Required env vars

Defined in `.env.example`. Per-environment copies in `.env.development`,
`.env.production`, and `.env.local` (never commit the populated files).

| Var                    | Purpose                                                                           |
|------------------------|-----------------------------------------------------------------------------------|
| `DATABASE_URL`         | Primary Postgres connection. Dev: docker postgres. Prod: Neon (unpooled).         |
| `DATABASE_URL_POOLER`  | Optional pooled Neon URL — use for app runtime; keep `DATABASE_URL` for migrations. |
| `ANTHROPIC_API_KEY`    | Default provider for the AI Chat starter (`anthropicText`).                       |
| `OPENAI_API_KEY`       | Optional — switch via `openaiText()` adapter.                                     |
| `GOOGLE_API_KEY`       | Optional — `geminiText()`.                                                        |
| `XAI_API_KEY` / `GROQ_API_KEY` / `OPENROUTER_API_KEY` | Optional alternative AI adapters.                  |
| `NODE_ENV`             | `development` / `production`.                                                      |
| `PORT`                 | Server port (defaults to 3000).                                                    |

## Deployment

### Development
```bash
# All-in-one (app + postgres):
docker compose up --build

# Or run app on host + only the DB in docker:
docker compose up -d db
pnpm dev
```

### Production
```bash
# Build & run prod container (Neon is external — set DATABASE_URL in .env.production):
docker compose -f docker-compose.prod.yml up -d --build
```

### Migrations
```bash
pnpm db:generate    # produces SQL in ./drizzle
pnpm db:push        # applies against $DATABASE_URL (use unpooled URL for Neon)
pnpm db:studio      # local UI
```

## Architectural decisions

- **Scaffold into repo root** rather than a `my-tanstack-app/` subdir. One repo,
  one app — keeps Docker/CI/portfolio metadata at the same level as code.
- **Drizzle over Prisma**: ships with a TanStack Intent skill, smaller runtime,
  edge-compatible. Pair with `@neondatabase/serverless` for the prod HTTP driver.
- **Neon in prod, local Postgres in dev**: `src/db/index.ts` uses
  `drizzle-orm/node-postgres` which works against either, so no env-branched
  code is required. The neon-serverless client is available at `src/db.ts`
  for code paths that need the HTTP driver (edge runtimes).
- **Magic UI first, shadcn fallback**: see CLAUDE.md. Both install via the
  shadcn CLI so the component sourcing pipeline is uniform.
- **Biome over ESLint+Prettier**: single tool, faster, less config.

## Known gotchas

- `@tanstack/devtools-vite` **must be the first plugin** in `vite.config.ts`
  (currently is). Moving it breaks source inspection.
- Neon HTTP driver does not support multi-statement transactions — use the
  pooled standard Postgres connection (`@neondatabase/serverless` exports a
  `Pool`) for transactional work, or run heavy migrations against the
  unpooled URL.
- `--tailwind` and `--no-tailwind` flags on `@tanstack/cli` are deprecated;
  Tailwind is always on. Re-running the CLI with `--no-tailwind` won't remove
  it.
- The scaffold ships demo routes under `src/routes/demo/*`. Treat them as
  reference, not production code — delete or replace per feature.
- `db/init.sql` seeds the local docker postgres on first boot only. To
  re-seed, drop the `portfolio-db-data` volume:
  `docker compose down -v && docker compose up`.
- `vite-plugin-neon-new` (in `neon-vite-plugin.ts`) launches a Neon-hosted
  ephemeral dev DB if `DATABASE_URL` is empty. When using the docker compose
  postgres, make sure `DATABASE_URL` is set in `.env.development` so the
  plugin doesn't conflict.
- AI Chat starter defaults to **Anthropic**. Set `ANTHROPIC_API_KEY` or swap
  the adapter in `src/routes/demo/api.ai.chat.ts` to your provider before the
  chat will respond.

## Next steps

1. Set `ANTHROPIC_API_KEY` (or another provider's key) in `.env.local`.
2. `docker compose up -d db && pnpm db:push` to apply the initial schema.
3. Replace the demo routes (`src/routes/demo/*`) with portfolio-specific pages.
4. Add Magic UI hero / showcase components per `CLAUDE.md`'s sourcing rule.
5. Configure deployment target — Cloudflare/Netlify/Railway/Nitro via
   `@tanstack/cli create --deployment ...` add-ons if you decide to move off
   the Docker prod image.

