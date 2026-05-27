# 02 — Terminal Experience

## Goal

Imitate Claude Code closely enough to feel familiar — banner, slash commands, streaming model output, theme switching, exit-to-shell — without being a 1:1 clone. The product is named **`deep`** in-app (not "Claude"), so `/exit` drops you out of `deep` and re-entry is via the `deep` command at the `$` prompt.

## Layout

```
┌─ ◯ ◯ ◯  deep — portfolio — 80×24 ────────────────────────────────┐
│                                                                  │
│   * Welcome to deep v0.1.0                                       │
│                                                                  │
│     cwd: ~/portfolio                                             │
│     model: google/gemini-2.5-flash-lite                          │
│     theme: nord-green                                            │
│                                                                  │
│     /help for commands · type anything else to ask deep          │
│                                                                  │
│   ─────────────────────────────────────────────────────────────  │
│                                                                  │
│   deep@portfolio:~ ❯ /me                                         │
│                                                                  │
│   ◇ reading content/agent/me.md                                  │
│   ◇ calling openrouter (gemini-2.5-flash-lite)                   │
│                                                                  │
│   Deep Mandloi — CS student at NEIU, building agent-tech…        │
│                                                                  │
│   ─────────────────────────────────────────────────────────────  │
│                                                                  │
│   deep@portfolio:~ ❯ ▍                                           │
└──────────────────────────────────────────────────────────────────┘
```

- **Fake macOS chrome**: traffic-light dots (decorative only), title bar with cwd/dimensions.
- **Scrollback area**: virtualized for long sessions; auto-scrolls to bottom unless user scrolls up.
- **Prompt**: caret blinks via CSS animation. Multi-line input supported (Shift+Enter).
- **Footer status line** (subtle): `model · theme · ⌃C cancel · ⌃L clear · /exit shell`.

## Modes

### `agent` (default)

- Prompt prefix: `deep@portfolio:~ ❯`
- Slash commands handled locally (see `04-agents-and-commands.md`).
- Anything else POSTs to `/api/agent` with `{ messages, model, contextSelector }`.
- Response streams tokens; mid-stream, an "activity" header line shows real server steps:
  ```
  ◇ reading content/agent/projects/*.md
  ◇ calling openrouter (gemini-2.5-flash-lite)
  ◆ done · 412 tokens · $0.0001
  ```
  These come from server-side hints in the SSE stream — they're not theatre.

### `shell` (after `/exit`)

- Prompt prefix: `$ ` (plain).
- No LLM. Commands match a small allowlist (see `04-`).
- Re-enter agent with `deep` (or `claude`, kept as an alias for the joke).
- `ls` reveals a flat fake VFS that mirrors `content/agent/` — `cat` actually prints those markdown files raw.

## Boot sequence

On first paint:

1. Render banner immediately (no spinner).
2. ~400ms of "fake load" lines staggered (model line, theme line, hint line).
3. Focus the prompt input.
4. Restore session: if `localStorage['terminal.history']` exists, optionally restore on a `/history --restore` flag (default: fresh session).

Honest about the fakery — no spinner pretending to compile rust. Just enough atmosphere.

## Keyboard map

| Key | Effect |
|---|---|
| `↑ / ↓` | Cycle command history |
| `Tab` | Autocomplete slash command, then filename in shell |
| `Ctrl+L` | Clear scrollback |
| `Ctrl+C` | Cancel active stream / clear input |
| `Ctrl+K` | Open command palette (visual list of all commands) |
| `Shift+Enter` | Newline in prompt |
| `Enter` | Submit |
| `Esc` | Defocus prompt (mobile dismiss keyboard) |

## Mobile

- Font size scales down to 13px; keep monospace.
- Below the prompt, render a horizontally scrolling row of quick-command chips: `[/me] [/projects] [/skills] [/contact] [/help]`. Tapping inserts the command.
- Soft keyboard is auto-summoned on load only on `?focus=1` to avoid surprising users.
- `Ctrl+*` shortcuts replaced by a small toolbar above the keyboard.

## Themes

Theme is a CSS variable bundle keyed off `<html data-theme="...">`. The terminal observes `data-theme` and re-renders zero React (CSS-only). Themes file: `src/lib/theme.ts`.

Initial themes (placeholder names; finalize hex during implementation):

| Slug | Vibe |
|---|---|
| `nord-green` (default) | Dark slate background, bright `#69ff96` accents, gray body |
| `dracula` | Classic dracula palette |
| `solarized-light` | Solarized light, beige bg |
| `tokyo-night` | Deep blue-black, neon-pink accents |
| `anthropic-cream` | Cream bg, warm orange accents — nod to Claude Code's light theme |

`/theme` with no arg lists available themes; `/theme <slug>` switches. Persisted to localStorage as `portfolio.terminal.theme`.

## Streaming UX detail

The model returns markdown. We render with `react-markdown` + `remark-gfm` + `rehype-shiki`. As tokens arrive:

- Headings get colored per theme.
- Inline code uses the prompt accent color.
- Code blocks get syntax highlighting once the fenced block is closed (we re-render on stream chunks; shiki is cheap enough).
- Links open in a new tab.
- Tables render with terminal-ish borders (using box-drawing chars).

## Error states

- **OpenRouter 401 / quota**: terminal prints a red `! error: model unavailable · try /model <other>`.
- **Network drop mid-stream**: print `! stream aborted · /retry to re-run` and store the last prompt for `/retry`.
- **Unknown slash command**: print `unknown command: /foo · /help for the list`.

## What we explicitly are NOT doing

- No xterm.js / no PTY emulation. This is a styled React log, not a real shell.
- No Vim/Emacs key modes (`/` is just a prefix, not a search trigger).
- No tabs / split panes — single buffer.
- No persisting agent context across sessions (privacy + cost). Session-only.
