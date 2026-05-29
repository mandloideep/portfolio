# 03 — UI Experience

## Goal

The browser portfolio (`/`). Keeps the terminal-aesthetic vocabulary from sonephyo.com — `cat /section` headers, monospace, green/blue accents — but adds motion, depth, and interactivity so it doesn't feel like a static reskin. Magic UI first per CLAUDE.md.

## Aesthetic system

- **Type**: A mono-first stack — primary `JetBrains Mono` (or `Geist Mono`), display `Geist Sans` for the hero name. Mono everywhere else.
- **Color**: Driven by the same theme vars as the terminal so the UI inherits the visitor's chosen theme. Default `nord-green`.
- **Motion**: Subtle. Reveal-on-scroll, magnetic hover on cards, animated number tickers. `prefers-reduced-motion` disables all transforms.
- **Background**: `animated-grid-pattern` (Magic UI) at low opacity, masked with a radial gradient.
- **Borders**: 1px subtle on cards, rounded `lg`.

## Section order

1. **Hero**
   - Greeting line: `cat ~/whoami` styled echo.
   - Name in shimmer-text. Role under it (e.g., "AI / Full-stack engineer").
   - Status pill: `● open to roles` with pulse dot.
   - Two CTAs: `[ open in terminal → ]` (links to `/terminal`) and `[ download résumé ]`.
   - Right side / below: a tiny "live" widget — local time + last commit timestamp.

2. **Projects (bento)**
   - Magic UI `bento-grid`. One large featured tile, three medium, others as 1x1.
   - Tile content: project name (`/slug`), status chip (`[RUNNING]` / `[COMPLETE]`), one-line summary, tag chips.
   - Click tile → modal / expanded view with bullets, links, screenshots. Deep-linkable via `?project=slug`.

3. **Experience**
   - Vertical timeline. Each entry: company, role, date range, two-three bullets.
   - Animated dot fills in as it enters viewport.
   - Tech-tag chips per entry.

4. **Skills & Research**
   - Two-column on desktop, stacked on mobile.
   - Skills as grouped chip clusters (`Languages`, `Infra`, `AI`, `Sports`, `Fun`).
   - Research items as small cards with timeline indicators (matching the screenshot's research panel).

5. **Contribution heatmap**
   - 53-week grid pulling from `/api/github-graph`.
   - Tooltip on cell hover: date + commit count.
   - Caption: `N contributions in the last year`.
   - Below: a small stat trio (longest streak / current streak / busiest month).

6. **Contact**
   - Single card matching the screenshot's "→" layout: `github → handle`, `linkedin → handle`, `email → addr`, `resume → view`.
   - "Open in terminal" CTA at the bottom.

7. **Footer**
   - One-liner quip in a `$ ` echo, theme switcher dropdown, year, and a tiny "view source" link to the repo.

## Magic UI components to install

Via `pnpm dlx shadcn@latest add "https://magicui.design/r/<name>.json"`:

- `animated-grid-pattern` — hero background
- `shimmer-text` / `animated-shiny-text` — hero name + accent text
- `magic-card` — project tiles hover effect
- `bento-grid` — project layout
- `number-ticker` — stats reveal
- `meteors` — sparingly, behind hero on first paint
- `dock` — floating in-page nav (sections jump)
- `marquee` — for the tech-tags running band (optional)

Fallback shadcn primitives: `badge`, `card`, `dialog`, `tabs`, `tooltip`, `sheet` (mobile nav).

## Interactivity beats

- **Section nav**: floating `dock` at bottom with section icons; clicking smooth-scrolls + updates URL hash.
- **Theme switcher**: footer dropdown shares the terminal's theme registry. Picking a theme animates a 250ms cross-fade of CSS vars.
- **Project modal**: opening one updates `?project=slug` so it's shareable.
- **Hero "live time"**: updates every minute, in visitor's locale.
- **Keyboard**: pressing `t` anywhere opens terminal in a new tab.

## Accessibility

- All animations behind `prefers-reduced-motion`.
- Color tokens meet WCAG AA contrast (verify in implementation).
- Section landmarks (`<section aria-labelledby>`).
- Focus rings preserved, not stripped.
- Modal traps focus, returns it on close.
- Skip-link at the top: `Skip to main content`.

## Mobile breakpoints

- `< 640px`: single column, bento collapses to stack, dock becomes a top tab bar, timeline becomes a list.
- `640–1024px`: 2-col bento, side-by-side hero/CTA.
- `> 1024px`: full layout, 3-col bento.

## What this UI side is NOT

- Not a CMS-driven blog.
- Not multi-page — single scroll with deep-linkable sections.
- Not internationalized.
- Not gated behind login.
