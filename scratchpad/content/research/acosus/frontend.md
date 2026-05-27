---
slug: acosus-frontend
title: ACOSUS Dashboard
status: running
summary: role-aware student-success dashboard for advisors, students, and admins — built mostly solo over 23 months.
pitch: deep built the frontend for ACOSUS, a student-success platform at NEIU. it's a single react SPA with three audience shells (student, advisor, admin) plus a public marketing site — about 102k lines of typescript, still shipping.
endpoint: git -C acosus/frontend shortlog -sne | head
cta: view repo
meta: react 18 · typescript · 97% solo across 23 months
tags:
  - TypeScript
  - React 18
  - Vite
  - shadcn/ui
  - TanStack Query
  - Docker
bullets:
  - shipped 110 routes across student, advisor, admin shells
  - 102k LOC of typescript, no runtime test suite (yet)
  - github actions pipeline that renews ssl when <30 days left
  - react-query retries with backoff but bails on 401/403
links:
  repo: https://github.com/acosus/frontend
stats:
  - { value: "102k", label: "LOC shipped", sublabel: "ts + tsx in src/" }
  - { value: "155", label: "commits", sublabel: "over 23 months, 97% solo", pulse: true }
  - { value: "110", label: "routes", sublabel: "student · advisor · admin shells" }
screenshots:
  - { path: "hero.png", caption: "admin dashboard — model monitoring tab" }
  - { path: "detail.png", caption: "student survey with autosave + rich-text notes" }
---

# ACOSUS Dashboard

## Overview

deep built the frontend for ACOSUS, a student-success platform at northeastern illinois university. it's a single-page react app with three audience shells under `/app/*` — students take surveys and view predictions, advisors triage at-risk students and leave notes, admins manage universities, eligibility rules, models, and qualtrics integrations. a public marketing site (`/`, `/insights`, `/our-team`, `/news`, `/contact-us`) wraps the auth flow.

the upstream `README.md` is still the shadcn-admin template's — never replaced. the real shape of the project lives in `src/mainRouter.tsx` (110 routes, lazy-split at every major boundary) and `RESUME_EVIDENCE.md`.

## Challenges

the hardest part was scope without a team. 151 of 155 commits are deep's, across three different git identities he'd forgotten to consolidate. every feature — surveys with autosave, advisor messaging, rich-text notes in lexical, model monitoring dashboards, knn training UI, eligibility rules, qualtrics tracking codes, university management — landed as one more route in the same router. no design system review, no second pair of eyes. the codebase grew to 102k lines of typescript across 610 files before anyone wrote a test, which is now its biggest liability.

react-query's defaults didn't fit either. an expired session would silently retry three times before surfacing, so deep wrote a custom queryClient that retries with 1s/2s/4s backoff for transient failures but skips 401/403 entirely — sessions die immediately instead of after seven seconds of mystery loading.

deploy was its own rabbit hole. the github actions workflow pulls secrets from one sibling repo, the docker-compose from another, ssh's into the box, renews the ssl cert if it has less than 30 days left, and prunes docker images older than 72 hours. it works, but it's the kind of pipeline that's terrifying to inherit.

## Learnings

deep learned that "solo" stops being a flex around month nine. without tests, every refactor is a coin flip — and after 102k lines and 23 months, even small changes felt heavy. next project gets vitest from commit one.

he also learned to trust react-query but distrust its defaults. retry policies, stale times, refetch-on-focus — every one of them is a product decision dressed as a config flag. writing those choices down (in `src/main.tsx`, with a comment about 401/403) was more valuable than the code itself.

the upstream-template README never getting replaced is the most honest artifact in the repo. it's what happens when shipping wins for two years straight. worth the trade — but worth admitting.

## Stack

react 18, typescript 5.4, vite 5.3, react-router 6.23, tanstack-query 5.45, shadcn/ui on top of radix and tailwind, react-hook-form + zod for every form, lexical for rich-text notes, recharts for the dashboards, framer-motion for transitions, wink-nlp + wink-bm25 for client-side search, posthog for analytics, sonner for toasts. multi-stage docker → nginx:alpine in prod, vite dev server in dev. github actions handles build, push, ssh-deploy, ssl renewal.

## What's next

still on `feat-v2-target-factor-survey` — v2 of the target-factor survey is the next ship. after that: replace the template readme, add vitest + a smoke layer of playwright tests, and finally split the router file before it crosses 1,200 lines.

---

## Resume Pointers

Notes for the resume version — every number ties to a real command in the repo, so you can defend any of these in an interview.

### Project header (pick one)

**Concise:**
> **ACOSUS — Student-Success Platform** · Frontend Engineer · NEIU Research · May 2024 – present
> *React 18 · TypeScript · Vite · TanStack Query · shadcn/ui · Docker · GitHub Actions*

**With one-line context (better if you have room):**
> **ACOSUS Frontend** — role-aware dashboard for a NEIU student-success research platform (students, advisors, admins). Built and shipped solo (151 of 155 commits) over 23 months.

### Resume bullets (pick 3–5)

Strong, scannable, all defensible. Lead with a verb, end with a number or a "why."

- **Designed and shipped a 102k-LOC React SPA** powering three role-aware shells (student, advisor, admin) across 110 lazy-loaded routes, plus a public marketing site — 97% sole contributor across 155 commits over 23 months.
- **Built the data layer** on TanStack Query with a custom retry policy (3 attempts, 1s/2s/4s backoff) that **skips 401/403** so expired sessions surface immediately instead of after seven seconds of silent retries.
- **Authored the production pipeline**: multi-stage Dockerfile (`node:lts-alpine` → `nginx:alpine`) plus a GitHub Actions workflow that pulls secrets from a sibling repo, **auto-renews SSL when <30 days remain**, and prunes Docker images older than 72 hours.
- **Implemented advisor↔student workflows** end-to-end: Lexical rich-text notes, messaging, eligibility-rule management, Qualtrics survey integrations, and Recharts model-monitoring dashboards (KNN training, data-quality, model archiving).
- **Engineered an offline-tolerant survey UX** with `react-hook-form` + Zod validation, autosave to `localStorage`, and progress indicators — students can lose connection mid-survey and resume without data loss.
- **Integrated client-side BM25 search** (wink-nlp + wink-bm25) for student/advisor lookups, avoiding a server round-trip for ~250ms responsiveness on directory-style queries.
- **Set up the dev platform**: ESLint + Prettier + Husky + lint-staged, Vite SWC build, TanStack Query Devtools, PostHog analytics wired at the app shell, multi-environment Docker (dev/prod).

### Skills section (extracted, deduped)

- **Languages/Frameworks**: TypeScript, React 18, JavaScript (ES2022)
- **Frontend**: Vite, React Router, TanStack Query, shadcn/ui, Radix UI, TailwindCSS, react-hook-form, Zod, Lexical, Recharts, framer-motion
- **Tooling**: ESLint, Prettier, Husky, lint-staged, PostHog
- **Infra**: Docker (multi-stage), nginx, GitHub Actions, Let's Encrypt / SSL automation
- **Patterns**: lazy route-level code-splitting, role-based routing, optimistic UI, custom React Query retry policies, client-side full-text search

### Honest caveats (don't put on the resume, but be ready to discuss)

- **No automated tests.** Zero `*.test.*` files, no vitest/jest config. If asked "what would you do differently," lead with this — answer: vitest from day one + a thin Playwright smoke layer.
- **Upstream template README never replaced.** Be ready to say "I optimized for shipping; documentation cleanup was the trade."
- **Three git identities.** ~97% of commits are yours, split across `mandloideep22@gmail.com`, the GitHub noreply, and a `mandloideep` alias. If a recruiter checks GitHub and sees only ~57 commits on one identity, mention this upfront.
- **No production analytics in the repo.** PostHog is wired but DAU/MAU/web-vitals live in the dashboard, not the codebase — quote those numbers from PostHog directly if you cite them.

### One-line elevator version

> Built and shipped a 102k-LOC React/TypeScript dashboard for a university student-success platform — three role shells, 110 routes, full Docker + GitHub Actions deploy pipeline — solo across 23 months.
