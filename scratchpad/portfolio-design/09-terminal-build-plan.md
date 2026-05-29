# 09 — Terminal Build Plan

Picks up after `07-phase-0-foundation.md`. Builds the agentic terminal experience described in `02-terminal-experience.md` and `04-agents-and-commands.md`. PR-sized tasks.

## Phase 1 — Terminal chrome + scrollback  ✅ shipped

Block model, store, chrome, scrollback, status footer landed. `Block`
discriminated union (`prompt | output | markdown | error | system | activity`)
forces exhaustive rendering. Scrollback pins to bottom unless user scrolls up
(16px tolerance) and exposes `role="log" aria-live="polite"` for SR users.

**Files:**
- `src/lib/terminal/blocks.ts` — union + `makeBlock` + `newId` (UUID with counter fallback for older jsdom).
- `src/store/terminal.ts` — TanStack Store: `blocks`, `history`, `historyCursor`, `mode`, `booted`. Actions: `appendBlock`, `clearBlocks`, `pushHistory`, `setHistoryCursor`, `setBooted`, `setMode`, `emit`. History persists to `localStorage["portfolio.terminal.history"]`, capped at 100 with consecutive-dupe dedup.
- `src/components/terminal/chrome.tsx` — traffic-light bar, centered title.
- `src/components/terminal/scrollback.tsx` — flex container, IO-style scroll-pin via `onScroll` distance check.
- `src/components/terminal/block-row.tsx` — exhaustive switch with `assertNever` default.
- `src/components/terminal/status-footer.tsx` — mode pill + theme name + model placeholder; subscribes to both stores via `useStore`.

## Phase 2 — Input, history, shortcuts  ✅ shipped

Prompt, history traversal, all shortcuts, palette, and boot sequence landed.
`Ctrl+C` cancel is deferred to Phase 6 (no in-flight stream yet).

**Files:**
- `src/components/terminal/prompt.tsx` — controlled `<textarea>`, autogrow (1–8 rows), Enter submits, Shift+Enter newlines, ↑/↓ only traverse history when caret is on first/last line (so multi-line edits aren't hijacked), Ctrl+L clear, Ctrl+K palette, Tab does prefix or LCP completion. Refocuses on document clicks (skipping buttons, inputs, and `[role=dialog]`).
- `src/components/terminal/use-submit.ts` — `useSubmit()` hook returns the submit pipeline (append prompt block → pushHistory → runCommand → fallback). Uses a `submitRef` to break the recursion so `/retry` can call back into it.
- `src/components/terminal/command-palette.tsx` — shadcn `Dialog`, fuzzy filter (prefix > substring > description match), ↑/↓ to move active, Enter to submit. Reuses `useSubmit()`.
- `src/components/terminal/boot-sequence.tsx` — side-effect-only component; banner + 6 staggered `system` blocks (50ms each) → `setBooted(true)`. Under `prefers-reduced-motion`, all emit synchronously. Idempotent: noop when `state.booted`.

## Phase 3 — Local slash commands (no LLM)  ✅ shipped

All eight Phase-3 commands land in one registry. Handlers `emit()` into the
store rather than returning JSX. `runCommand(raw, deps)` returns `false` for
free text — Phase 6 will route those to the agent (today they get a
placeholder system block).

**File:** `src/lib/terminal/commands.ts`

Implemented: `/help`, `/clear`, `/history`, `/retry`, `/ui`, `/theme`,
`/github`, `/resume`. Plus helpers: `parseInput`, `findCommand`,
`autocomplete`, `runCommand`. `/theme` with no args lists slugs+vibes; with
an arg validates against `isThemeSlug` and calls `setTheme`. `/github` and
`/resume` open via a programmatic `<a target="_blank" rel="noopener noreferrer">`
click against `siteMeta.links`.

## Tests added in this phase

22 test files, 251 tests, all green. Notable patterns for phase-4+ pickup:
- Component tests mock `@tanstack/react-router`'s `useNavigate` via `vi.mock`
  rather than spinning up a memory router.
- `BootSequence` test uses `vi.useFakeTimers()` + a custom `matchMedia` mock
  to cover both timed and reduced-motion paths.
- Store tests reset state in `beforeEach` and clear `localStorage` (the
  global setup in `src/test/setup.ts` already clears after each test).

## Phase 4 — Content commands (static, markdown rendered)  ✅ shipped

All five content commands land plus a streamdown-backed markdown renderer.
Spec swap: used **streamdown** (already in deps, ships GFM + shiki + streaming)
instead of `react-markdown + remark-gfm + rehype-shiki` — Phase 6 will reuse
the same component for SSE token rendering.

**Files added:**
- `src/lib/terminal/corpus.ts` — `import.meta.glob('/src/content/agent/**/*.md', { eager: true, query: '?raw' })`. Exports `getCorpusEntry(key)`, `getProjectMarkdown(slug)`, `listProjectSlugs()`, and `corpusRecord` (raw path→text map). Throws synchronously at module load if any of the four top-level files (`me/experience/skills/contact`) are missing.
- `src/components/terminal/markdown-block.tsx` — thin `<Streamdown mode="static" parseIncompleteMarkdown={false}>` wrapper with `prose prose-invert prose-sm` + theme-token overrides (headings/links/code).

**Files changed:**
- `src/lib/terminal/commands.ts` — registered `/me`, `/experience`, `/skills`, `/contact`, `/projects` (no-args lists slug→title via existing `formatTwoCol`; with slug renders markdown or emits an `error` block listing known slugs).
- `src/components/terminal/block-row.tsx` — `case 'markdown'` now renders `<MarkdownBlock text={block.text} />` inside the same `data-block="markdown"` wrapper.

**Tests added:** `corpus.test.ts` (bijection vs `site.ts`, top-level loader, unknown slug ⇒ undefined), `markdown-block.test.tsx` (H1, list, inline code render), `commands.test.ts` extensions (each content command, `/projects` list/render/unknown, `/help` includes new commands). Suite: 24 files, 268 tests, all green.

**Phase 5 pickup hints:**
- Reuse `corpusRecord` directly to build the shell VFS tree — no second glob needed; the prefix `/src/content/agent/` maps cleanly to `~/`.
- `MarkdownBlock` is already SSR-safe; Phase 6 just needs to pass `mode="streaming"` + `parseIncompleteMarkdown` when wiring SSE token frames.
- `/projects` listing uses `projects` order from `site.ts` (not alphabetical) — keep that convention if Phase 6 adds an agent-driven project list.

## Phase 5 — Shell mode  ✅ shipped

`/exit` flips the store into shell mode (prompt prefix already swaps to `$`
via existing `block.mode` switch). Shell-mode lines route through a separate
registry — slash commands are not special-cased; they get `command not
found`, matching spec. Re-entry words (`deep` / `claude` / `open ui`) are
intercepted before dispatch in `use-submit.ts` because they cross the
mode/route boundary. `setMode('agent')` resets `cwd` to `~` so every `/exit`
opens a fresh shell at home.

**Files added:**
- `src/lib/terminal/shell-vfs.ts` — `VfsDir | VfsFile` tree built once at
  module load from `corpusRecord` (no second glob). `HOME = '~'`. Exports
  `vfsRoot`, `normalizePath`, `resolvePath(cwd, arg)`, `lookupNode(absPath)`,
  `listDir(dir)`. POSIX-ish semantics: `~` and `/` are aliases, `..` clamps
  at home, repeated slashes collapse.
- `src/lib/terminal/shell.ts` — `ShellCommand` type, registry of 15 commands
  (10 real + 5 jokes), `parseShellInput`, `findShellCommand`,
  `runShellCommand(raw, deps)`. Dispatch emits an `error` block for unknown
  commands and is a no-op on empty input.
- `src/lib/terminal/format.ts` — extracted `formatTwoCol`. Reused by slash
  `/help`, `/theme`, `/projects` and shell `help`.
- `src/lib/terminal/shell-vfs.test.ts` (15 tests), `src/lib/terminal/shell.test.ts`
  (30 tests), `src/components/terminal/use-submit.test.tsx` (7 tests).

**Files changed:**
- `src/store/terminal.ts` — added `cwd: string` (initial `~`), `setCwd`
  action, `SHELL_HOME` constant. `setMode('agent')` now also resets `cwd`.
- `src/lib/terminal/commands.ts` — added `/exit` slash command; uses
  shared `formatTwoCol`.
- `src/components/terminal/use-submit.ts` — branches on `mode` after
  appending the prompt block. Shell branch: re-entry shortcuts → fall
  through to `runShellCommand`. Agent branch unchanged (still emits the
  phase-6 placeholder for free text).

**Tests added in this phase:** 56 (15 vfs + 30 shell + 7 use-submit + 4
extending `commands.test.ts`). Suite is 27 files / 324 tests, all green.
Existing store-shape tests were updated to include `cwd: "~"` in their
`setState` resets.

**Phase 6 pickup hints:**
- The agent-mode branch in `use-submit.ts` is the only thing standing
  between free text and the SSE call — swap the `emit('system', '…phase 6…')`
  for the OpenRouter fetch and stream into a fresh `markdown` block. The
  shell-mode branch above it is fully independent.
- `runShellCommand` is sync today; Phase 6's `Ctrl+C` cancel work only
  needs to wrap the agent stream, not the shell registry.
- `corpusRecord` now has two consumers (corpus.ts content commands + the
  shell VFS). Phase 6's context heuristic can reuse `lookupNode` if it
  wants path-based selection over keyword routing.


## Phase 6 — Agent integration (OpenRouter SSE)  ✅ shipped

All six sub-tasks landed in one PR. Free text in agent mode streams a
markdown response from `/api/agent`; activity events render as faint inline
lines; `Ctrl+C` aborts mid-stream with `^C aborted` and keeps partial
output; `/model [list|<id>]` swaps the active OpenRouter model and the
status footer reflects it live.

**Spec swap (6.5):** the spec calls for a live `/models` fetch cached 1h.
Used the curated allowlist from `04-agents-and-commands.md` lines 42–50
instead — 5 models, no live fetch, no cache layer needed. `/model list`
shows the 5; `/model <id>` validates against the same list. Re-introduce
the live fetch later if the allowlist needs to grow dynamically.

**Files added (8):**
- `src/lib/openrouter.ts` — `OPENROUTER_MODELS` allowlist + `isOpenRouterModel`
  guard (both pure data, safe in client bundles) + `streamOpenRouter` async
  generator that POSTs `stream:true` to `api/v1/chat/completions` and yields
  parsed `{type:"token"|"done"}` events. Internal `parseSseStream(body, signal?)`
  attaches an abort listener that calls `reader.cancel()` and threads `usage`
  across frames so a final delta-less usage frame still surfaces at `done`.
  Auth key + model + messages are all injected by the caller; no env access
  here on purpose so the allowlist stays isomorphic.
- `src/lib/context.ts` — pure keyword router. Always includes
  `system-prompt.md`; `\b(project|projects|build|built|code|coding|repo)\b`
  pulls in every `projects/*.md`, hire/work keywords add
  `experience.md` + `contact.md`, `\b(skill|language|tech|stack)\b` adds
  `skills.md`, self-reference (`deep|you|your`) adds `me.md`. Default
  (no match) → `me.md` + `contact.md`. Reuses `corpusRecord` from
  `src/lib/terminal/corpus.ts` (no second glob). Concatenates docs with
  `\n\n---\n\n`, prefixed by `## <file>` headings so the LLM can cite.
- `src/routes/api.agent.ts` — server route. Mirrors `api.github-graph.ts`
  shape: `createFileRoute(...).server.handlers.POST`. Body validated via
  Zod (`message`, optional `history[]` up to 20, optional `model`).
  Streams an SSE `ReadableStream` (`text/event-stream`, `no-store`,
  `X-Accel-Buffering: no`) with `activity` → `activity` → `token...` →
  `done` (and `error` on failure). `request.signal` is threaded into
  `streamOpenRouter` so the client aborting closes the upstream connection.
- `src/store/model.ts` + `src/hooks/use-model.ts` — TanStack Store mirroring
  `themeStore`. Persists to `localStorage["portfolio.terminal.model"]`,
  initial reads through `isOpenRouterModel` so a stale localStorage value
  silently falls back to the default.
- `src/components/terminal/use-agent-stream.ts` — client SSE consumer.
  Active `AbortController` lives in a module-scoped ref so
  `Prompt`'s Ctrl+C handler can call `abortAgentStream()` without
  prop-drilling. Token frames fold into one growing markdown block via
  the new `updateBlock` store action; `done.tokens` emits a faint
  `(N tokens)` system block; SSE `error` events surface as `error` blocks.
  Recent agent-mode prompt/markdown pairs are sent as history (capped 10).
  Calls `start()` while another stream is active supersede the outgoing
  one cleanly (abort + replace).
- Tests: `src/lib/openrouter.test.ts` (9), `src/lib/context.test.ts` (9),
  `src/routes/-api.agent.test.ts` (8) — `-` prefix so the router plugin
  skips the file, same trick as `-api.github-graph.test.ts`.
  `src/store/model.test.ts` (3),
  `src/components/terminal/use-agent-stream.test.tsx` (5).

**Files changed:**
- `src/store/terminal.ts` — new `updateBlock(id, {text})` action used by the
  agent stream consumer to accumulate tokens; immutable map-based update so
  React re-renders cheaply.
- `src/components/terminal/markdown-block.tsx` — `mode="streaming"` +
  `parseIncompleteMarkdown={true}` unconditionally. Same component now
  covers both static corpus dumps and live token streams; Streamdown's
  partial-fence handling is a no-op when input is complete.
- `src/components/terminal/use-submit.ts` — agent-mode branch now calls
  `agentStream.start(text)` instead of emitting the phase-6 placeholder.
  Shell-mode branch unchanged.
- `src/components/terminal/prompt.tsx` — Ctrl+C handler only intercepts
  when `isAgentStreaming()`; otherwise falls through so browser copy still
  works on text selections.
- `src/components/terminal/status-footer.tsx` — wired to `modelStore`;
  shows short model name (`anthropic/claude-haiku-4.5` → `claude-haiku-4.5`).
- `src/lib/terminal/commands.ts` — registered `/model` (no args → current,
  `list` → allowlist, `<id>` → swap+persist or error). Imports
  `OPENROUTER_MODELS` + `setModel`.
- Existing tests updated: `use-submit.test.tsx` now mocks fetch to assert
  agent-stream behavior (was asserting the placeholder); `prompt.test.tsx`
  same, plus Ctrl+C abort + Ctrl+C no-op-when-idle coverage.
  `commands.test.ts` adds five `/model` cases.

**Notable patterns for Phase 7 pickup:**
- The module-scoped controller pattern in `use-agent-stream.ts` is the
  template for any future "global escape" (cancel a tour, cancel a
  scripted demo). Avoid prop-drilling — let Ctrl+C find the active
  controller through a module-scoped ref.
- Reuse `streamOpenRouter` + `assembleContext` for the `/presentation`
  scripted tour in Phase 7: just feed scripted prompts through the same
  `/api/agent` endpoint with a forced model and a slower pacing.
- The `parseSseStream` parser handles both the OpenRouter event format
  (`data: {...}` only) and our route's event format (`event: ... data: ...`).
  Phase 7 can reuse the same client-side consumer.
- `useAgentStream` history threading reads agent-mode prompt + markdown
  pairs from the scrollback. If Phase 7 wants to skip the tour from
  history, mark those blocks with a `transient` flag (would need
  extending `Block`) and filter them out in `recentHistoryFromBlocks`.
- Streamdown is now used in streaming mode for *all* markdown blocks.
  Partial markdown renders fine; static dumps unaffected.

**Original spec sub-tasks (for the record):**
- **6.1** `src/lib/openrouter.ts` — fetch+SSE iterator; respects abort signal.
- **6.2** Server route `src/routes/api.agent.ts` — POST `{ message, history, model }`; streams SSE.
- **6.3** Context heuristic in `src/lib/context.ts` — keyword routing.
- **6.4** Free-text routing → `/api/agent` with streaming markdown rendering.
- **6.5** `/model [list|<id>]` — swap + persist (allowlist, not live fetch).
- **6.6** `Ctrl+C` aborts in-flight stream cleanly.

## Phase 7 — `/presentation` narrated tour  ✅ shipped

Both sub-tasks landed alongside UI Phase 8 in a single PR. `/presentation`
streams a scripted 7-beat tour (welcome → me → projects → experience →
skills → contact → closing) by driving the existing `/api/agent` pipeline
through `useAgentStream.start()`; the section's response renders as a
normal `markdown` block. `Ctrl+C` aborts both the tour and its in-flight
stream cleanly. Inter-beat pacing (`1200ms`) collapses to `0` under
`prefers-reduced-motion`.

**Spec swap (none):** matches `04-agents-and-commands.md:20` verbatim
("streams a guided walkthrough … cancelable with Ctrl+C") and the Phase 6
pickup hint to "reuse `streamOpenRouter` + `assembleContext` … just feed
scripted prompts through the same `/api/agent` endpoint." Beat prompts
contain the section keywords (`project`, `experience`, …) so the existing
keyword router in `src/lib/context.ts` pulls the right corpus files
without any context-router changes.

**Files added:**
- `src/lib/terminal/tour.ts` — beats table, module-scoped tour
  `AbortController`, `isTourRunning()` / `abortTour()` exports
  (`abortTour` cascades into `abortAgentStream()` so the in-flight stream
  unwinds with the tour), `abortableSleep(ms, signal)`,
  `runPresentation({ agentStream })`. Uses the inline
  `prefersReducedMotion()` check pattern from
  `boot-sequence.tsx:8–11`. Re-exports `_BEATS_FOR_TESTS` so tests can
  assert beat-count without depending on test fixtures.

**Files changed:**
- `src/lib/terminal/commands.ts` — `CommandContext` gains optional
  `agentStream?: StreamHandle`. New `presentation` command registered
  between `contact` and `ui`; emits an `error` block when the handle is
  missing (e.g., a command-line test forgot to pass it) or when the tour
  is already running, otherwise awaits `runPresentation`. `runCommand`
  threads `agentStream` into the handler context.
- `src/components/terminal/use-submit.ts` — passes `agentStream` into the
  `runCommand` deps. One-line addition.
- `src/components/terminal/prompt.tsx` — `Ctrl+C` checks `isTourRunning()`
  first; falls through to `isAgentStreaming()` only when the tour is
  idle. Order matters: `abortTour()` cascades into the stream.

**Tests added in this phase:** 9 (3 in `src/lib/terminal/tour.test.ts`,
3 `/presentation` cases extending `commands.test.ts`, 1 Ctrl+C-tour
case extending `prompt.test.tsx`, plus the new beat-count assertion in
`commands.test.ts`). All beats fire under reduced motion (matchMedia
mocked) so the test suite doesn't sleep through real pauses. Reused the
`sseBody` / `sseFrame` helpers from `use-agent-stream.test.tsx:48–87`.

**Phase 8 pickup hints:**
- The agent-mode branch in `use-submit.ts` is now the only path that
  routes free text — `/presentation` reuses the same `start()` handle
  rather than re-entering the input pipeline. If Phase 8 adds another
  command that drives the stream (e.g., a `/regenerate` for the last
  reply), do the same: take `agentStream` from `CommandContext`, don't
  call `submit()` recursively.
- Tour-level abort uses a module-scoped controller (template at
  `src/lib/terminal/tour.ts`). If a future scripted feature (replay, demo
  mode) needs the same shape, mirror it rather than reaching into
  `tour.ts`.
- Beat prompts are static. If Phase 8 wants per-visitor narration
  (e.g., greet by referrer), inject `siteMeta`/`document.referrer` into
  the prompts at runtime — the rest of the pipeline already supports
  arbitrary string prompts.
- The `vi.fn<typeof fetch>().mockImplementation((_, init) => new Promise((_, reject) => { init?.signal?.addEventListener("abort", ...) }))`
  shape in `tour.test.ts` is the template for any future test that needs
  a "hangs until aborted" fetch — copy it forward instead of `mockResolvedValue`.

## Phase 8 — Mobile, accessibility, motion  ✅ shipped

All four sub-tasks landed in one PR. The bulk of 8.2 / 8.3 / 8.4 was already
in place from earlier phases — this phase added the mobile font ramp + quick
chips (8.1) and locked the other three behaviors in with verification tests.
Suite is now **64 files / 533 tests**, all green.

**Spec swaps:**
- **8.1 chip behavior:** spec wording was "tapping inserts and runs". Skipped
  the "insert without running" intermediate state — on mobile keyboards that
  adds a focus-juggle for no win. One tap routes straight through the same
  `useSubmit()` hook the prompt uses, so the chip path and the keyboard path
  stay in lockstep.
- **8.4 token animation collapse:** there is no token animation today (no
  caret blink, no per-token fade-in — Streamdown renders tokens as plain
  text appends). The global `@media (prefers-reduced-motion: reduce)` reset
  in `src/styles.css:116–124` already kills any future animation, and
  `BootSequence` already branches on `prefersReducedMotion()` for stagger.
  Nothing additional to do; called out here so a future phase doesn't try
  to add one.
- **Route extraction:** to render `<Terminal>` in the a11y test without the
  TanStack Router code-split warning, the route component moved out of
  `src/routes/terminal.tsx` into `src/components/terminal/terminal-shell.tsx`.
  `Route.options.component = TerminalShell` now; the route file is just the
  route definition + head meta.

**Files added (3):**
- `src/components/terminal/terminal-shell.tsx` — extracted route component.
  Same JSX shape as before, just relocated. Order inside the panel `<div>`:
  `Chrome → Scrollback → MobileQuickChips → Prompt → StatusFooter`.
- `src/components/terminal/mobile-quick-chips.tsx` — `flex sm:hidden` row of
  four `<button type="button">` chips for `/me`, `/projects`, `/help`,
  `/exit`. Each chip calls `submit(cmd)` from `useSubmit()`. Per-chip
  `data-testid="mobile-chip-{slug}"`; root `data-testid="mobile-quick-chips"`.
- `src/routes/-terminal-a11y.test.tsx` — `-` prefix so the router plugin
  skips it (same trick as `-api.github-graph.test.ts`, `-api.agent.test.ts`).
  Mounts `<TerminalShell />`, mocks `@tanstack/react-router` (`useNavigate`,
  `useSearch`, `createFileRoute`), stubs `matchMedia` and `fetch` (latter
  returns a never-resolving Promise so any in-flight corpus/agent fetch
  hangs and axe sees the static shell), sets `booted: true` so the boot
  sequence is a no-op, runs `axe(container)`, asserts zero violations.
  Mirrors `src/components/portfolio/portfolio-page.a11y.test.tsx` shape
  including the `expect.extend(matchers as any)` workaround.

**Files changed:**
- `src/routes/terminal.tsx` — slimmed to route definition only. Imports
  `TerminalShell` from `#/components/terminal/terminal-shell` and uses it
  as `component:`. `TERMINAL_TITLE` / `TERMINAL_DESCRIPTION` stay here
  since the head meta consumes them.
- `src/components/terminal/scrollback.tsx` — `text-sm` →
  `text-[13px] sm:text-sm` on the scrollback container.
- `src/components/terminal/prompt.tsx` — same ramp on the form.
- `src/components/terminal/status-footer.tsx` — `text-xs` →
  `text-[11px] sm:text-xs` so the footer scales with the rest.
- `src/components/terminal/prompt.test.tsx` — one new test: "keeps focus
  on the prompt after submitting a command". Asserts
  `document.activeElement === input` both before and after a `/help`
  submission. Covers 8.3 — the submit path doesn't blur the textarea.

**Tests added in this phase:** 6 (5 mobile-quick-chips + 1 a11y + 1
focus-after-submit; -1 because the existing prompt test count grew by 1).
Suite went from 62/527 → **64/533**, all green.

**Verification notes:**
- `pnpm tsc --noEmit` clean.
- `pnpm biome check src/` clean (a stale local `dist/` from a previous
  `pnpm build` triggers unrelated noise in `pnpm check` because biome's
  `**/index.html` include is greedy; that's an environmental wart, not a
  regression from this PR).
- `pnpm format` clean.
- The axe run covers the assembled shell with `booted=true` (skips the
  boot sequence's `<output>` insertions). 8.2 invariants verified:
  scrollback has `role="log"` + `aria-live="polite"`; prompt input has
  a sr-only `<label htmlFor>`; chip buttons all have accessible names.
- Lighthouse a11y score is still measured manually — see the deferred
  follow-up in `08-ui-build-plan.md`.

**Pickup hints for follow-ups:**
- The chip set is the place to add more quick-actions if mobile usage
  data later suggests other commands matter (e.g., `/theme dracula`).
  Keep the list to ≤6 — horizontal scroll on the row works but isn't
  great UX past that.
- If a future phase adds a token animation (caret blink, fade-in), wrap
  it in `useReducedMotion()` and add a test that asserts the static
  variant under `mockMatchMedia(true)`. Pattern lives in
  `src/components/ui/number-ticker.test.tsx`.
- The a11y test only covers the agent-mode shell. If a regression risk
  emerges in shell mode (e.g., a new `<output>` block kind), extend
  `-terminal-a11y.test.tsx` with a second `it()` that seeds a shell
  prompt block before rendering.

**Original spec sub-tasks (for the record):**
- **8.1** Mobile: font scale to 13px on `<sm`; quick-command chips row above prompt for `/me`, `/projects`, `/help`, `/exit`.
- **8.2** ARIA: scrollback `role="log" aria-live="polite"`; prompt as `<form>` with labeled input.
- **8.3** Focus management: prompt refocuses after commands unless user explicitly focused elsewhere.
- **8.4** Reduced motion: boot sequence + token animation collapse.

## Phase 9 — SSR hidden corpus + SEO  ✅ shipped (bundled with UI Phase 9)

Both sub-tasks landed in one PR alongside UI Phase 9. `pnpm build` prerenders
`/terminal` to `dist/client/terminal/index.html`; the route exports a
terminal-specific `head()` with full OG/Twitter meta; an SSR-rendered
`<HiddenCorpus />` div sits inside `<main>` carrying the full agent corpus
(every `agent/*.md` except `system-prompt.md`).

**Files added (shared with UI Phase 9):**
- `src/components/seo/hidden-corpus.tsx` — single `<div hidden
  aria-hidden="true" data-seo-corpus>` holding `getAllCorpusText()`. Mounted
  once per route (terminal route puts it inside `<main>` after the boot
  sequence + palette so the document order is panel → boot → palette → corpus).

**Files changed (terminal-specific):**
- `src/routes/terminal.tsx` — exports `TERMINAL_TITLE` + `TERMINAL_DESCRIPTION`
  constants; `Route` gains `head: () => ({ meta: [...] })` via
  `buildOpenGraphMeta({ path: "/terminal", ... })`. `<HiddenCorpus />` rendered
  inside `<main>` so it inherits the same landmark as the visible terminal.
- `vite.config.ts` — `pages: [..., { path: "/terminal", prerender: { enabled:
  true } }]`. The terminal shell SSRs fine (chrome + scrollback + prompt +
  status footer are all client-safe; `BootSequence` only writes to the store
  inside `useEffect`, never during render).
- See `08-ui-build-plan.md` Phase 9 section for the full file list — the
  changes to `src/content/site.ts`, `src/lib/seo.ts`,
  `src/lib/terminal/corpus.ts`, `src/routes/__root.tsx`,
  `scripts/build-seo-files.ts` are all shared with the UI track.

**Tests added (terminal-specific):**
- `src/routes/-terminal-head.test.tsx` (4 tests) — title is
  `TERMINAL_TITLE`; `og:url` ends `/terminal`; description matches
  `TERMINAL_DESCRIPTION`; `twitter:title` mirrors page title.
- Shared with UI Phase 9: corpus + seo + hidden-corpus tests. Total new
  tests this PR: 29. Suite is **62 files / 527 tests**, all green.

**Build verification:**
- `dist/client/terminal/index.html` exists and contains
  `data-seo-corpus` (1 match), `<title>Deep Mandloi — terminal</title>`,
  `og:url=https://deepmandloi.com/terminal`,
  `og:image=https://deepmandloi.com/logo512.png`, and `dmandloi@neiu`
  (corpus contact.md is in the public HTML).

## Exit criteria

- [x] Free-text agent responses stream tokens against OpenRouter (Phase 6).
- [x] Every command in `04-agents-and-commands.md` registered and behaves per spec.  *(Phases 3–7 done — slash: `/help`, `/clear`, `/history`, `/retry`, `/me`, `/experience`, `/skills`, `/projects`, `/contact`, `/presentation`, `/ui`, `/theme`, `/model`, `/github`, `/resume`, `/exit`. Shell: `pwd`, `ls`, `cd`, `cat`, `echo`, `whoami`, `date`, `history`, `clear`, `help`, plus jokes `neofetch`, `uname`, `sudo`, `vim`, `nano`.)*
- [x] Shell mode and agent mode round-trip cleanly via `/exit` and `deep`.
- [x] `Ctrl+C` cancels in-flight streams cleanly (Phase 6).
- [ ] Lighthouse a11y ≥ 95.  *(Deferred — no CI runner wired; manual run pending. In-repo gate is `src/routes/-terminal-a11y.test.tsx` (vitest-axe) — zero violations on the assembled shell.)*
- [x] Crawler-visible corpus present in SSR HTML.  *(`dist/client/terminal/index.html` contains the full corpus inside `[data-seo-corpus]`.)*

## Phase 4+ pickup notes

- The store already carries `mode: PromptMode` — Phase 5 only needs to flip
  it via `/exit` and `deep`. Prompt prefix already switches on it.
- `runCommand` returns `false` for non-slash input; Phase 6 should swap the
  current placeholder branch in `use-submit.ts` for an SSE call.
- The `markdown` block kind now renders via `MarkdownBlock` (streamdown).
  Phase 6 SSE work should reuse the same component with `mode="streaming"`
  and `parseIncompleteMarkdown` set.
- The `activity` block kind likewise renders as a faint inline line and is
  ready for Phase 6 streaming events.
