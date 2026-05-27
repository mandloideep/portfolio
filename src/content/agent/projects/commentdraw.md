# CommentDraw

## Overview

CommentDraw picks giveaway winners from YouTube comments. A creator
pastes one or more video URLs, the backend pages through the YouTube
Data API, dedupes commenters by channel ID, optionally filters by
keyword, and runs a loyalty-weighted draw that favors people who
showed up across multiple videos. One click, one winner, no scrolling
through three thousand comments at 1am.

It's aimed at small-to-mid creators who run giveaways and don't want
to do the bookkeeping by hand. Three plans (free, gold, diamond) with
quotas enforced server-side before any external call goes out. Stripe
handles billing in test mode; the rest of the stack is
production-shaped.

## Challenges

The Stripe SDK was the loudest one. Between minor versions,
`Event.getObject()` started returning empty optionals for webhook
payloads because internal field names drifted. Deep switched the
webhook handler to `deserializeUnsafe()` against the raw JSON, which
sidesteps the type-mapping mismatch entirely. It's the documented
escape hatch but easy to miss. The failure mode is silent, just
signed events that quietly parse to nothing.

Rate limiting was the second one. A single-instance token bucket
falls apart the moment you horizontally scale, and a public
YouTube-API wrapper is exactly the kind of thing that gets hammered.
Deep wired Bucket4j to a Redis (DragonflyDB in prod) proxy manager so
the buckets live in shared state, keyed per email per endpoint, with
daily resets via date-based cache keys. Quota enforcement also runs
at the service layer *before* the upstream call, so a misbehaving
client can't burn the YouTube quota by hitting an alternate endpoint.

The third was free-tier infra fighting back. Aiven's free MySQL tier
auto-shuts-down on inactivity, which is fine until you wake up to a
cold backend at 3am. Fix: a scheduled `@Scheduled` job that pings the
db daily at 9 UTC. Ugly but it works, and the alternative was paying
for a tier Deep didn't need.

## Learnings

Spring's `ApplicationEventPublisher` carried more weight than
expected. Payment success, registration, password reset, account
deletion — all five became events with their own listeners, and the
controllers stopped knowing about email at all. The Brevo client only
exists in one place. Swapping to SES later would be a one-file
change.

On the frontend, RTK Query's `baseQueryWithReAuth` middleware turned
out to be the move. The rest of the app never sees a 401: the
middleware intercepts, hits the refresh endpoint, retries the
original request, and the components stay unaware. That pattern saved
a lot of error-handling boilerplate Deep had already written twice on
previous projects.

If he did it again he'd skip Aiven and just run MySQL on the same
VPS. The keep-alive cron, the TLS config, the network round-trip,
none of it was worth the savings. The rest of the architecture held
up.

## Stack

Java 25 on Spring Boot 3.5 for the backend, with Spring Data JPA,
Spring Security + JWT, Bucket4j for rate limiting, and the Stripe and
YouTube Java clients for the external calls. React 19 + Vite 7 on
the frontend, Redux Toolkit + RTK Query for state and api, Tailwind 4
for styling, Framer Motion + Lottie + canvas-confetti for the winner
reveal. MySQL 8.4 on Aiven, DragonflyDB for cache and rate-limit
state, Cloudinary for avatars, Brevo for transactional mail. GitHub
Actions builds an image to GHCR, Dokploy on a Hetzner 4GB VPS pulls
it, Traefik does the TLS. Cloudflare Pages serves the frontend.

## What's next

Instagram and TikTok comment ingestion are the obvious extensions:
same selection algorithm, different sources. Multi-creator team
accounts would unlock the higher tier. And at some point the
test-mode Stripe keys need to come out, but that's a launch decision,
not an engineering one.
