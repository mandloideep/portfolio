# 01 — Information Architecture

## Route tree

```
/                        UI portfolio (static, SEO-first)
/terminal                Claude Code–style agentic terminal
/api/agent               POST — OpenRouter SSE proxy
/api/github-graph        GET  — cached contributions JSON
/api/weather             GET  — open-meteo + ip-api lookup
/sitemap.xml             generated from siteMeta + projects
/robots.txt              static
```

All TanStack Start file routes under `src/routes/`. Server-only routes live under `src/routes/api/` and export request handlers (TanStack Start server file routes).

## The chooser overlay

On first visit to `/`, render a centered overlay over the UI body:

```
┌─────────────────────────────────────┐
│  hey, I'm deep.                     │
│                                     │
│  pick your experience:              │
│                                     │
│  [ open in terminal → /terminal ]   │
│  [ continue to portfolio →  /    ]  │
│                                     │
│  □ remember my choice               │
└─────────────────────────────────────┘
```

- localStorage key: `portfolio.mode` with values `terminal | ui | undecided`.
- If set, skip overlay on future visits (and auto-redirect to `/terminal` if `terminal`).
- Always reachable from a tiny `?chooser=1` query param to reset.
- Rendered with view transitions — the overlay fades, doesn't block scroll/SSR HTML beneath.

The overlay is *visual*, not a separate route — the UI page is already SSR'd behind it. This keeps `/` SEO-friendly: crawlers receive the full portfolio body.

## SEO strategy

| Concern | Approach |
|---|---|
| First paint | Prerender `/` and `/terminal` at build time. `/terminal` ships interactive JS but its HTML body contains the full markdown corpus inside a `<div hidden aria-hidden="true">` for indexing. |
| Title / description | Driven from `siteMeta` constant. Per-route overrides via TanStack Router `head()`. |
| Open Graph + Twitter | Default OG image at `/og.png` (static asset, designed once). Per-route override possible. |
| JSON-LD | `<script type="application/ld+json">` on `/` with a `Person` schema (name, url, sameAs links from `siteMeta`). |
| Sitemap | `/sitemap.xml` route returns generated XML covering `/`, `/terminal`, and any project deep-links. |
| Robots | Static `/robots.txt` allows all, points to sitemap. |
| `<noscript>` fallback on `/terminal` | A short message + link to `/` so JS-disabled crawlers/users still get value. |

## Static vs dynamic boundaries

- **Static (prerendered):** `/`, `/terminal` shell, `/sitemap.xml`, `/robots.txt`.
- **Dynamic (server runtime):** `/api/agent` (streams from OpenRouter), `/api/weather` (per-request geo).
- **Cached (server memory + HTTP cache-control):** `/api/github-graph` (1h TTL).

## File layout under `src/`

```
src/
├── routes/
│   ├── __root.tsx
│   ├── index.tsx            # UI portfolio
│   ├── terminal.tsx         # terminal experience
│   ├── sitemap.xml.ts
│   └── api/
│       ├── agent.ts
│       ├── github-graph.ts
│       └── weather.ts
├── content/                 # see 06-content-model.md
├── components/
│   ├── ui/                  # shadcn primitives
│   ├── magic/               # magic-ui components
│   ├── terminal/            # terminal-specific blocks
│   └── portfolio/           # UI-mode sections
├── lib/
│   ├── openrouter.ts        # client for /api/agent
│   ├── github.ts            # GitHub GraphQL helper
│   ├── vfs.ts               # fake filesystem for shell mode
│   └── theme.ts             # theme registry
└── store/
    └── terminal.ts          # TanStack Store for terminal state
```

## URL contract for cross-mode links

- From terminal: `/ui` command → `window.location.href = '/'`.
- From UI: a small `[ open in terminal ]` link in the contact section → `/terminal`.
- Project deep-link from UI: `/?project=mydininghall` scrolls + expands the card.
- Project deep-link from terminal: not a URL; `/projects mydininghall` opens the card inside the terminal.
