/**
 * Self-deprecating one-liners that round out the bottom of every page.
 * The footer + hero pull from the same array via `useQuip()` so the
 * page stays cohesive on each load.
 *
 * Add liberally. Aim for short, true, and amused-not-cynical.
 */

export const QUIPS = [
	"No bugs were harmed as of making this website.",
	"Compiled in 4.2 seconds. Written in 4.2 years.",
	"99.9% uptime. The 0.1% is me deploying.",
	"Built one git commit at a time.",
	"Cached the cache so the cache is fresh.",
	"Production is just staging with a higher heart rate.",
	"Wrote tests before they were cool. Just kidding — after.",
	"Type-safe, theme-safe, footgun-resistant.",
	"CSS is hard. So is everything else.",
	"Coffee level: dependency-injected.",
	"Powered by curiosity and `npm install`.",
	"Refactored this twice. Then once more.",
	"Shipped. Will refactor later. (Translation: never.)",
	"The DOM is a tree. The bugs grow on it.",
	"Reviewing PRs is just pair programming in slow motion.",
	"Wrote the README. Skipped the README.",
	"The cloud is just someone else's `localhost`.",
	"CI passed on the third try.",
	"We don't talk about node_modules.",
	"Deploy on Friday. (No.)",
	"There's an old GitHub issue describing exactly this bug.",
	"Logged out and back in. It worked.",
	"The error message lies. Mostly.",
	"Branched off main, forgot the way back.",
	"Production runs on hopes and metrics.",
	"Squashed 14 commits into one with a regret.",
	"Documented in the commit message, lost to history.",
	"Re-implemented this from scratch in a different file.",
	"Added a feature flag. Forgot to flip it.",
	"The TODO has been in the file longer than the project.",
	"Optimized for readability. Then performance. Then sanity.",
	"Mocked the database. The bug was in the mock.",
	"Stack Overflow does not have this answer.",
	"Wrote a comment. Future me will appreciate it. Maybe.",
	"Latency is a state of mind.",
	"The bug was in the assumption, not the code.",
	"Linting is just style guides with strong opinions.",
	"Solved by adding a `--force`.",
	"Migration ran. Wasn't supposed to.",
	"The cursor blinks because the prompt is patient.",
	"Closed 12 tabs. Opened 14.",
	"Cache invalidation. Naming things. Off-by-one.",
	"The `it works on my machine` certification.",
	"Optimistically pessimistic about distributed systems.",
	"Wrote this at 2am with `--verbose`.",
	"Container runs. Deploy fails. Mood: yes.",
	"Strongly typed, loosely caffeinated.",
	"The build is green. Ship it.",
	"`git blame` says it was me.",
	"Half the bugs are typos. The other half are design.",
] as const;

export type Quip = (typeof QUIPS)[number];

/**
 * Deterministic-ish quip pick based on a numeric seed. Used by the quip
 * store so the same call site picks a stable quip per load.
 */
export function pickQuip(seed: number): Quip {
	const i = Math.abs(Math.floor(seed)) % QUIPS.length;
	// Non-null because i is always in range.
	return QUIPS[i] as Quip;
}
