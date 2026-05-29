# 05 — Tech & Libraries

## Stack at a glance

| Concern | Choice |
|---|---|
| Framework | TanStack Start (already installed) + React 19 |
| Routing | TanStack Router file routes (`src/routes/`) |
| Data fetching | TanStack Query (for `/api/github-graph` etc.) |
| Client state | TanStack Store (terminal scrollback, mode, theme) |
| Styling | Tailwind v4 (Vite plugin, already configured) |
| UI lib (UI mode) | Magic UI first, shadcn fallback |
| LLM gateway | OpenRouter (direct HTTP, no adapter library) |
| Markdown | `react-markdown` + `remark-gfm` + `rehype-shiki` |
| Animations | `motion` (the new framer-motion) |
| Icons | `lucide-react` (already installed) |
| Form | none required (terminal handles its own input) |
| DB | not used in v1 (Drizzle remains installed for future) |

## Packages to add

```
pnpm add react-markdown remark-gfm rehype-shiki shiki motion
```

(plus shadcn/magic-ui components via the CLI — those aren't pnpm deps.)

## Packages to remove

```
pnpm remove @tanstack/ai @tanstack/ai-anthropic @tanstack/ai-openai \
            @tanstack/ai-gemini @tanstack/ai-ollama @tanstack/ai-react \
            @tanstack/ai-client
```

Reason: OpenRouter is plain HTTP; the adapters add weight without value for our single-provider proxy. Keep `@tanstack/react-form` and `@tanstack/react-store` (we use the store).

## Terminal rendering — why hand-rolled, not xterm.js

The terminal is a **scrollback log of React blocks**, not a PTY. Each block is one of:

```ts
type Block =
  | { kind: 'banner' }
  | { kind: 'prompt-line'; cwd: string; input: string }
  | { kind: 'output-text'; text: string }
  | { kind: 'output-markdown'; markdown: string; streaming?: boolean }
  | { kind: 'activity'; step: string; detail?: string }
  | { kind: 'card-project'; project: Project }
  | { kind: 'card-heatmap'; data: GitHubGraph }
  | { kind: 'card-weather'; data: Weather }
  | { kind: 'error'; message: string }
```

xterm.js would force us into a character grid; we want rich React. We get auto-scroll, keyboard nav, command history with ~150 lines of well-typed code.

State store (`src/store/terminal.ts`):

```ts
type TerminalState = {
  mode: 'agent' | 'shell'
  cwd: string
  blocks: Block[]
  history: string[]
  historyIndex: number
  draft: string
  streaming: boolean
  cancel: () => void
  model: string
  theme: string
}
```

## OpenRouter integration

**Server route** — `src/routes/api/agent.ts`:

- Accepts `POST { messages, model, contextSelector }`.
- Validates model against the allowlist.
- Loads relevant markdown via `import.meta.glob('../../content/agent/**/*.md', { as: 'raw', eager: true })` at module init.
- Builds the system prompt from `system-prompt.md` + selected files.
- Calls `https://openrouter.ai/api/v1/chat/completions` with `stream: true`.
- Re-emits as Server-Sent Events, injecting `activity` events around the upstream call.
- Headers: `Authorization: Bearer ${OPENROUTER_API_KEY}`, `HTTP-Referer: https://deepmandloi.com`, `X-Title: deep-portfolio`.

**Client** — `src/lib/openrouter.ts`:

- Tiny wrapper over `fetch` that exposes an async iterator of SSE events.
- Handles `AbortController` for Ctrl+C cancellation.

**Cost guardrails**:

- Each session has a soft cap (e.g., 50 messages or 100k tokens of LLM output); after that, friendly error.
- Per-IP rate limit (e.g., 30 LLM calls / minute) using an in-memory bucket. Future: move to a KV store.

## GitHub graph

`src/routes/api/github-graph.ts`:

- Calls GitHub GraphQL with `query { user(login: $u) { contributionsCollection { contributionCalendar { weeks { contributionDays { date count contributionLevel } } totalContributions } } } }`.
- In-memory cache: `{ data, fetchedAt }` keyed by username, TTL 1h.
- HTTP cache headers: `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`.
- Auth: `GITHUB_TOKEN` env var (read-only PAT, `read:user` scope).
- Used by both terminal (`/github`) and UI (heatmap section).

## Weather

`src/routes/api/weather.ts`:

- If `?city=` provided → geocode via open-meteo's geocoding API.
- Else → resolve client IP via `x-forwarded-for` → call `ipinfo.io` (free tier) for lat/lon.
- Fetch forecast from `api.open-meteo.com/v1/forecast`.
- Return `{ city, temp_c, condition, hourly }`.
- No auth needed for open-meteo. Cache per-city for 10 min.

## SSR / SEO config

TanStack Start config:

- `src/router.tsx` — enable `prerender: { enabled: true, filter: (route) => ['/', '/terminal'].includes(route.path) }`.
- `/terminal` route exports a `loader()` that reads all `content/agent/*.md` and stashes them on the route context. The route renders a `<div hidden aria-hidden="true">` with the markdown bodies for crawlers, plus the actual interactive terminal.
- `head()` per route returns `<title>`, `<meta name="description">`, OG/Twitter tags.
- `__root.tsx` injects JSON-LD `Person` schema and the favicon links.

## Env vars (added to `.env.example`)

```
OPENROUTER_API_KEY=
OPENROUTER_DEFAULT_MODEL=google/gemini-2.5-flash-lite

GITHUB_TOKEN=
GITHUB_USERNAME=deepmandloi    # used by /github and the heatmap

# optional
IPINFO_TOKEN=    # only if free-tier rate limits become an issue
```

Server-only — never imported into client bundles. TanStack Start file routes naturally split server code, but double-check via Vite manifest.

## Build & deploy notes

- `pnpm build` produces a Node server bundle + prerendered HTML.
- Deploy targets viable: Vercel, Fly, Railway, Cloudflare Workers (with `nodejs_compat`). Pick at deploy time.
- DNS: `deepmandloi.com` and `www.deepmandloi.com` → same app. (No second domain needed since we chose route split.)

## Out of scope for v1

- No service worker / PWA.
- No client-side tokenization for cost preview.
- No streaming voice / TTS for `/presentation`.
- No A/B between models — `/model` is purely user-driven.
- No tracing / OTel.
