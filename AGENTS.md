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
| AI          | OpenRouter via direct HTTP (no adapter library); `src/lib/env.ts` validates keys |
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
| `OPENROUTER_API_KEY`   | Required at runtime. Validated by `src/lib/env.ts`.                               |
| `OPENROUTER_DEFAULT_MODEL` | Optional. Defaults to `google/gemini-2.5-flash-lite`.                         |
| `GITHUB_TOKEN`         | Required. `read:user` scope. Used by the contribution-graph route.                |
| `GITHUB_USERNAME`      | Required. Profile rendered on the heatmap.                                        |
| `IPINFO_TOKEN`         | Optional. Geo-resolves visitor IPs for the weather widget.                         |
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

### Production — Hetzner VPS + Dokploy

Production runs on a Hetzner VPS managed by [Dokploy](https://dokploy.com).
Dokploy handles Docker orchestration, Traefik with auto-TLS, env vars, and
scheduled tasks. See **[DEPLOYMENT.md](DEPLOYMENT.md)** for full setup: env
vars, Traefik middlewares (security headers + cache headers + body-size
limit), pre-deploy migration command, and budget-alert cron config.

Key conventions:
- Env vars live in Dokploy → Service → Environment (not in `.env.production` on disk).
- Migrations run as a pre-deploy step (`pnpm release:migrate`).
- Security headers are set via Traefik middleware, not in app code.
- Sentry is opt-in via `SENTRY_DSN` (server) and `VITE_SENTRY_DSN` (client).

### Migrations
```bash
pnpm db:generate     # produces SQL in ./drizzle
pnpm db:push         # dev/manual apply against $DATABASE_URL
pnpm release:migrate # alias for db:push, used in Dokploy pre-deploy hook
pnpm db:studio       # local UI
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
- **Theme tokens as a typed registry** (`src/content/themes.ts`): CSS variables
  are generated at SSR. Adding a theme = adding one object. See CLAUDE.md
  "Theme token system" for the contract.
- **OpenRouter direct HTTP** (no `@tanstack/ai*` packages — removed in Phase 0).
  The agent talks to OpenRouter via plain `fetch` + SSE. Env validation lives
  at `src/lib/env.ts` (Zod, server-only, lazy + cached).
- **Two content surfaces, intentionally split**: `src/content/site.ts` (typed,
  for the UI) and `src/content/agent/**/*.md` (prose, for the LLM). Kept in
  sync via `pnpm check-content`.
- **Mode chooser at `/`**: visitors pick `ui` or `terminal` once;
  `localStorage["portfolio.mode"]` persists the choice. `?choose=1` forces it.

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
- The route tree (`src/routeTree.gen.ts`) is auto-generated by the
  `tanstackStart()` vite plugin. After adding or renaming a route file, run
  `pnpm dev` briefly (or `pnpm build`) to regenerate before `pnpm tsc` will
  pass.
- Theme `[data-theme="..."]` CSS is **not** in `src/styles.css`; it's emitted
  at SSR from `src/content/themes.ts` via `generateThemeCss` and inlined into
  the root document's `<head>`. Hand-editing data-theme blocks anywhere else
  will get overwritten or silently ignored.

## Next steps

Deployment target is **Hetzner VPS + Dokploy** — see [DEPLOYMENT.md](DEPLOYMENT.md)
for the full pre-launch checklist (env vars, Traefik middlewares, migrations,
Sentry, budget alerts, smoke tests).

