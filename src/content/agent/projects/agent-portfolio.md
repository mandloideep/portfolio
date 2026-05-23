# deepmandloi.com

This site. A dual-mode portfolio: visitors land on a chooser, then go to
either a polished browser bento at `/` or a claude-code-style terminal
at `/terminal`. The terminal mode wraps a small agent that answers
questions about Deep using the markdown corpus you're reading right now.

## Stack

TanStack Start (React 19), Tailwind v4, Magic UI components installed
via the shadcn CLI. The agent talks to OpenRouter over plain HTTP. No
adapter library, just `fetch` and SSE.

## Design choices worth naming

One repo, one deploy, two front doors. A chooser at `/` writes
`localStorage["portfolio.mode"]` and skips the chooser on return visits.

Theme tokens as a registry. `src/content/themes.ts` is a typed array;
CSS variables get generated at SSR. Adding a theme means adding one
object.

Content split. Structured data (status enums, tags) lives in
`src/content/site.ts`. Prose lives in `src/content/agent/**.md`. A
`pnpm check-content` script asserts the two stay in sync.

No telemetry theatre. Activity lines in the terminal show real server
steps, not fake spinners.

## Status

WIP. Phase 0 closes a shared foundation; phases 8 and 9 build the UI
side and the terminal side respectively.
