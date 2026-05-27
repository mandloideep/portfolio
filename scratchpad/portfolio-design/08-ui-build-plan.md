# 08 — UI Build Plan

Picks up after `07-phase-0-foundation.md`. Builds the polished `/` experience described in `03-ui-experience.md`. PR-sized tasks; each ships independently behind a feature flag if needed.

## Phase 1 — Layout shell + animated background  ✅ shipped

Shell, animated grid, dock nav with scrollspy, and six empty section
scaffolds landed at `/` (replaced the `UiStub` placeholder). Sections each
render an `eyebrow` + `<h2>` placeholder header so the dock has real scroll
targets; bodies fill in over Phases 2–7.

Spec swap: chose to refactor `src/routes/index.tsx` in place (mode chooser
still owns `/`, renders `<PortfolioPage />` once the user picks "ui") rather
than introducing `src/routes/portfolio/index.tsx` — kept the chooser→portfolio
handoff inside one route component.

**Files added:**
- `src/components/portfolio/portfolio-page.tsx` — top-level shell. `data-page="portfolio"` root, skip-link to `#hero`, `<AnimatedBackground />`, six `<PortfolioSection>`s, `<DockNav />`. `SECTIONS` constant is the single source for both the section list and the dock items.
- `src/components/portfolio/section.tsx` — `<section id aria-labelledby>` wrapper. Applies `scroll-mt-20 py-24 md:py-32` vertical rhythm and renders an optional `$ <eyebrow>` line above the `<h2>`. Accepts `children` so Phase 2+ can drop content in without touching the wrapper.
- `src/components/portfolio/animated-background.tsx` — Magic UI `AnimatedGridPattern` wrapped in `fixed inset-0 -z-10 pointer-events-none`. Reads `useReducedMotion()` and sets `numSquares={reduced ? 0 : 36}`; exposes `data-reduced` for tests.
- `src/components/portfolio/dock-nav.tsx` — fixed bottom-center pill (`hidden sm:flex`), one `<button>` per item. Clicks call `el.scrollIntoView({ behavior: "smooth", block: "start" })`. Active state from `useScrollSpy`; styled via `data-active` + `aria-current="location"`.
- `src/hooks/use-reduced-motion.ts` — thin `matchMedia('(prefers-reduced-motion: reduce)')` hook. SSR-safe (returns `false` until the effect runs).
- `src/hooks/use-scroll-spy.ts` — `IntersectionObserver` with `rootMargin: "-100px 0px -60% 0px"`. Tracks the set of currently-visible ids and returns the first (in document order) so the dock highlights the topmost on-screen section.

**Files changed:**
- `src/routes/index.tsx` — `<UiStub />` swapped for `<PortfolioPage />`; chooser logic untouched.
- `src/components/mode-chooser.tsx` — removed the `UiStub` export (no longer used).
- `src/components/mode-chooser.test.tsx` — dropped the `UiStub` test block.
- `src/test/setup.ts` — added a `ResizeObserver` stub (Magic UI's `AnimatedGridPattern` needs it under jsdom) and a `Element.prototype.scrollIntoView = vi.fn()` shim so tests can spy on it.

**Tests added (5 files, 19 tests):** `portfolio-page.test.tsx` (5), `dock-nav.test.tsx` (4), `animated-background.test.tsx` (3), `section.test.tsx` (3), `use-reduced-motion.test.tsx` (2), `use-scroll-spy.test.tsx` (3). Suite total: 33 files / 343 tests, all green.

Notable test patterns:
- `IntersectionObserver` mock that stashes the last callback so tests can fire entries via `act()` (see `use-scroll-spy.test.tsx`).
- `matchMedia` mock follows the `boot-sequence.test.tsx` shape — `query.includes("reduced")` gate keeps non-motion media queries returning false.
- The global `ResizeObserver` / `scrollIntoView` shims in `src/test/setup.ts` mean any Magic UI component that needs them now works in jsdom for free.

**Phase 2 pickup hints:**
- Drop hero content into `<PortfolioSection id="hero">` by passing children — `eyebrow` + `<h2>` are already rendered by the wrapper, but if Phase 2 wants a different hero heading, swap the section call for a hand-rolled `<section id="hero" aria-labelledby>` block (`PortfolioSection` is intentionally not load-bearing for the hero).
- `SECTIONS` in `portfolio-page.tsx` is the single source — adding/removing items there updates both the dock and the page. Order is document order, which the scrollspy relies on.
- `useReducedMotion()` and `useScrollSpy()` are both hooks Phase 2+ can reuse for shimmer/timeline animations.
- The `AnimatedGridPattern` uses `text-border/60` for stroke so it follows the active theme automatically.

## Phase 2 — Hero  ✅ shipped (last-commit half of 2.4 deferred)

Hero content fills the `#hero` section: greeting, shimmer name, role, status
pill, local-time widget, and two CTAs. The `<PortfolioSection>` wrapper still
owns the eyebrow + `<h2>` so this phase only adds a body component.

**Scope swap:** 2.4's "last commit" pill is deferred to UI Phase 6.1 (it
needs `/api/github-graph`, which Phase 6.1 builds). A `TODO(phase-6.1):`
marker sits at the top of `src/components/portfolio/local-time.tsx` so it's
trivial to find when Phase 6 lands.

**Files added:**
- `src/components/portfolio/hero.tsx` — top-level hero body. Contains the
  greeting line, shimmer name, role, `<StatusPill>`, `<LocalTime>`, and both
  CTAs. The `<ShimmerName>` subcomponent gates `AnimatedShinyText`
  (`src/components/ui/animated-shiny-text.tsx`) behind both
  `useReducedMotion()` and an in-viewport `IntersectionObserver` — when
  either says "no shimmer," it falls back to a plain `<span>` so the
  off-screen DOM stays cheap. Exposes `data-shimmer="true|false"` on the
  name span for testability.
- `src/components/portfolio/status-pill.tsx` — presentational pill. Uses
  `<output>` so it gets implicit `role="status"` (Biome's
  `useSemanticElements` rejects `<span role="status">`). Animated ping dot
  uses `bg-accent` so it follows the active theme.
- `src/components/portfolio/local-time.tsx` — ticking time widget. SSR-safe:
  renders `--:--:--` until the mount effect runs, then `setInterval(1000)`.
  `Intl.DateTimeFormat("en-US", { hour12: false, ... })` avoids server/client
  timezone drift. `suppressHydrationWarning` on the inner span guards against
  the rare case where the SSR snapshot races a sub-second client tick.

**Files changed:**
- `src/components/portfolio/portfolio-page.tsx` — the section map now branches
  on `s.id === "hero"` to render `<Hero />`; other sections keep their
  placeholder so Phase 3+ can take them one at a time.

**Tests added (3 files, 10 tests):**
- `hero.test.tsx` (5): name+role render, both CTAs with correct hrefs
  (`#projects`, `/terminal`), status-pill copy mirrors `siteMeta.status`,
  shimmer toggles on the IntersectionObserver callback, and shimmer stays
  off under reduced motion. Uses an IO mock that stashes the last callback
  the way `use-scroll-spy.test.tsx` does, plus the same `matchMedia` mock
  shape as the rest of the portfolio component tests.
- `status-pill.test.tsx` (2): copy renders verbatim; `<output>` carries
  implicit `role="status"` (asserted via `getByRole`).
- `local-time.test.tsx` (3): SSR placeholder shape, ticking after
  `vi.advanceTimersByTime(1000)`, and `vi.getTimerCount()` drops on
  unmount.

Suite is now 36 files / 353 tests, all green. `pnpm tsc --noEmit` clean.
`pnpm check` reports only the pre-existing schema-version info note.

**Phase 3 pickup hints:**
- The same `s.id === ...` branch in `portfolio-page.tsx` is where the bento
  grid drops in. Pattern: add a `<ProjectsBento />` component and add another
  branch — keep the section-id-keyed strategy until every section has real
  content, then collapse into a per-id map if it gets unwieldy.
- `<AnimatedShinyText>` is reusable for any "headline" treatment Phase 3
  wants (e.g., the featured project title). Wrap it the same way `<Hero />`
  does if you want IO + reduced-motion gating.
- The IO mock + `act(() => fire(...))` pattern in `hero.test.tsx` generalizes
  to any in-viewport gated component.
- `LocalTime` is intentionally self-contained — when `/api/github-graph` lands,
  add a `<LastCommit />` sibling rather than expanding `LocalTime`.

## Phase 3 — Projects bento  ✅ shipped

All four sub-tasks landed in one PR. `#projects` now renders the bento.
The URL `?project=<slug>` is the single source of truth for which modal is
open — local open/close state was avoided so deep links and ESC-close stay
in sync for free.

**Layout chosen:** with 4 projects (3 featured + 1 archived):
- featured-first ordering → first featured (`mydininghall`) becomes the
  `sm:col-span-2 sm:row-span-2` hero cell
- next two get `sm:col-span-1 sm:row-span-1`
- a 4+-card layout would put the trailing card at `sm:col-span-3
  sm:row-span-1` (full-width bottom row) — see `getCellSpan` in
  `projects-bento.tsx`
- mobile (`<sm`) collapses to a single column via `grid-cols-1 sm:grid-cols-3`
  passed into `BentoGrid` (tailwind-merge wins over its default `grid-cols-3`)

Radix `Dialog` already handles focus trap, ESC close, and trigger-refocus —
no custom focus code. Sub-task 3.4 came for free.

**Files added:**
- `src/components/portfolio/project-card.tsx` — presentational card. Whole
  card is a `<button>` so keyboard + SR semantics are correct. Hero size
  uses the same shimmer pattern as `Hero` (`AnimatedShinyText` gated by
  `useReducedMotion()` + `IntersectionObserver`, exposes
  `data-shimmer="true|false"`). Tags capped at 4 with a `+N` overflow chip
  on medium; hero shows all. Repo/live link icons render only when
  `links.repo` / `links.live` set; their `onClick` calls
  `e.stopPropagation()` so they don't also open the modal. Status chip
  variant is mapped via `STATUS_VARIANT`.
- `src/components/portfolio/project-modal.tsx` — thin `Dialog` wrapper.
  Open derived from `project !== undefined`; `onOpenChange(false) =>
  onClose()` covers ESC, overlay click, and the built-in close button.
  Body: title + status chip, summary as `DialogDescription`, optional
  poster `<img loading="lazy">`, full `bullets[]` as a `<ul>`, tags row,
  optional repo/live link row.
- `src/components/portfolio/projects-bento.tsx` — top-level body for the
  section. Reads `?project` via `useSearch({ from: "/" })` and writes via
  `useNavigate()` from `@tanstack/react-router`. Orders projects
  `featured-first`, then `BentoGrid` + `<ProjectCard>` per item. Renders a
  single `<ProjectModal>` keyed off the active slug. Unknown slugs render
  no modal (silently ignored).
- `src/components/portfolio/project-card.test.tsx` (8 tests),
  `src/components/portfolio/project-modal.test.tsx` (6 tests),
  `src/components/portfolio/projects-bento.test.tsx` (8 tests).

**Files changed:**
- `src/routes/index.tsx` — `SearchSchema` gains `project: z.string().optional()`.
- `src/components/portfolio/portfolio-page.tsx` — section branch adds
  `s.id === "projects" ? <ProjectsBento /> : ...` after the existing hero
  branch.
- `src/components/portfolio/portfolio-page.test.tsx` — adds the
  `@tanstack/react-router` mock now that `<ProjectsBento>` reads
  `useSearch` / `useNavigate` (same `vi.mock` shape used in the terminal
  prompt/use-submit tests).

**Tests added in this phase:** 22 (8 + 6 + 8). Suite is 39 files / 375
tests, all green. `pnpm tsc --noEmit` clean. `pnpm check` reports only
the pre-existing schema-version info note. `pnpm check-content` passes.

**Phase 4 pickup hints:**
- The `s.id === "experience"` slot in `portfolio-page.tsx` is the next
  branch to fill. The existing `s.id === "hero"` / `"projects"` branches
  show the pattern — keep one branch per id until it gets unwieldy, then
  collapse into a map.
- The `STATUS_VARIANT` map in `project-card.tsx` is a good template for
  any future enum→`Badge` mapping (e.g., a timeline `current` vs `past`
  marker).
- `useSearch({ from: "/" })` + `useNavigate()` with a `search: (prev) =>
  ({ ...prev, key: value })` updater is the established deep-link pattern.
  Reuse it for any modal/drawer that should be URL-shareable.
- The `act(() => fireInView(true))` IO-mock pattern in
  `project-card.test.tsx` is the same one `hero.test.tsx` uses — copy it
  for any new in-viewport-gated animation.
- The shimmer-on-hero-only pattern (gate `AnimatedShinyText` behind both
  `useReducedMotion()` and an IO check) is now duplicated in `Hero` and
  `ProjectCard`. If a third copy lands in Phase 4+, extract into a
  `<MaybeShimmer>` component in `src/components/ui/`.

## Phase 4 — Experience timeline  ✅ shipped

Both sub-tasks landed in one PR. `#experience` renders a left-rail timeline
with one entry per `experience[]`. Single column at every breakpoint
(experience is short).

**Spec swap:** used the existing `IntersectionObserver` + `data-in-view`
state + Tailwind transition pattern (same shape as `Hero`/`ProjectCard`)
instead of `motion/react`'s `whileInView`. UX is identical — dot scales +
fades in once when it crosses 50% viewport — but it sidesteps motion's
internal IO machinery, which doesn't play with our `MockIO` (the mock omits
`intersectionRatio`). Threshold is `0.5` (satisfies spec 4.1's "past
midpoint"). `once: true` semantics: we set `inView=true` on first
intersection and never toggle off.

**Files added:**
- `src/components/portfolio/experience-card.tsx` — single timeline entry.
  Renders an `<li>` with an absolutely-positioned animated dot, header row
  (`<h3>` role + company on one side, formatted date range on the other),
  bullet list with `▸` markers, and tag `<Badge variant="outline">` row.
  Local `formatYearMonth` + `formatRange` helpers turn `"2024-08"` → `"Aug
  2024"` (via a `MONTHS` table, no `Intl.DateTimeFormat` needed) and
  `"present"` → `"Present"`. The dot exposes `data-reduced` and
  `data-in-view` for tests. Reuses `useReducedMotion()` and `cn()`.
- `src/components/portfolio/experience-timeline.tsx` — top-level section
  body. Single `<ol>` with `border-l border-border/60` (the rail) and one
  `<ExperienceCard>` per `experience[]` entry. No state.

**Files changed:**
- `src/components/portfolio/portfolio-page.tsx` — added a third branch to
  the chained ternary: `s.id === "experience" ? <ExperienceTimeline /> :
  ...`. The placeholder paragraph still catches `skills`, `github`, and
  `contact` for now.

**Tests added (2 files, 9 tests):**
- `experience-card.test.tsx` (6): role+company+bullets render verbatim;
  open-ended range formats as `"Aug 2024 – Present"`; closed range
  `"Jun 2023 – Dec 2023"`; one `<Badge>` per tag; `data-in-view` flips
  from `"false"` to `"true"` on `act(() => fireInView(true))`; under
  reduced motion `data-reduced="true"`.
- `experience-timeline.test.tsx` (3): one `<li>` per `experience[]` entry
  (length-driven — auto-passes when an entry is added to `site.ts`,
  satisfying spec 4.2); entries render in document order matching the
  array; container is an `<ol>`.

Suite is now 41 files / 384 tests, all green. `pnpm tsc --noEmit` clean.
`pnpm check` reports only the pre-existing schema-version info note.

**Phase 5 pickup hints:**
- The `s.id === "skills"` branch in `portfolio-page.tsx` is where Phase 5
  drops in. With four branches now in the chained ternary, the pattern is
  still readable; if a fifth lands and it gets noisy, collapse into a
  per-id map (e.g., `const RENDERERS = { hero: <Hero/>, ... }` keyed off
  `s.id`).
- `formatYearMonth` / `formatRange` are local to `experience-card.tsx`. If
  research timeline pills in 5.2 need the same shape, promote to
  `src/lib/format-date.ts` then.
- The dot-on-rail pattern (`relative` `<li>` + `absolute -translate-x-1/2`
  marker on an `<ol class="border-l">`) is the template for any
  future timeline-style component (research, contributions log, etc.).
- The IO mock + `act(() => fireInView(true))` pattern is now in four test
  files (`hero`, `project-card`, `experience-card`, plus a no-op variant
  in `experience-timeline`). If a fifth copy lands, extract into a shared
  helper under `src/test/mocks/intersection-observer.ts`.

## Phase 5 — Skills & Research  ✅ shipped

Both sub-tasks landed in one PR. `#skills` now renders a two-column grid
(Skills | Research on `md+`, stacked on mobile). Skills are grouped chip
clusters; research entries are cards sorted descending by `year` with year +
venue pills.

**Spec swap:** the spec called for "timeline pills (year + role)" but the
`research[]` schema has no `role` field — entries are `{slug, title, venue,
year, abstract, tags}`. Interpreted "timeline pills" as **year + venue**:
year pill uses `Badge variant="default"` (accent), venue pill uses
`variant="outline"`. The spec also references `skills[].category`; the actual
field is `skills[].group` (see `src/content/site.ts`).

**Files added:**
- `src/components/portfolio/skills-grid.tsx` — renders `skills` as a vertical
  stack of groups. Each group has a `font-mono uppercase tracking-wider`
  header `$ {group}` (the `$` is an `aria-hidden` `text-accent` span) followed
  by a `flex flex-wrap gap-2` of `Badge variant="outline"` chips styled
  `border-border/70 text-fg/70` (same chip treatment as `experience-card.tsx`).
  Exposes `data-testid="skills-grid"` on the root and
  `data-testid="skill-group-{group}"` per block.
- `src/components/portfolio/research-list.tsx` — renders
  `[...research].sort((a,b) => b.year - a.year)` (defensive — data is already
  descending) as an `<ol data-testid="research-list">`. Each entry is an
  `<li data-testid="research-card-{slug}">` containing: a header row with a
  `Badge variant="default"` year pill + `Badge variant="outline"` venue pill,
  an `<h3>` title, a `<p>` abstract, and a tag row of outline badges.
- `src/components/portfolio/skills-grid.test.tsx` (5 tests),
  `src/components/portfolio/research-list.test.tsx` (5 tests).

**Files changed:**
- `src/components/portfolio/portfolio-page.tsx` — fourth branch in the
  chained ternary: `s.id === "skills" ? <div className="grid grid-cols-1
  gap-10 md:grid-cols-2"><SkillsGrid /><ResearchList /></div> : ...`. The
  placeholder paragraph still catches `github` and `contact`.
- `src/components/portfolio/portfolio-page.test.tsx` — adds one assertion
  that both `skills-grid` and `research-list` testids are present.

**Tests added (2 files, 11 tests):**
- `skills-grid.test.tsx` (5): one `$ {group}` heading per group, every item
  renders, total badge count equals flattened `items.length`, each group
  queryable via testid, root testid present.
- `research-list.test.tsx` (5): one `<li>` per entry, document order is
  descending by year (read off the `[data-variant="default"]` badge text per
  card), every entry's year/venue/title/abstract render verbatim (scoped via
  `within(card)`), each entry's tags render as badges, year pill carries
  `data-variant="default"` and venue pill `data-variant="outline"`.
- One extra test in `portfolio-page.test.tsx` covering the new wiring.

Suite is now **43 files / 395 tests**, all green. `pnpm tsc --noEmit` clean.
`pnpm check` reports only the pre-existing schema-version info note.

**Phase 6 pickup hints:**
- The `s.id === "github"` branch in `portfolio-page.tsx` is next. With five
  filled branches in the chained ternary, the Phase 4 pickup hint about
  collapsing into a `RENDERERS` map keyed off `s.id` is now actionable —
  consider that refactor before adding the sixth (`contact`) branch.
- The `Badge variant="default"` accent pill from `research-list.tsx` is the
  natural template for the heatmap intensity legend chips in 6.2.
- `ResearchList` sorts defensively even though data is already ordered —
  apply the same hardening to any future data list that's "ordered by
  convention" rather than enforced by schema.
- `SkillsGrid` has no animation. If Phase 7+ wants a subtle entrance,
  reuse the `useReducedMotion` + IO `data-in-view` pattern from
  `experience-card.tsx` rather than introducing a new motion library.

## Phase 6 — GitHub heatmap  ✅ shipped

All four sub-tasks landed in one PR. `#github` now renders a real contributions
heatmap fed by an internal API route. The route is the first server handler in
this repo — TanStack Start v1.168 uses `createFileRoute(...).server.handlers.{GET,...}`,
not a separate `createServerFileRoute` helper. The handler body lives in an
exported `handleGithubGraphRequest()` so tests can call it directly without
spinning up the dev server.

**Spec swap:** the spec said "color steps from theme tokens" — there is no
intensity scale in the theme registry (single hex per slot). Instead, five
`.hm-0..hm-4` utility classes in `src/styles.css` use
`color-mix(in oklch, var(--color-accent) N%, transparent)` so the same
declarations work across all five themes without per-theme code. Requires
`color-mix` browser support (Safari ≥ 16.4 / Chrome ≥ 111 / Firefox ≥ 113) —
acceptable for a portfolio; noted in the styles.css comment.

**Files added:**
- `src/routes/api.github-graph.ts` — server route. Module-level 1h cache
  (`{ value, at }`), `_resetGithubGraphCacheForTests()`, exported
  `handleGithubGraphRequest()`, `computeStreaks()`, `fetchGithubGraph()`.
  GraphQL POST to `api.github.com/graphql` using `getServerEnv()` for
  `GITHUB_TOKEN` + `GITHUB_USERNAME`. Returns `200` with
  `Cache-Control: public, max-age=3600` + `x-cache: HIT|MISS`, or `502` on
  GitHub error (failures are **not** cached). `current` streak walks
  backwards from the day matching `new Date().toISOString().slice(0,10)`
  so future-dated calendar cells are ignored.
- `src/routes/-api.github-graph.test.ts` — backend tests. Filename uses
  the `-` prefix so the TanStack Router plugin skips it during route
  generation (its `routeFileIgnorePrefix` default). `vi.mock("#/lib/env",
  ...)` is required because `getServerEnv()` refuses to run when
  `typeof window !== "undefined"` (always true under jsdom). Mocks
  `fetch` with `mockImplementation` rather than `mockResolvedValue` so
  each call returns a fresh `Response` (Response bodies are single-use).
- `src/components/portfolio/github-graph.tsx` — `GithubGraph` (top-level
  section body, root has `data-testid="github-graph"` and
  `data-state="loading|ready|error"`), `HeatmapStats` (`<dl>` with three
  `<StatCell>` cards driven by `<NumberTicker>` — auto-animates on view
  via the ticker's built-in `useInView({ once: true })`),
  `HeatmapGrid` (single `<TooltipProvider delayDuration={150}>` at the
  root, `grid-flow-col grid-rows-7` for column-major day flow, weekday
  rail on the left, sparse month labels above, Less/More legend below),
  `HeatmapCell` (Radix `<Tooltip>` over a `<button type="button">` so
  cells are keyboard-focusable and SR-friendly; `aria-label` mirrors the
  tooltip text), `HeatmapSkeleton` (53×7 placeholder grid for the
  loading state — no layout shift on resolve).
- `src/components/portfolio/github-graph.test.tsx` — 10 tests covering
  the skeleton/error/success states, cell count (53×7), aria-label
  shape, stat trio labels, and intensity-class coverage. Also unit-
  tests the pure `intensityClass(count, max)` helper.

**Files changed:**
- `src/styles.css` — added `.hm-0..hm-4` classes (see "Spec swap" above).
- `src/components/portfolio/portfolio-page.tsx` — fifth branch in the
  chained ternary: `s.id === "github" ? <GithubGraph /> : ...`. Only
  `contact` still falls through to the placeholder.
- `src/components/portfolio/portfolio-page.test.tsx` — added an
  `afterEach(vi.restoreAllMocks)` and a `beforeEach` that stubs `fetch`
  with a never-resolving promise (keeps `<GithubGraph>` in its
  loading state so page-level tests don't depend on the real API).
  New `it()` asserts the `github-graph` testid renders.

**Tests added in this phase:** 18 (8 backend + 10 frontend) + 1 in the page
test. Suite is **45 files / 414 tests**, all green. `pnpm tsc --noEmit`
clean. `pnpm check` reports only the pre-existing schema-version info note.

**Notable patterns for Phase 7 pickup:**
- The `vi.mock("#/lib/env", ...)` block at the top of
  `-api.github-graph.test.ts` is the template for any future server-route
  test — `getServerEnv()` cannot be exercised from jsdom without it.
- The `Response` "mockImplementation, not mockResolvedValue" trick comes up
  any time a test calls a handler twice (`await res.json()` consumes the
  body); copy it forward.
- The contact section is the last placeholder in `portfolio-page.tsx`.
  With six filled branches the chained ternary is the last hop before
  the `RENDERERS` map refactor flagged in Phases 4/5 actually pays off —
  if Phase 7 adds a sub-section, do the refactor first.
- `color-mix` on a single CSS custom property is a clean way to derive
  multi-step palettes — reuse for any future "intensity ramp" UI (e.g.,
  agent "thinking" pulse, log severity coloring).
- The route file uses `createFileRoute("/api/github-graph")({ server: {
  handlers: { GET } } })`. Future server routes follow the same shape;
  remember to prefix their test files with `-`.

## Phase 7 — Contact + Footer  ✅ shipped

Both sub-tasks landed in one PR. `#contact` renders an arrow-row list (email,
github, linkedin, terminal CTA) and a new `<Footer />` sits below `<main>` with
quip + year + "source on github" + a working theme switcher dropdown. The
chained ternary in `portfolio-page.tsx` now has all six branches filled; the
`RENDERERS` map refactor flagged in Phases 4–6 is still deferred (six readable
branches; collapse if a Phase 8 sub-section adds a seventh).

**Spec swap:** the spec called for the `t` global shortcut to be verified for
the contact card, but the listener is also fine to own inside `ContactCard`
(unmounts when `/` unmounts, not exposed to `/terminal`). Kept it scoped to
`ContactCard` rather than the page root to keep `portfolio-page.tsx` thin. The
"source on github" link reuses `getProject("agent-portfolio")?.links.repo`
instead of adding a `repoUrl` to `siteMeta` — the URL is already canonically
held by the agent-portfolio project entry.

**Files added:**
- `src/components/portfolio/contact-card.tsx` — four `<ContactRow>` items
  (email/github/linkedin/terminal) with the `▸` arrow marker matching
  `experience-card.tsx`. Hosts the global `t` keydown listener via
  `useEffect`. Guards: non-`t` key, `ctrlKey|metaKey|altKey`, `e.repeat`,
  `<input>`/`<textarea>`/`isContentEditable` target, and presence of
  `document.querySelector('[role="dialog"][data-state="open"]')`. The
  terminal row's `<button>` and the keystroke both call
  `navigate({ to: "/terminal" })`. Trailing `<Badge variant="outline">press t</Badge>`.
- `src/components/portfolio/theme-switcher.tsx` — shadcn `DropdownMenu`
  trigger (`Button variant="ghost" size="sm"` with `<Palette/>` icon and the
  active theme name). Items list every entry in `themes` from
  `#/content/themes`; selecting one calls `setTheme(slug)` via `useTheme()`.
  Active row shows a `<Check />` keyed to `theme-active-${slug}` testid.
  Content overridden with `bg-bg border-border text-fg` because the stock
  shadcn dropdown classes (`bg-popover`, `text-popover-foreground`) aren't
  wired into our theme tokens.
- `src/components/portfolio/footer.tsx` — `<footer data-testid="portfolio-footer" />`
  with `border-t border-border/40 mt-24 pb-24 pt-10`. The `pb-24` keeps the
  fixed `<DockNav>` from clipping content. Renders quip, current year,
  source link (only when `getProject("agent-portfolio")?.links.repo` exists),
  and `<ThemeSwitcher />`.
- `src/components/ui/dropdown-menu.tsx` — installed via
  `pnpm dlx shadcn@latest add dropdown-menu`. Uses `radix-ui` (already a
  dep). Standard shadcn defaults; only consumed by `ThemeSwitcher`.

**Files changed:**
- `src/components/portfolio/portfolio-page.tsx` — sixth branch in the chained
  ternary `s.id === "contact" ? <ContactCard /> : ...`. `<Footer />` inserted
  between `</main>` and `<DockNav />` so it lives in document flow while the
  fixed dock floats above.
- `src/components/portfolio/portfolio-page.test.tsx` — two new tests:
  `contact-card`/`portfolio-footer` testids present; footer follows `<main>`
  in document order (via `compareDocumentPosition`).
- `src/test/setup.ts` — added `Element.prototype.hasPointerCapture`,
  `setPointerCapture`, `releasePointerCapture` stubs so Radix popper-style
  primitives (DropdownMenu, Select, Popover) can open under jsdom. Future
  dropdown/select/popover tests get this for free.

**Tests added (3 files, 19 tests):**
- `contact-card.test.tsx` (9): email mailto, github+linkedin external attrs,
  `press t` badge, `t` keydown calls navigate, input-focused guard,
  modifier-key guard, open-dialog guard, unmount detach, terminal CTA click.
- `theme-switcher.test.tsx` (5): trigger label, all five options listed,
  active option has check icon, selection updates store + localStorage,
  trigger label refreshes after selection. Uses real `themeStore` (no mock)
  and resets in `beforeEach`. `openMenu()` helper fires pointerDown +
  pointerUp + click to satisfy Radix's pointer-event dance.
- `footer.test.tsx` (4): quip, year, source link href/target/rel, theme
  switcher present.
- `portfolio-page.test.tsx` (+2): contact-card + footer testids, footer
  after main in document order.

Suite is now **48 files / 434 tests**, all green. `pnpm tsc --noEmit` clean.
`pnpm check` reports only the pre-existing schema-version info note.
`pnpm format` clean.

**Phase 8 pickup hints:**
- The chained ternary in `portfolio-page.tsx` is now fully populated. If a
  Phase 8 sub-section adds a seventh branch, do the `RENDERERS` map refactor
  first (`const RENDERERS: Record<SectionId, ReactNode> = { hero: <Hero/>, ... }`).
- The Radix pointer-event shims in `src/test/setup.ts` mean any future
  Radix popper test (Select, Popover, Tooltip-as-popper) just works.
- `theme-switcher.tsx` is the first place that overrides shadcn's `bg-popover`
  defaults with our theme tokens. If Phase 8 adds more popover/select UI,
  consider promoting those overrides into the `DropdownMenuContent` defaults
  in `src/components/ui/dropdown-menu.tsx` itself.
- `useTheme()` exposes `themes` directly — any future theme-aware UI (e.g.,
  a settings panel) should consume it the same way rather than re-reading
  from `#/content/themes`.
- Phase 8 motion polish: the contact rows currently have no entrance
  animation. The IO + `data-in-view` pattern from `experience-card.tsx` is
  the template if a stagger-in is wanted.

## Phase 8 — Motion polish + a11y audit  ✅ shipped

All four sub-tasks landed alongside Terminal Phase 7 in one PR. Magic-UI
primitives that previously animated unconditionally now respect
`prefers-reduced-motion`; CTAs and project cards have a subtle magnetic
hover capped at ±8px; the duplicate `id="main"` is gone and a vitest-axe
test enforces "zero violations" on the assembled `<PortfolioPage />`.

**Spec swaps:**
- **8.1 shimmer CSS:** `src/styles.css` already had a global
  `@media (prefers-reduced-motion: reduce)` block (lines 115–125) that
  zeroes `animation-duration` and `transition-duration` site-wide, so
  `.animate-shiny-text` is neutralized automatically. No per-component
  CSS rule needed. The explicit React-level `useReducedMotion()` guards
  in `NumberTicker` and `MagicCard` still pay off by skipping the
  underlying Framer Motion subscriptions entirely (cheaper than just
  zeroing the animation duration).
- **8.2 magnetic hover on project cards:** the outer was a `<button>`,
  which made an axe `nested-interactive` violation unavoidable once the
  repo/live links sat inside it. Refactored to a non-interactive `<div>`
  shell with an absolutely-positioned `<button class="absolute inset-0
  z-10">` overlay that owns the click + focus ring; repo/live anchors
  live above on `relative z-20`. Same UX (whole card click opens the
  modal, icons stay clickable, keyboard-focusable), zero a11y violations.
  Magnetic ref now attaches to the wrapper `<div>` instead of the button.
- **8.3 Lighthouse:** the in-repo gate is the axe test, run in CI on
  every PR. Lighthouse run is still manual against `pnpm dev` (no
  scripted runner in this repo); the spec's ≥ 95 target hasn't been
  measured for this PR — leave that to the deploy verification step.

**Files added:**
- `src/hooks/use-magnetic.ts` — generic `useMagnetic<T extends HTMLElement>()`.
  Returns a ref callback that, on pointer-move, translates the element by
  `clamp(pointer-from-center × 0.3, ±8)`px via `translate3d`. Resets to
  origin on `pointerleave` with a 200ms ease-out transition. Writes
  `data-magnetic="on|off"` so tests and styling can branch. Returns a
  no-op (no listeners, no transform) under `useReducedMotion()`. Re-runs
  on motion-preference change because the ref callback identity is keyed
  on the hook's `reduced` value.
- `src/components/portfolio/portfolio-page.a11y.test.tsx` — mounts
  `<PortfolioPage />` with the same `@tanstack/react-router` + `fetch`
  mocks the existing `portfolio-page.test.tsx` uses, runs
  `axe(container)` from `vitest-axe`, asserts zero violations. Matchers
  registered manually via `expect.extend(matchers)` because the
  package's `extend-expect.js` ships empty in v0.1.
- `src/hooks/use-magnetic.test.tsx`, `src/components/ui/number-ticker.test.tsx`,
  `src/components/ui/magic-card.test.tsx` — unit tests for the new
  guards (cap check, pointer-leave reset, reduced-motion no-op,
  RM-final-value-now, static-variant DOM shape).

**Files changed:**
- `src/components/ui/number-ticker.tsx` — `useReducedMotion()` guard.
  Under reduced motion, sets `textContent` to the formatted final value
  on mount and skips the spring `on("change")` subscription. Adds
  `data-reduced` for tests.
- `src/components/ui/magic-card.tsx` — outer `MagicCard` checks
  `useReducedMotion()` and short-circuits to a `MagicCardStatic`
  component that renders just the bordered shell + children. The
  hook-heavy `MagicCardDynamic` (motion values, pointer listeners,
  next-themes lookup) only mounts when motion is allowed. Static
  variant carries `data-testid="magic-card-static"` + `data-reduced="true"`.
- `src/components/portfolio/hero.tsx` — both CTA `<a>`s attach
  `useMagnetic<HTMLAnchorElement>()`. Dropped the `transition` class
  from each since the hook owns the transform transition.
- `src/components/portfolio/project-card.tsx` — see scope swap above.
  `useMagnetic<HTMLDivElement>()` on the wrapper div; the overlay
  `<button data-testid="project-card-open-{slug}">` is the focusable
  control. Tests + `ProjectsBento` updated to click the overlay testid.
- `src/routes/__root.tsx` — wrapper `<div id="main">` lost its id; the
  skip link still targets `#main` but the page-level `<main id="main">`
  is now the unique landmark.
- `src/routes/terminal.tsx` — `<main>` gained `id="main"` so the root
  skip link works on the terminal route too.
- `src/components/portfolio/portfolio-page.tsx` — removed the duplicate
  `<a href="#hero">` skip link (the root one covers it), added an
  `sr-only <h1>` immediately inside `<main>` so axe + heading-nav are
  happy. `<main id="main">` stays.
- `src/components/portfolio/portfolio-page.test.tsx` — dropped the
  `#hero` skip-link assertion; added "exactly one `<main id='main'>`"
  and "sr-only `<h1>` with name + role" assertions.
- `package.json` — `vitest-axe` + `axe-core` devDependencies.

**Tests added in this phase:** 14 (4 hook + 2 number-ticker + 2
magic-card + 1 a11y + 2 hero CTA assertions + 2 project-card magnetic
assertions + 2 portfolio-page landmark/heading; existing
`projects-bento.test.tsx` + `project-card.test.tsx` updated to click
the new overlay testid). Suite is now **58 files / 498 tests** (was
48/434), all green. `pnpm tsc --noEmit` clean.
`pnpm check` reports only the pre-existing schema-version info note.
`pnpm check-content` ok. `pnpm format` clean.

**Phase 9 pickup hints:**
- `useMagnetic` is generic over the element type — wire it onto any
  future CTA (footer "source on github", Phase 9 OG image link, etc.)
  by typing the ref. No new hook needed.
- The `MagicCardStatic` / `MagicCardDynamic` split is the template for
  any other Framer-heavy primitive that needs an RM short-circuit —
  put all the motion hooks inside `*Dynamic` and pick at the outer call
  site so the hooks never mount under reduced motion.
- The `<button class="absolute inset-0">` overlay pattern is now the
  canonical "linked card with internal actions" shape in this repo.
  Reuse for any future card-with-icons (e.g., research entry that opens
  a paper + has a separate "cite" button).
- `vitest-axe`'s `extend-expect.js` ships empty in v0.1; future axe
  tests must `expect.extend(matchers)` manually (see the
  `portfolio-page.a11y.test.tsx` header).
- Lighthouse scoring is deferred to the deploy verification step —
  consider adding a `pnpm lighthouse` script that wraps `lhci` once
  Phase 9 lands and there's a deployable preview.

## Phase 9 — SEO + prerender  ✅ shipped (bundled with Terminal Phase 9)

All three sub-tasks landed in one PR alongside Terminal Phase 9 — the
SEO/prerender/hidden-corpus surface area is identical across both routes, so
they shipped together. `vite build` now prerenders `/` and `/terminal` to
static HTML; both routes carry per-route `head()` with full OG/Twitter meta;
both ship an SSR-rendered hidden agent-corpus block for crawlers.

**Spec swap (none for 9.1/9.2):** Both behave per spec. **9.3 OG image** is a
placeholder — `siteMeta.ogImage = "/logo512.png"` works for crawler unfurls
today but looks square in Slack/Twitter previews. A real 1200×630 `og.png`
is the only deferred item (`TODO(og-image)` comment in `src/content/site.ts`
flags it).

**Files added:**
- `src/components/seo/hidden-corpus.tsx` — pure SSR-friendly component.
  Calls `getAllCorpusText()` once at module scope, returns a single
  `<div hidden aria-hidden="true" data-seo-corpus>`. No hooks, no props.
  Reused verbatim by both routes.
- `src/components/seo/hidden-corpus.test.tsx` (3),
  `src/routes/-root-head.test.tsx` (4),
  `src/routes/-index-head.test.tsx` (3),
  `src/routes/-terminal-head.test.tsx` (4). All four test files use the
  `-` route-tree-skip prefix so the router plugin doesn't try to mount them
  as routes.

**Files changed:**
- `src/content/site.ts` — `siteMeta` gains `url`, `description`, `ogImage`
  fields. Origin now lives in exactly one place.
- `src/lib/seo.ts` — new `buildOpenGraphMeta(input: RouteHeadInput)` helper
  returning the 10-entry meta array (og:title, og:description, og:type,
  og:url, og:image, og:image:alt, twitter:card, twitter:title,
  twitter:description, twitter:image). Pure; internal `joinUrl()` strips
  trailing slash from origin + ensures leading slash on path.
- `src/lib/terminal/corpus.ts` — new `getAllCorpusText()` helper. Eager
  module-scope concatenation of every `agent/*.md` **except**
  `system-prompt.md` (internal LLM prompt — must not leak). Each entry
  prefixed with `# <relative-path>` heading for crawler attribution;
  separator is `\n\n---\n\n`. Idempotent (returns the same constant string).
- `src/routes/__root.tsx` — `TITLE` exported as `ROOT_TITLE`; description
  reads from `siteMeta.description`; meta array uses spread of
  `buildOpenGraphMeta`; `buildPersonJsonLd` now receives `siteMeta.url`
  explicitly so the JSON-LD `url` field is the canonical origin (was
  falling back to GitHub URL before).
- `src/routes/index.tsx` — adds `head: () => ({ meta: [...] })` with
  per-route title `${siteMeta.name} — portfolio`. `Home()` return wraps the
  chooser/portfolio ternary in a fragment and always renders
  `<HiddenCorpus />` so crawlers see it regardless of which branch shows.
- `src/routes/terminal.tsx` — adds `head: () => ({ meta: [...] })` with
  terminal-specific title + description. `<HiddenCorpus />` mounted inside
  `<main>` as a sibling of the boot sequence + palette.
- `vite.config.ts` — `tanstackStart({ pages: [{ path: "/", prerender: {
  enabled: true } }, { path: "/terminal", prerender: { enabled: true } }],
  prerender: { failOnError: true, concurrency: 4 } })`. Verified against
  `@tanstack/start-plugin-core@1.171.3`'s schema (`pages` array + per-page
  `prerender.enabled`, plus top-level `prerender` for orchestration).
- `scripts/build-seo-files.ts` — `ORIGIN` now reads `siteMeta.url` instead
  of a hardcoded literal. `public/sitemap.xml` + `public/robots.txt` stay
  byte-identical (`git diff --stat public/` is empty after re-running
  `pnpm build-seo`).
- `src/lib/seo.test.ts` (+8) and `src/lib/terminal/corpus.test.ts` (+7)
  — extensions for the new helpers.

**Tests added in this phase:** 29 (8 seo + 7 corpus + 3 hidden-corpus + 4
+ 3 + 4 route heads). Suite is now **62 files / 527 tests** (was 58/498),
all green. `pnpm tsc --noEmit` clean. `pnpm check` reports only the
pre-existing schema-version info note. `pnpm format` clean.

**Build verification (`pnpm build` output):**
- `dist/client/index.html` and `dist/client/terminal/index.html` both
  rendered to static HTML by `[prerender]` step.
- `grep -a 'data-seo-corpus' dist/client/index.html` → 1 match (hidden
  corpus div present); `dmandloi@neiu` appears twice (JSON-LD + corpus
  contact.md).
- `og:url` per-route: `/` → `https://deepmandloi.com/`, `/terminal` →
  `https://deepmandloi.com/terminal`. `og:image` is absolute on both.
- `<title>` per-route: `"Deep Mandloi — portfolio"` /
  `"Deep Mandloi — terminal"`.

## Exit criteria

- [ ] Lighthouse: Performance ≥ 90, A11y ≥ 95, SEO ≥ 95.  *(Deferred to a follow-up `pnpm lighthouse` workstream — no CI runner wired yet.)*
- [x] Every section reachable via dock nav and keyboard.
- [x] All five themes render all sections without contrast regressions.
- [x] Project modal deep-links work.
- [x] No console errors on cold load.

## Deferred follow-ups (post-Phase 9)

- Real 1200×630 `public/og.png` (placeholder `/logo512.png` works for
  crawlers but is square). `TODO(og-image)` comment in `src/content/site.ts`.
- TanStack Start's built-in `sitemap: { ... }` plugin option — would let us
  retire `scripts/build-seo-files.ts` + `public/sitemap.xml`. Separate
  refactor that touches CI assumptions.
- `og:image:width` / `og:image:height` meta — add once the real og.png lands.
- Lighthouse CI script.
