---
slug: commentdraw
title: CommentDraw
status: running
summary: full-stack saas that picks fair winners from youtube giveaway comments, with stripe billing and a loyalty-weighted draw.
pitch: deep built a tool that scrapes youtube comments, dedupes by channel, and picks a winner in one click. solo project, nine months, still online.
endpoint: curl -s api-cw.deepmandloi.com/actuator/health
cta: visit site
meta: java 25 + spring boot · react 19 + rtk query · hetzner + cloudflare pages
tags:
  - Java 25
  - Spring Boot 3.5
  - React 19
  - Stripe
  - MySQL
  - Docker
bullets:
  - paginates the youtube data api and dedupes by channel id
  - stripe checkout with signed webhook handling, test mode
  - bucket4j + redis for distributed rate limiting
  - event-driven email pipeline through brevo's rest api
  - one vps, one cdn, runs on roughly five euros a month
links:
  live: https://commentdraw.deepmandloi.com
stats:
  - { value: "158", label: "commits", sublabel: "9 months solo", pulse: true }
  - { value: "22", label: "rest endpoints", sublabel: "5 controllers + stripe webhooks" }
  - { value: "13.8k", label: "loc", sublabel: "java + react, 266 files" }
screenshots:
  - { path: "hero.png", caption: "paste a video url, get a winner" }
  - { path: "detail.png", caption: "dashboard with giveaway history" }
---

# CommentDraw

## Overview

commentdraw picks giveaway winners from youtube comments. a creator pastes one or more video urls, the backend pages through the youtube data api, dedupes commenters by channel id, optionally filters by keyword, and runs a loyalty-weighted draw that favors people who showed up across multiple videos. one click, one winner, no scrolling through three thousand comments at 1am.

it's aimed at small-to-mid creators who run giveaways and don't want to do the bookkeeping by hand. three plans — free, gold, diamond — with quotas enforced server-side before any external call goes out. stripe handles billing in test mode; the rest of the stack is production-shaped.

## Challenges

the stripe sdk was the loudest one. between minor versions, `Event.getObject()` started returning empty optionals for webhook payloads because internal field names drifted. deep switched the webhook handler to `deserializeUnsafe()` against the raw json, which sidesteps the type-mapping mismatch entirely. it's the documented escape hatch but easy to miss — the failure mode is silent, just signed events that quietly parse to nothing.

rate limiting was the second one. a single-instance token bucket falls apart the moment you horizontally scale, and a public youtube-api wrapper is exactly the kind of thing that gets hammered. deep wired bucket4j to a redis (dragonflydb in prod) proxy manager so the buckets live in shared state, keyed per email per endpoint, with daily resets via date-based cache keys. quota enforcement also runs at the service layer *before* the upstream call, so a misbehaving client can't burn the youtube quota by hitting an alternate endpoint.

the third was free-tier infra fighting back. aiven's free mysql tier auto-shuts-down on inactivity, which is fine until you wake up to a cold backend at 3am. fix: a scheduled `@Scheduled` job that pings the db daily at 9 utc. ugly but it works, and the alternative was paying for a tier deep didn't need.

## Learnings

spring's `ApplicationEventPublisher` carried more weight than expected. payment success, registration, password reset, account deletion — all five became events with their own listeners, and the controllers stopped knowing about email at all. the brevo client only exists in one place. swapping to ses later would be a one-file change.

on the frontend, rtk query's `baseQueryWithReAuth` middleware turned out to be the move. the rest of the app never sees a 401 — the middleware intercepts, hits the refresh endpoint, retries the original request, and the components stay unaware. that pattern saved a lot of error-handling boilerplate that deep had already written twice on previous projects.

if he did it again he'd skip aiven and just run mysql on the same vps. the keep-alive cron, the tls config, the network round-trip — none of it was worth the savings. the rest of the architecture held up.

## Stack

java 25 on spring boot 3.5 for the backend, with spring data jpa, spring security + jwt, bucket4j for rate limiting, and the stripe and youtube java clients for the external calls. react 19 + vite 7 on the frontend, redux toolkit + rtk query for state and api, tailwind 4 for styling, framer motion + lottie + canvas-confetti for the winner reveal. mysql 8.4 on aiven, dragonflydb for cache and rate-limit state, cloudinary for avatars, brevo for transactional mail. github actions builds an image to ghcr, dokploy on a hetzner 4gb vps pulls it, traefik does the tls. cloudflare pages serves the frontend.

## What's next

instagram and tiktok comment ingestion are the obvious extensions — same selection algorithm, different sources. multi-creator team accounts would unlock the higher tier. and at some point the test-mode stripe keys need to come out, but that's a launch decision, not an engineering one.

---

## Resume pointers

> Below is a separate register — resume bullets follow standard capitalization and start with strong verbs. Pick 3–5 that fit the role; don't paste all of them.

### One-line project header

> **CommentDraw** — Full-stack YouTube giveaway SaaS · Java 25, Spring Boot 3.5, React 19, MySQL, Stripe · [commentdraw.deepmandloi.com](https://commentdraw.deepmandloi.com)
> Solo project, ~13.8k LOC across 266 files, 158 commits over 9 months.

### Bullets (pick the ones that match the role)

**Backend / systems-leaning roles:**
- Designed and shipped a production-grade Spring Boot 3.5 backend on Java 25 with 22 REST endpoints across 5 controllers, 9 JPA entities, and 21 JUnit 5 tests covering controllers, services, and repositories.
- Implemented distributed rate limiting with Bucket4j backed by a Redis-compatible store (DragonflyDB), keyed per-user per-endpoint with daily resets, preventing third-party API quota exhaustion under horizontal scale.
- Integrated Stripe Checkout with signed-webhook verification; diagnosed a silent SDK regression between minor versions and resolved it by switching to `Webhook.deserializeUnsafe()` against the raw JSON payload.
- Built an event-driven email pipeline using Spring's `ApplicationEventPublisher` with 5 event types (registration, payment success, password reset, account deletion, verification resend) routed asynchronously through Brevo's REST API; decoupled email logic from controllers entirely.
- Designed a loyalty-weighted selection algorithm that merges YouTube comments by channel ID across multiple videos and ranks candidates by keyword match, participation breadth, frequency, and timestamp — implemented as a pure function for deterministic unit testing.

**Frontend-leaning roles:**
- Built a React 19 SPA with 52 components and 20 lazy-loaded routes using Vite 7, Redux Toolkit + RTK Query, and Tailwind 4; reduced initial bundle size via route-level code splitting with Suspense.
- Designed an RTK Query middleware (`baseQueryWithReAuth`) that transparently intercepts 401s, hits the refresh endpoint, and retries the original request — eliminating repetitive auth-error handling across the codebase.
- Implemented dark/light theming, animated winner reveals (Framer Motion + Lottie + canvas-confetti), and dashboard analytics with Recharts.

**DevOps / infra-leaning roles:**
- Consolidated hosting from multiple PaaS providers onto a single Hetzner 4GB VPS running Dokploy + Traefik + Let's Encrypt for the backend and Cloudflare Pages for the frontend, cutting monthly cost to roughly €5.
- Built a GitHub Actions CI/CD pipeline: Maven test → multi-stage Docker build → GHCR push → Dokploy webhook redeploy; deployment is one manual workflow trigger.
- Engineered around free-tier database constraints with a daily scheduled keep-alive job preventing Aiven MySQL auto-shutdown, while keeping the VPS RAM budget under 1.4 GB of 4 GB.

**Security / auth-leaning roles:**
- Implemented stateless JWT authentication with HttpOnly refresh-token rotation, Google OAuth2 token exchange, and a Spring Security filter chain; enforced plan-tier quotas at the service layer *before* external API calls to prevent abuse from bypassing rate limiting.

### Skills demonstrated (for skills section)

> Java 25 · Spring Boot 3.5 · Spring Data JPA · Spring Security · JWT · Maven · React 19 · Redux Toolkit · RTK Query · Vite · TailwindCSS · MySQL · Redis / DragonflyDB · Stripe API · YouTube Data API v3 · Bucket4j · Docker · GitHub Actions · Hetzner · Cloudflare · Dokploy · JUnit 5 · OAuth2

### Framing tips

- Lead with **what you built and the scale** ("22 REST endpoints", "13.8k LOC"), not adjectives.
- Pair every technical choice with **why it mattered** ("Bucket4j with Redis proxy *to survive horizontal scale*" beats "used Bucket4j for rate limiting").
- For one-line résumé descriptions, the stack + URL + "solo project" line is the strongest opener — it shows scope and that it shipped.
- If the role is senior/staff: emphasize the **architecture decisions** (event-driven email, stateless JWT, distributed rate limiting). If junior: emphasize **scope and breadth** (full-stack, 158 commits solo, deployed).
