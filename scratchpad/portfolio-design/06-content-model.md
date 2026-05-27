# 06 — Content Model

Two separate content surfaces, intentionally split:

- **UI constants** — typed TypeScript, imported at build time, rendered into static HTML for SEO and fast paint.
- **Agent markdown corpus** — plain `.md` files, read by the server route, fed to the LLM as context.

The two should overlap in subject matter but not be duplicated. The constants are the source of truth for *structured* data (project name, status, tags); the markdown is the source of truth for *prose* (project story, what was hard, what shipped).

## A. UI constants — `src/content/site.ts`

A single typed file. Zod schemas validate at module load — if a project is missing a required field, the build fails loudly.

```ts
// src/content/site.ts

import { z } from 'zod'

export const siteMeta = {
  name: 'Deep Mandloi',
  role: 'AI / Full-stack engineer',
  status: 'Open to internships & SWE roles',
  email: 'dmandloi@neiu.edu',
  location: 'Chicago, IL',
  links: {
    github: 'https://github.com/deepmandloi',
    linkedin: 'https://linkedin.com/in/deepmandloi',
    resume: '/resume.pdf',
  },
  quip: 'No bugs were harmed as of making this website.',
} as const

const ProjectSchema = z.object({
  slug: z.string(),
  title: z.string(),
  status: z.enum(['running', 'complete', 'wip', 'archived']),
  summary: z.string(),
  bullets: z.array(z.string()),
  tags: z.array(z.string()),
  links: z.object({
    live: z.string().url().optional(),
    repo: z.string().url().optional(),
    poster: z.string().url().optional(),
  }).default({}),
  featured: z.boolean().default(false),
})
export type Project = z.infer<typeof ProjectSchema>

export const projects: Project[] = z.array(ProjectSchema).parse([
  {
    slug: 'mydininghall',
    title: 'mydininghall.com',
    status: 'running',
    summary: 'Multi-tenant campus dining platform — real-time menus, observability.',
    bullets: [
      'Multi-tenant: serves multiple universities from one stack',
      'Celery + Redis scraping with fallback handling',
      'Prometheus / Grafana / Loki observability',
      'Cloudflare + Nginx production config',
    ],
    tags: ['Python', 'Django', 'React', 'PostgreSQL', 'Celery', 'AWS'],
    links: { live: 'https://mydininghall.com' },
    featured: true,
  },
  // … more
])

// experience, research, skills, themes — same pattern
export const experience: Experience[] = …
export const research: Research[] = …
export const skills: SkillGroup[] = …
export const themes: Theme[] = …
```

UI components import this directly. SSR renders everything into static HTML.

**Adding a new project** = add an entry to `projects[]` and (recommended) drop a matching markdown file in `src/content/agent/projects/<slug>.md`.

## B. Agent markdown corpus — `src/content/agent/`

```
src/content/agent/
├── system-prompt.md        # persona, tone, refusal rules
├── me.md                   # bio, education, current focus
├── experience.md           # roles, internships, teaching
├── skills.md               # tech + sports + fun facts
├── contact.md              # how to reach + what roles
├── projects/
│   ├── mydininghall.md
│   ├── findingfive.md
│   └── …
└── facts/
    └── crazy-facts.md      # for "fun" / Easter-egg queries
```

Each markdown file:

- Starts with an `# H1` title.
- Free-form prose underneath. Tables and code blocks fine.
- Plain English. No frontmatter required.

These files are loaded server-side via:

```ts
const corpus = import.meta.glob('../content/agent/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})
```

`corpus` becomes a `Record<string, string>` keyed by relative path. The agent server route picks a subset per the heuristic in `04-agents-and-commands.md`.

## `system-prompt.md` template

The persona file (not user-editable in production but lives in repo for visibility):

```md
# Deep Mandloi — Portfolio Assistant

You are an assistant on Deep Mandloi's portfolio site. Your job is to help
visitors learn about Deep's work, experience, and how to contact him.

## Tone
- Friendly, terse, technical when appropriate.
- Write like a tech engineer: short sentences, lowercase, examples over adjectives.
- Never invent facts. If you don't know, say so and suggest emailing Deep.

## Format
- Reply in Markdown. The client renders it in a terminal — use code fences,
  short bullet lists, and avoid huge tables.
- Headings are fine. Keep them h2 / h3.
- Links should be inline.

## Refusal
- If asked to do something off-topic (write essays, do homework, etc.), politely
  redirect to portfolio topics.
- Never claim to be Deep. You are an assistant *about* Deep.

## Available context
The user message will be answered using the markdown files attached as
context — they are the ONLY source of truth about Deep.
```

## How the two surfaces stay in sync

- **Manual.** No code generation. The constants file is for the UI; the markdown is for the agent. Deep edits both when adding a project.
- **Sanity check at build time.** A tiny script in `scripts/check-content.ts` (run in CI) verifies every `projects[].slug` has a matching markdown file under `content/agent/projects/`. Mismatch → CI fails.

## Adding new content — workflow

1. Add a project to `src/content/site.ts` (typed, validated).
2. Add prose at `src/content/agent/projects/<slug>.md`.
3. (Optional) Add a screenshot/poster to `public/projects/<slug>.{png,jpg}`.
4. Run `pnpm check-content` locally — fails fast if anything's missing.
5. Commit. The UI rerenders the bento; the terminal's VFS picks up the new `cat` target automatically.

## Why this split (vs. a single source)

- **UI needs structure** (status enum, tags array) → easier in TS than markdown frontmatter.
- **Agent needs prose** (narrative, voice) → easier in markdown than escaped strings in TS.
- **Shipping size**: the markdown bundles into the *server* build only; the UI bundle ships just the typed constants. Visitors don't download the full corpus on `/`.
- **Versioning friendly**: markdown diffs cleanly in PR review; constants stay machine-readable.
