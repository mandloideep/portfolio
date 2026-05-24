import { createFileRoute } from "@tanstack/react-router";
import { getServerEnv } from "#/lib/env";

const TTL_MS = 60 * 60 * 1000;
const GITHUB_GRAPHQL_ENDPOINT = "https://api.github.com/graphql";

const QUERY = /* GraphQL */ `
	query ($login: String!) {
		user(login: $login) {
			contributionsCollection {
				contributionCalendar {
					totalContributions
					weeks {
						contributionDays {
							date
							contributionCount
							weekday
						}
					}
				}
			}
		}
	}
`;

export interface ContributionDay {
	date: string;
	count: number;
	weekday: number;
}

export interface ContributionWeek {
	days: ContributionDay[];
}

export interface GithubGraphResponse {
	totalContributions: number;
	weeks: ContributionWeek[];
	longestStreak: number;
	currentStreak: number;
}

let cache: { value: GithubGraphResponse; at: number } | null = null;

/** Test-only: clear the cached payload so the next call re-fetches. */
export function _resetGithubGraphCacheForTests(): void {
	cache = null;
}

export async function handleGithubGraphRequest(): Promise<Response> {
	if (cache && Date.now() - cache.at < TTL_MS) {
		return jsonResponse(cache.value, "HIT");
	}
	try {
		const value = await fetchGithubGraph();
		cache = { value, at: Date.now() };
		return jsonResponse(value, "MISS");
	} catch {
		return new Response(JSON.stringify({ error: "github_unavailable" }), {
			status: 502,
			headers: { "Content-Type": "application/json" },
		});
	}
}

export const Route = createFileRoute("/api/github-graph")({
	server: {
		handlers: {
			GET: () => handleGithubGraphRequest(),
		},
	},
});

function jsonResponse(value: GithubGraphResponse, cacheStatus: "HIT" | "MISS") {
	return new Response(JSON.stringify(value), {
		status: 200,
		headers: {
			"Content-Type": "application/json",
			"Cache-Control": "public, max-age=3600",
			"x-cache": cacheStatus,
		},
	});
}

async function fetchGithubGraph(): Promise<GithubGraphResponse> {
	const env = getServerEnv();
	const res = await fetch(GITHUB_GRAPHQL_ENDPOINT, {
		method: "POST",
		headers: {
			Authorization: `bearer ${env.GITHUB_TOKEN}`,
			"Content-Type": "application/json",
			"User-Agent": `portfolio-${env.GITHUB_USERNAME}`,
		},
		body: JSON.stringify({
			query: QUERY,
			variables: { login: env.GITHUB_USERNAME },
		}),
	});
	if (!res.ok) {
		throw new Error(`GitHub responded ${res.status}`);
	}
	const json = (await res.json()) as {
		data?: {
			user?: {
				contributionsCollection?: {
					contributionCalendar?: {
						totalContributions: number;
						weeks: Array<{
							contributionDays: Array<{
								date: string;
								contributionCount: number;
								weekday: number;
							}>;
						}>;
					};
				};
			};
		};
		errors?: unknown;
	};
	const calendar =
		json.data?.user?.contributionsCollection?.contributionCalendar;
	if (!calendar) {
		throw new Error("GitHub GraphQL response missing calendar");
	}
	const weeks: ContributionWeek[] = calendar.weeks.map((w) => ({
		days: w.contributionDays.map((d) => ({
			date: d.date,
			count: d.contributionCount,
			weekday: d.weekday,
		})),
	}));
	const { longest, current } = computeStreaks(weeks);
	return {
		totalContributions: calendar.totalContributions,
		weeks,
		longestStreak: longest,
		currentStreak: current,
	};
}

export function computeStreaks(weeks: ContributionWeek[]): {
	longest: number;
	current: number;
} {
	const days = weeks.flatMap((w) => w.days);
	let longest = 0;
	let run = 0;
	for (const d of days) {
		if (d.count > 0) {
			run += 1;
			if (run > longest) longest = run;
		} else {
			run = 0;
		}
	}
	const today = utcDateString(new Date());
	let current = 0;
	for (let i = days.length - 1; i >= 0; i -= 1) {
		const d = days[i];
		if (d.date > today) continue; // ignore future-dated calendar cells
		if (d.count > 0) {
			current += 1;
		} else {
			break;
		}
	}
	return { longest, current };
}

function utcDateString(d: Date): string {
	return d.toISOString().slice(0, 10);
}
