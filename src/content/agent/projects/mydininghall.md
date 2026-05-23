# mydininghall.com

A multi-tenant campus dining platform. One django app serves several
universities. Each school gets its own subdomain, its own scraper-set,
its own brand. Menus refresh on a celery and redis schedule with backoff
so a flaky upstream doesn't take down the whole pipeline.

## What's hard

Vendor variance. Every dining-services vendor exposes data differently.
Some have JSON APIs, some have weekly PDFs, some have HTML that changes
on the first of the month. An adapter per vendor plus a circuit breaker
has kept this tractable.

Quiet correctness. An empty menu is worse than no menu. The fallback
logic prefers "yesterday's menu, with a tiny stale badge" over a blank
page when the scraper is mid-retry.

Observability. Prometheus counters, loki logs, grafana dashboards. When
a scraper fails, the dashboard says which vendor, which run, and whether
the retry succeeded.

## Stack

Python, Django, React on the admin and student-facing sides, PostgreSQL,
Celery, Redis, Cloudflare, Nginx, AWS S3 for backups.

## What's next

Per-school nutrition filters and a mobile-first refactor of the student
view. Also a "what's good today" small-LLM call that doesn't lie about
the salad bar.
