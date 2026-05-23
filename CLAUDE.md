<!-- intent-skills:start -->
## Skill Loading (TanStack Intent)

Before substantial work:
- Skill check: run `pnpm dlx @tanstack/intent@latest list`, or use skills already listed in context.
- Skill guidance: if one local skill clearly matches the task, run `pnpm dlx @tanstack/intent@latest load <package>#<skill>` and follow the returned `SKILL.md`.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.

Use the installed TanStack Intent skills and package-shipped guidance **before** making architectural or library-specific changes. Do not guess when a shipped skill can tell you the current pattern.
<!-- intent-skills:end -->

## Project rules

### Frontend skills — required before any frontend work

Before planning or executing any frontend-related task (UI, layout, styling, accessibility, animation, component architecture, performance), invoke the following skills in this order and follow their guidance:

1. `/frontend-design`
2. `/vercel-react-best-practices`
3. `/web-design-guidelines`
4. `/vercel-composition-patterns`

This is a hard rule, not a suggestion. Skipping these skills is a process violation.

### Component sourcing — Magic UI first, shadcn fallback

For every new UI component the codebase needs:

1. First check the [Magic UI](https://magicui.design) registry for an equivalent.
2. If Magic UI has one, install it via the shadcn CLI:
   `pnpm dlx shadcn@latest add "https://magicui.design/r/<component>.json"`
3. Only fall back to plain shadcn/ui (`pnpm dlx shadcn@latest add <name>`) when no Magic UI equivalent exists.
4. Document the chosen source in the component's file header comment when the choice is non-obvious.

Do not hand-write components that have a Magic UI or shadcn equivalent.

### Stack snapshot

- Framework: **TanStack Start (React 19)** — file-based router under `src/routes/`.
- Data: **TanStack Query**, **TanStack Form**, **TanStack Store**.
- AI: **@tanstack/ai** + provider adapters (Anthropic default, OpenAI/Gemini/Ollama bundled). AI Chat starter at `src/routes/demo/ai-chat.tsx`.
- UI: **shadcn/ui** + **Magic UI** (Tailwind v4, `tw-animate-css`, lucide-react).
- DB: **Drizzle ORM** → Postgres. Dev = docker postgres; Prod = **Neon** serverless.
- Tooling: **Biome** (lint/format), **pnpm** 10.30.0, **Node 24**, **Vite 8**.
- Devtools: TanStack Devtools mounted via `@tanstack/devtools-vite` (first plugin in `vite.config.ts`).

### Workflow guardrails

- Package manager: **pnpm only**. Do not run npm/yarn/bun commands.
- Lint/format: `pnpm check` (biome check), `pnpm format`, `pnpm lint`.
- DB migrations: `pnpm db:generate` → review the SQL in `./drizzle/` → `pnpm db:push` (dev) or against Neon `DATABASE_URL` (prod).
- Never commit `.env.development` / `.env.production` / `.env.local`. Use `.env.example` as the documented surface.
- See **AGENTS.md** for durable project context (CLI command used, env vars, deploy notes, architectural decisions, gotchas, next steps).
