# campus dining scraper

The open-source kernel that grew into mydininghall. Single repo, python,
async, plugin-style adapters per university. Archived now; the
production codebase forked from this years ago.

## Shape

One `Adapter` interface: `fetch_menus(date)` returns a typed dict.
Per-school subclasses live in `adapters/<school>.py`. A small runtime
handles retry, backoff, and a per-school circuit breaker. Output is
JSONL on disk, replayable through a `replay` subcommand.

## Why archived

The hard-won lessons moved into mydininghall. Vendor variance, fallback
logic, "stale beats blank." This repo stays public because the adapter
pattern is reusable if anyone wants to scrape something similar.

## Stack

Python (3.10+), asyncio, httpx, structlog.
