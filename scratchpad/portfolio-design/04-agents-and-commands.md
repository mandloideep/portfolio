# 04 — Agents & Commands

The terminal recognizes three things:

1. **Slash commands** — local or LLM-backed, dispatched off the leading `/`.
2. **Shell commands** — only in shell mode (after `/exit`), small allowlist.
3. **Free-text** — anything not matching the above goes to the agent endpoint.

## A. Core slash commands (the "5–6 things")

Each of these is an "agent" in the sense that it composes context, possibly calls the LLM, and renders a rich block. They are intentionally few — depth over breadth.

| Command | Purpose | Behavior |
|---|---|---|
| `/me` | Profile, bio, education, current focus | Reads `content/agent/me.md`, asks the LLM to summarize in 4–6 lines unless `--raw` is passed. |
| `/projects [slug]` | List or drill into a project | No-arg: renders a project list block (titles, status chips, one-liners). With slug: opens that project's card with bullets + tags + links. Slug autocompletes on Tab. |
| `/experience` | Roles + internships + teaching | Renders a timeline-styled block from `content/agent/experience.md`. |
| `/skills` | Skills, sports, fun facts | Renders chip-cluster block from `content/agent/skills.md`. |
| `/contact` | Email, links, internship interests | Renders the `→` style card. Says what roles Deep is open to. |
| `/presentation` | Auto-narrated agent tour | Streams a guided walkthrough: greets the visitor, then plays sections in order (`me → projects → experience → skills → contact`), pausing briefly between each. Cancelable with Ctrl+C. |

## B. Utility / API commands

| Command | Purpose | Notes |
|---|---|---|
| `/help` | List all commands with one-line descriptions | Categorized: core / utility / shell. |
| `/model` | Show current model | No arg: prints current model + ~price/token. |
| `/model <id>` | Swap model | Persisted to `localStorage['portfolio.terminal.model']`. Validated against an allowlist (a curated set of OpenRouter IDs). |
| `/model list` | Show available models | Pulls the curated allowlist with prices. |
| `/theme` | Show current theme | |
| `/theme <slug>` | Swap theme | Persisted to localStorage. |
| `/theme list` | Show available themes | |
| `/github` | Recent activity + heatmap | Calls `/api/github-graph`. Renders a compact heatmap block plus the last N public events. |
| `/weather [city]` | Local or named city weather | No-arg uses IP geolocation. |
| `/resume` | Open résumé PDF | `window.open('/resume.pdf', '_blank')`. |
| `/ui` | Switch to the UI version | Navigates to `/`. |
| `/clear` | Clear scrollback | Same as Ctrl+L. |
| `/history` | Show command history | |
| `/retry` | Re-run the last prompt | Useful after a stream error. |
| `/exit` | Drop into shell mode | Prompt becomes `$ `. |

### `/model` allowlist (initial, finalize at impl time)

- `google/gemini-2.5-flash-lite` ← default
- `meta-llama/llama-3.3-8b-instruct`
- `anthropic/claude-haiku-4.5`
- `openai/gpt-5-mini`
- `deepseek/deepseek-chat`

Keep this in `src/lib/openrouter.ts` so it's one edit to add/remove a model.

## C. Shell-mode commands (after `/exit`)

Allowlist only; everything else returns `command not found: <cmd>`.

| Command | Behavior |
|---|---|
| `pwd` | `~/portfolio` (constant) |
| `ls [path]` | Lists fake VFS entries. Default lists `~/portfolio`. |
| `cd <path>` | Updates a virtual cwd. Only valid VFS paths accepted. |
| `cat <file>` | Prints the markdown source verbatim (raw, no LLM). |
| `echo <text>` | Echoes the text. Supports `$VAR` expansion for `$USER`, `$HOME`, `$PWD`. |
| `whoami` | Prints `guest` (or the visitor's set name from `/setname`). |
| `date` | Current local date/time. |
| `history` | Prints shell-mode history. |
| `clear` | Same as `/clear`. |
| `help` | Lists shell commands. |
| `neofetch` | ASCII Deep-logo + system stats (theme, model, session age, etc.). |
| `uname` | `deep-portfolio 0.1.0` |
| `deep` | Re-enter agent mode. |
| `claude` | Alias for `deep` (Easter egg). |
| `open ui` | Navigate to `/`. |
| `vim`, `nano` | Print `error: editor not available · cat <file> to view` |
| `sudo *` | `permission denied: you are not in the sudoers file. This incident will be reported.` (joke) |

## Fake VFS layout

`ls ~/portfolio` shows:

```
projects/        experience.md   skills.md       contact.md
me.md            resume.pdf      README.md       .secrets/
```

- `projects/` is a directory; `ls projects/` lists each project markdown.
- `cat README.md` prints a short readme about how to navigate (basically `/help` content).
- `cat .secrets/` returns `nice try.`
- All other paths: `cat: no such file or directory`.

The VFS lives in `src/lib/vfs.ts`, derived from `import.meta.glob('../content/agent/**/*.md', { eager: true, as: 'raw' })`. Add a file → it shows up in `ls`. Zero wiring.

## Free-text → agent

If input doesn't start with `/` (in agent mode), it's sent to `/api/agent` with:

```ts
{
  messages: [...history, { role: 'user', content: input }],
  model: currentModel,
  contextSelector: 'all' | 'me' | 'projects' | …   // optional hint
}
```

The server stuffs the relevant markdown files into the system prompt (cap each file ~4KB; total under model context budget).

## Context selection heuristic

To keep prompts cheap, the server picks a subset based on keywords in the user message:

- Mentions "project", "build", "code" → include `projects/*.md`.
- Mentions "intern", "role", "work", "hire" → include `experience.md`, `contact.md`.
- Mentions "skill", "language", "tech" → include `skills.md`.
- Mentions "Deep", "you", "your" → include `me.md`.
- Default / ambiguous → include `me.md` + `contact.md` only.

Always include `system-prompt.md`.

## Activity stream lines

The server's SSE response is interleaved with annotation events so the UI can show "what the agent is doing":

```
event: activity
data: {"step":"reading","files":["content/agent/projects/mydininghall.md"]}

event: activity
data: {"step":"calling","model":"google/gemini-2.5-flash-lite"}

event: token
data: "Deep built mydininghall..."

event: done
data: {"tokens":412,"cost_usd":0.0001}
```

Client maps `activity` events to the `◇` header lines; `token` events append to the active markdown block; `done` finalizes.
