# 00 — Overview

## Elevator pitch

`deepmandloi.com` is a **dual-mode agentic portfolio**. Visitors choose between a Claude Code–style terminal experience (`/terminal`) where an LLM answers questions about Deep using local markdown context, or a polished browser portfolio (`/`) inspired by the same terminal aesthetic but elevated with Magic UI animations. One TanStack Start app, two entry points, one chooser on the root domain.

## Why this shape

- **Differentiation.** Most portfolios are a static page. A working agent that knows the candidate, plus an "exit to shell" Easter egg, is memorable and signals what the candidate cares about (agents, DX, infra).
- **SEO-safe.** The terminal is interactive, but its server-rendered HTML body still contains the full markdown corpus so crawlers index every word.
- **Cheap to run.** Default model is a sub-cent-per-million tier on OpenRouter; visitors can `/model` swap to anything.

## Source material — what we lifted from the sonephyo.com screenshots

- **Macros terminal chrome.** Fake macOS title bar `name — portfolio — 80×24`, traffic-light dots.
- **Tab row of `[/section]` chips** at the top — these are the slash-command equivalents.
- **`cat /section` echo line** above each panel — every section pretends a command produced it.
- **Expandable cards** with `▶ click to expand` / `▼ click to collapse`.
- **Bordered metric cards** with large green numbers + lowercase labels.
- **GitHub contribution heatmap** with month labels and Less→More legend.
- **Quip footer** (`$ No mice were harmed as of making this website. "`).
- **Color language.** Bright green for accents, blue for links/tags, gray for body.

We borrow the *vocabulary*; we don't clone the layout. The terminal mode goes deeper (real prompt, real streaming, themes); the UI mode goes wider (Magic UI flourishes, motion, bento).

## Decisions log (resolved with user)

| Decision | Choice | Rationale |
|---|---|---|
| Routing model | Single domain, route split | One deploy, simplest. `/` is UI, `/terminal` is agent. |
| Default LLM | `google/gemini-2.5-flash-lite` via OpenRouter | Cheapest viable tier; `/model` lets visitors swap. |
| `/presentation` | Auto-narrated agent tour, streamed | Showcases agents, gives a guided arc through all sections. |
| GitHub graph | Server route + cached PAT, ~1h TTL | No visitor rate-limit hits; full year of data. |
| Component sourcing | Magic UI first, shadcn fallback | Per CLAUDE.md. |

## Open questions (defer to implementation)

- Final theme palette names + hex values (placeholder list lives in `02-terminal-experience.md`).
- Whether to also stream the `/presentation` tour as audio (probably not, keep scope tight).
- Whether the chooser should auto-route mobile visitors to `/` regardless. (Lean: no, let users choose.)
- Whether to add a `/play` Easter egg (snake or doom-fire). Deferred.

## What's NOT in scope (yet)

- No blog/posts.
- No CMS — content lives in the repo (`src/content/`).
- No auth, no comments, no analytics dashboard.
- No internationalization.
