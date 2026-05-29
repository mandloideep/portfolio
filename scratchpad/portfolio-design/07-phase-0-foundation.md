# 07 — Phase 0: Shared Foundation

Both `/` and `/terminal` depend on the work in this phase. Complete in order; nothing in `08-` or `09-` can land until Phase 0 closes.

## Skills to invoke at start of phase

- `/frontend-design` — distinctive, production-grade frontend baselines
- `/vercel-react-best-practices` — React 19 / TanStack Start patterns
- `/shadcn` — components.json + Magic UI install pipeline

## Tasks

### 0.1 — Content model: typed constants
- Add `src/content/site.ts` with Zod schemas for `siteMeta`, `projects[]`, `experience[]`, `research[]`, `skills[]`, `themes[]` (shapes per `06-content-model.md`).
- Export typed objects; throw at module load on schema mismatch.
- **Verify:** `pnpm tsc --noEmit` clean; deliberately break a field and confirm Zod throws on import.

### 0.2 — Content model: agent markdown corpus
- Create `src/content/agent/` with: `system-prompt.md`, `me.md`, `experience.md`, `skills.md`, `contact.md`, `projects/<slug>.md` per project, `facts/crazy-facts.md`.
- Stub realistic but final-shaped content (humanizer pass later in 0.9).
- **Verify:** `import.meta.glob('./agent/**/*.md', { query: '?raw', eager: true })` returns all files.

### 0.3 — Content sync check
- Add `scripts/check-content.ts` that loads `site.ts` and asserts every `projects[].slug` has a matching `agent/projects/<slug>.md`.
- Wire as `pnpm check-content`; fail with non-zero exit on mismatch.
- **Verify:** rename a markdown file, script fails; restore, script passes.

### 0.4 — Theme tokens + theme store
- Add CSS custom properties for all five themes (nord-green default, dracula, solarized-light, tokyo-night, anthropic-cream) in `src/styles.css` under `[data-theme="..."]` selectors.
- TanStack Store at `src/store/theme.ts` persists choice to `localStorage["portfolio.theme"]`.
- `useTheme()` hook applies `data-theme` to `<html>`.
- **Verify:** in a throwaway route, toggling theme via store updates DOM attribute and CSS vars resolve to expected hex values via DevTools.

### 0.5 — Typography + base styles
- Wire JetBrains Mono (primary) and Geist Mono (fallback) via `@font-face` or `next/font` analogue. Set `font-mono` as default body.
- Apply tracking, leading, base color tokens from `03-ui-experience.md`.
- **Verify:** Lighthouse reports no FOIT/FOUT; computed font-family on `<body>` is JetBrains Mono.

### 0.6 — Magic UI install pipeline
- Run `pnpm dlx shadcn@latest init` (if not done); confirm `components.json`.
- Install: `animated-grid-pattern`, `shimmer-text`, `magic-card`, `bento-grid`, `number-ticker`, `meteors`, `dock`, `marquee` via Magic UI registry URLs.
- Install shadcn fallbacks: `badge`, `card`, `dialog`, `tabs`, `tooltip`, `sheet`.
- **Verify:** all components import without error; `pnpm check` clean.

### 0.7 — Env validation
- `src/lib/env.ts` reads `OPENROUTER_API_KEY`, `OPENROUTER_DEFAULT_MODEL`, `GITHUB_TOKEN`, `GITHUB_USERNAME` with Zod; throws on missing on server only.
- Update `.env.example` with all four keys + comments.
- **Verify:** start dev server with one var missing; clear error names the missing key.

### 0.8 — Mode chooser at `/`
- `src/routes/index.tsx` becomes a chooser overlay: two cards ("Browse the portfolio" → stays at `/`, "Open terminal" → routes to `/terminal`).
- Reads/writes `localStorage["portfolio.mode"]` to skip on return visits (with reset query param `?choose=1`).
- **Verify:** clear localStorage, visit `/`, see chooser; pick UI; refresh, see UI directly; `?choose=1` re-shows chooser.

### 0.9 — Humanizer pass on agent corpus
- Run `/humanizer` against every file in `src/content/agent/`.
- **Verify:** no em-dashes-as-aside, no "delve / underscore / underscore", no rule-of-three, no AI vocab listed in skill.

### 0.10 — SEO scaffold
- `src/routes/__root.tsx` exports `head()` with title/description/og defaults.
- Add `src/routes/sitemap[.]xml.tsx` (lists `/`, `/terminal`) and `src/routes/robots[.]txt.tsx`.
- Inject JSON-LD `Person` schema in root head.
- **Verify:** `curl localhost:3000/sitemap.xml` returns valid XML with both routes; view-source on `/` shows JSON-LD block.

## Exit criteria

- [ ] `pnpm tsc --noEmit && pnpm check && pnpm check-content` all green.
- [ ] Chooser at `/` works; both routes return 200 (terminal route can be a stub).
- [ ] Theme switching demoed in a throwaway component.
- [ ] Magic UI + shadcn components importable.
