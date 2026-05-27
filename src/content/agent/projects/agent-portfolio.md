# deepmandloi.com

## Overview

This site. A dual-mode portfolio: visitors land on a chooser, then go
to either a polished browser bento at `/` or a Claude-code-style
terminal at `/terminal`. The terminal mode wraps a small agent that
answers questions about Deep using the markdown corpus you're reading
right now.

The chat surface at `/chat` does the same thing in a softer pill +
quick-prompt layout. All three surfaces share the same theme tokens,
the same density steps, and the same OpenRouter pipe, so picking
Solarized Light in the terminal carries to the portfolio and the
chat.

## Challenges

Two front doors out of one repo. The mode chooser at `/` writes
`localStorage["portfolio.mode"]` and skips itself on return visits.
That sounds trivial until you try to ship SSR + a localStorage
read-on-mount + a redirect without flashing the wrong UI. The fix
was a tiny client-only redirect island that runs after hydration.
SSR serves the chooser, hydration decides whether to bounce to
`/terminal` or `/chat`.

Theme tokens as a typed registry. Each theme is a `{ slug, name,
vibe, tokens }` object in `src/content/themes.ts`; CSS variables get
emitted at SSR by `generateThemeCss`. Adding a theme means adding one
object, no edits to `styles.css`, no edits to component files.
`tailwind-merge` didn't know about the custom `--text-*` and
`--spacing-*` tokens, so `cn()` calls were silently dropping
`text-eyebrow` next to `text-muted/80` and rendering chips at the
wrong size. The fix was `extendTailwindMerge` with explicit class
groups for every custom token.

Content split. Structured data (status enums, tags, slugs) lives in
`src/content/site.ts`. Prose lives in `src/content/agent/**.md`. A
`pnpm check-content` script asserts the two stay in sync; if a
project's slug appears in `site.ts` without a markdown file, the
script exits non-zero in CI.

## Learnings

No telemetry theatre. Activity lines in the terminal show real server
steps (`loading theme registry`, `mounting command registry`,
`warming agent context`), not fake spinners. When something is
genuinely waiting (the OpenRouter handshake), the line says so.

One primitive per chrome shape. The chrome bar across portfolio,
chat, and terminal is six different controls (density toggle, theme
switcher, model picker, command hint, mode switcher, info chip).
Without a shared `<ChromeButton>` primitive every author picked a
slightly different radius / height / opacity, and the result felt
like six different controls because it *was* six different controls.
Consolidating into one component with explicit `size` and `tone`
variants, plus a `<ChromeButtonGroup>` for the segmented density
control, fixed the family resemblance.

## Stack

TanStack Start (React 19) with file-based routing under
`src/routes/`. TanStack Query for cache, TanStack Form for the chat
input, TanStack Store for the agent + theme + density stores.
Tailwind v4 with the design tokens in `@theme inline`; shadcn/ui +
Magic UI components installed through the shadcn CLI. The agent
talks directly to OpenRouter over `fetch` + SSE, no adapter library.
Drizzle ORM against Postgres for the rate-limit table (Neon
serverless in prod, Docker Postgres in dev). Biome for lint +
format, Vitest for tests, Playwright for the visual passes.

## Status

WIP. 34 commits in, 590 tests passing in CI, 7 themes registered,
and counting.
