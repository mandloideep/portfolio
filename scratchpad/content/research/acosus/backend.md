---
slug: acosus-backend
title: ACOSUS Backend
status: running
summary: survey-driven student-risk prediction backend for a neiu research platform, still shipping
pitch: deep built the backend for acosus, a research platform at northeastern illinois university that surveys students and predicts who's about to disengage. it runs in production, talks to a flask knn service, and has been a one-person job for 23 months.
endpoint: curl -s acosus.neiu.edu/api/v2/health
cta: visit site
meta: 73.4k LOC · 327 routes · solo since 2024
tags:
  - TypeScript
  - Node.js
  - Express
  - MongoDB
  - Docker
  - KNN
bullets:
  - 327 rest endpoints across v1 and v2, one express app
  - knn pipeline triggers training at n≥10, predicts via flask
  - qualtrics redirect-back confirms survey completion in real time
  - multi-worker node cluster, github actions, ssh deploy to neiu infra
links:
  live: https://acosus.neiu.edu/login
stats:
  - { value: "73.4k", label: "LOC", sublabel: "typescript across 10 mongoose models" }
  - { value: "327", label: "rest endpoints", sublabel: "v1 + v2 in one express app" }
  - { value: "157", label: "commits", sublabel: "over 23 months, solo, still shipping", pulse: true }
---

# ACOSUS Backend

## Overview

acosus (advisor-centered outcomes support unified system) is a research platform at northeastern illinois university that surveys students, predicts which ones are likely to disengage, and gives advisors a dashboard to act on it before the student drops. deep built and runs the backend solo — every route, every model, every deploy.

the api serves three audiences out of one express app: students take surveys and get nudges, advisors monitor cohorts and message at-risk students, and admins configure the survey content, manage universities, and look at prediction accuracy. it's live at acosus.neiu.edu, talks to a separate flask service for the knn model, and has been in continuous development since may 2024.

## Challenges

the backward-compat code paths bit hardest. one fix in `assignAdvisorsToPopulatedUniversities` was set to fan out advisor assignments across all 50,000+ universities in the dataset instead of just the handful with real students — caught before it shipped, but only because deep walked the migration line by line. similar story with the settings registry: configuration was split across an init json, a constants file, validation, and the controller, so when a new setting like `survey.expandedSignup` showed up in one place but not the others, it silently did nothing. fixing it meant collapsing four files into a single source of truth and writing a v6 migration to backfill the metadata in prod.

qualtrics tracking was its own thing. the research team needs to know in real time whether a student finished an external qualtrics survey so they can send a gift card. the fix was generating a unique tracking code per student, embedding it in the qualtrics url, and having qualtrics redirect back to acosus on completion so the backend could confirm and write the timestamp. lots of small edge cases — partial completions, codes that get shared, students who close the tab.

the knn pipeline was the longest arc. predictions run on a separate flask model server, but the backend owns readiness-score calculation, training-data assembly, the trigger logic that fires training once n≥10 students complete a target survey, and the request that pulls predictions back per student. it spans phase docs in `scratchpad/KNN/` and at least a dozen commits. and there are no automated tests — validation is a manually-maintained checklist in `scratchpad/complete-validation.md`, which is fine until it isn't.

## Learnings

a settings registry beats scattered constants every time. the 4-file version felt fine when there were 5 settings and started swallowing fields the moment there were 20. once it was one file with explicit metadata, the whole class of "why isn't this taking effect" bugs went away.

backward-compatible code needs explicit guards, not assumptions. deep learned to grep every place a feature gets touched before assuming the new path is safe — the universities fan-out bug would have been a 90-minute incident in production, and the only reason it wasn't is that he stopped trusting his own migration code.

the no-test-suite trade-off is honest but expensive. shipping fast solo on a research codebase meant skipping vitest/jest from day one, and the manual checklist mostly works because deep is the only one touching it. as soon as a second person joins or someone has to ship a fix at 11pm, that calculus flips. next refactor pass starts with integration tests around the knn trigger path.

## Stack

node 20 (22 in prod) with typescript 5.4, express 4.19, mongodb 8 + mongoose 8.4, zod for request validation, jwt with refresh-token rotation, bcrypt, winston + posthog for logs and analytics, resend + nodemailer for transactional email, node-cron for scheduled jobs, pdfkit for exports, axios for the flask knn handoff. docker images built and deployed via github actions over ssh, node `cluster` module spawning workers per cpu in production.

## What's next

close the admin/advisor parity gap (notes ui, faster student-detail workflows), wire up an actual test suite around the knn trigger and qualtrics confirmation paths, finish the university v2 backfill so all 20-odd institutional fields populate, and another round of model iteration once the next survey cohort closes.

---

## Resume pointers

Use whichever framing matches the role you're applying for. All numbers verified against the repo on 2026-05-26.

### Header line (one of these)

- **Backend Engineer — ACOSUS, Northeastern Illinois University** *(May 2024 – Present)*
- **Sole Backend Developer — ACOSUS Student-Risk Prediction Platform, NEIU Research** *(May 2024 – Present)*
- **Software Engineer (Research) — NEIU ACOSUS Project** *(May 2024 – Present)*

### Bullets (pick 4–6)

- Designed and shipped the production backend for a student-risk prediction platform at NEIU, sole engineer across 23 months and 157 commits (73.4k LOC TypeScript).
- Built and deployed a Node.js/Express/MongoDB API exposing 327 REST endpoints across two API versions, serving students, advisors, and admins from a single service.
- Integrated an external Flask KNN model service: implemented readiness-score calculation, training-data assembly, an N≥10 training trigger, and per-student prediction lookups.
- Designed a Qualtrics survey-completion tracking flow using per-student embedded codes and redirect-back confirmation, enabling real-time gift-card distribution for research participants.
- Consolidated configuration across four scattered files into a single settings registry with a v6 migration to backfill metadata in production, eliminating a class of silently-failing config bugs.
- Caught and fixed a backward-compatibility bug pre-deploy that would have fanned out advisor assignments across 50,000+ universities; reduced blast radius to the intended cohort.
- Containerized the service with Docker and shipped CI/CD via GitHub Actions, deploying multi-worker Node `cluster` builds to NEIU infrastructure over SSH.
- Implemented JWT auth with refresh-token rotation, bcrypt password hashing, Zod request validation, and Helmet/CORS hardening across all endpoints.
- Modeled 10 Mongoose collections covering users, surveys, predictions, messaging, notes, and multi-tenant universities, with a v6 migration chain for schema evolution.
- Stood up structured logging (Winston), product analytics (PostHog), transactional email (Resend + Nodemailer), and node-cron schedulers for background work.

### Skills line

`TypeScript · Node.js · Express · MongoDB · Mongoose · Zod · JWT · Docker · GitHub Actions · KNN (via Flask) · PostHog · Winston · REST API design · MongoDB schema migrations`

### Pitch (for cover letters / "tell me about a project")

> At NEIU I'm the sole engineer behind ACOSUS, a research backend that surveys students, predicts who's likely to disengage, and gives advisors a dashboard to act on it. Over 23 months I shipped 73k lines of TypeScript: 327 REST endpoints, a KNN training/prediction pipeline against a separate Flask model service, Qualtrics tracking with redirect-back confirmation, JWT auth, and a Dockerized multi-worker deploy on university infrastructure. It's live at acosus.neiu.edu and still shipping.

### What to emphasize per role

- **Backend / platform roles** — REST design, MongoDB schemas, JWT auth, the settings-registry refactor, the migration discipline.
- **ML/AI-adjacent roles** — the KNN pipeline (readiness score → training trigger → prediction handoff to Flask), Qualtrics tracking, prediction-accuracy admin views.
- **Full-stack / product roles** — the breadth (students + advisors + admins out of one app), advisor messaging and notes, university multi-tenant.
- **DevOps / SRE roles** — Docker, GitHub Actions, SSH deploys, Node cluster, structured logging + PostHog.
