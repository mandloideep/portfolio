# FindingFive

A behavioral-research SaaS. Researchers build studies (think: surveys
with timing, conditional branches, randomization), publish them to
participants, collect data. Deep worked on the study-builder side as a
research software intern from June to December 2023.

## What he shipped

React features in the builder for nested branching logic. Postgres query
work where an N+1 on the builder index page was the worst offender;
fixing it took the slow load from about 6 seconds to about 2. Event
instrumentation across the monolith so the product team had reliable
"study published" and "study aborted" signals.

## What he learned

How to be useful on a small team where the codebase predates you. How to
read a postgres query plan without panicking. The pleasure of a CI that
takes under 90 seconds.

## Stack

React, Django, PostgreSQL, TypeScript. Local dev ran against a docker
postgres; staging mirrored prod.
