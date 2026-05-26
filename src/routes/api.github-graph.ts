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
				totalPullRequestContributions
				totalIssueContributions
			}
			pullRequests(states: [MERGED], first: 1) {
				totalCount
			}
			repositories(
				first: 100
				ownerAffiliations: OWNER
				isFork: false
				orderBy: { field: STARGAZERS, direction: DESC }
			) {
				totalCount
				nodes {
					name
					url
					description
					stargazerCount
					pushedAt
					isArchived
					primaryLanguage {
						name
						color
					}
					languages(first: 5, orderBy: { field: SIZE, direction: DESC }) {
						edges {
							size
							node {
								name
								color
							}
						}
						totalSize
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

export interface LanguageShare {
	name: string;
	color: string | null;
	pct: number;
}

export interface TopRepo {
	name: string;
	url: string;
	description: string | null;
	stars: number;
	primaryLanguage: { name: string; color: string | null } | null;
	pushedAt: string;
}

export interface GithubGraphResponse {
	totalContributions: number;
	weeks: ContributionWeek[];
	longestStreak: number;
	currentStreak: number;
	last30: number;
	last7: number;
	activeDayPct: number;
	bestDay: { count: number; date: string };
	bestWeek: { count: number; weekStart: string };
	topWeekday: { name: string; index: number; mean: number };
	topLanguages: LanguageShare[];
	topRepos: TopRepo[];
	publicRepoCount: number;
	totalStars: number;
	prs: { opened: number; merged: number };
	issuesOpened: number;
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

type GqlRepo = {
	name: string;
	url: string;
	description: string | null;
	stargazerCount: number;
	pushedAt: string;
	isArchived: boolean;
	primaryLanguage: { name: string; color: string | null } | null;
	languages: {
		totalSize: number;
		edges: Array<{
			size: number;
			node: { name: string; color: string | null };
		}>;
	};
};

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
					totalPullRequestContributions?: number;
					totalIssueContributions?: number;
				};
				pullRequests?: { totalCount: number };
				repositories?: {
					totalCount: number;
					nodes: GqlRepo[];
				};
			};
		};
		errors?: unknown;
	};
	const user = json.data?.user;
	const calendar = user?.contributionsCollection?.contributionCalendar;
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
	const repos = user?.repositories?.nodes ?? [];

	return {
		totalContributions: calendar.totalContributions,
		weeks,
		longestStreak: longest,
		currentStreak: current,
		last30: sumLastNDays(weeks, 30),
		last7: sumLastNDays(weeks, 7),
		activeDayPct: computeActiveDayPct(weeks),
		bestDay: computeBestDay(weeks),
		bestWeek: computeBestWeek(weeks),
		topWeekday: computeTopWeekday(weeks),
		topLanguages: aggregateLanguages(repos),
		topRepos: pickTopRepos(repos),
		publicRepoCount: user?.repositories?.totalCount ?? 0,
		totalStars: repos.reduce((sum, r) => sum + r.stargazerCount, 0),
		prs: {
			opened: user?.contributionsCollection?.totalPullRequestContributions ?? 0,
			merged: user?.pullRequests?.totalCount ?? 0,
		},
		issuesOpened: user?.contributionsCollection?.totalIssueContributions ?? 0,
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
		if (d.date > today) continue;
		if (d.count > 0) {
			current += 1;
		} else {
			break;
		}
	}
	return { longest, current };
}

export function sumLastNDays(weeks: ContributionWeek[], n: number): number {
	const days = weeks.flatMap((w) => w.days);
	const today = utcDateString(new Date());
	const past = days.filter((d) => d.date <= today);
	return past.slice(-n).reduce((sum, d) => sum + d.count, 0);
}

export function computeActiveDayPct(weeks: ContributionWeek[]): number {
	const days = weeks.flatMap((w) => w.days);
	const today = utcDateString(new Date());
	const past = days.filter((d) => d.date <= today);
	if (past.length === 0) return 0;
	const active = past.filter((d) => d.count > 0).length;
	return Math.round((active / past.length) * 1000) / 10;
}

export function computeBestDay(weeks: ContributionWeek[]): {
	count: number;
	date: string;
} {
	let best: { count: number; date: string } = { count: 0, date: "" };
	for (const w of weeks) {
		for (const d of w.days) {
			if (d.count > best.count) best = { count: d.count, date: d.date };
		}
	}
	return best;
}

export function computeBestWeek(weeks: ContributionWeek[]): {
	count: number;
	weekStart: string;
} {
	const days = weeks.flatMap((w) => w.days);
	let best: { count: number; weekStart: string } = { count: 0, weekStart: "" };
	for (let i = 0; i + 7 <= days.length; i += 1) {
		const window = days.slice(i, i + 7);
		const sum = window.reduce((s, d) => s + d.count, 0);
		if (sum > best.count) {
			best = { count: sum, weekStart: window[0]?.date ?? "" };
		}
	}
	return best;
}

const WEEKDAY_NAMES = [
	"Sun",
	"Mon",
	"Tue",
	"Wed",
	"Thu",
	"Fri",
	"Sat",
] as const;

export function computeTopWeekday(weeks: ContributionWeek[]): {
	name: string;
	index: number;
	mean: number;
} {
	const totals = [0, 0, 0, 0, 0, 0, 0];
	const counts = [0, 0, 0, 0, 0, 0, 0];
	for (const w of weeks) {
		for (const d of w.days) {
			if (d.weekday < 0 || d.weekday > 6) continue;
			totals[d.weekday] = (totals[d.weekday] ?? 0) + d.count;
			counts[d.weekday] = (counts[d.weekday] ?? 0) + 1;
		}
	}
	let best = { index: 0, mean: 0 };
	for (let i = 0; i < 7; i += 1) {
		const c = counts[i] ?? 0;
		const t = totals[i] ?? 0;
		const mean = c > 0 ? t / c : 0;
		if (mean > best.mean) best = { index: i, mean };
	}
	return {
		index: best.index,
		name: WEEKDAY_NAMES[best.index] ?? "Sun",
		mean: Math.round(best.mean * 10) / 10,
	};
}

export function aggregateLanguages(repos: GqlRepo[]): LanguageShare[] {
	const byteTotals = new Map<string, { bytes: number; color: string | null }>();
	for (const repo of repos) {
		for (const edge of repo.languages.edges) {
			const entry = byteTotals.get(edge.node.name) ?? {
				bytes: 0,
				color: edge.node.color,
			};
			entry.bytes += edge.size;
			if (!entry.color && edge.node.color) entry.color = edge.node.color;
			byteTotals.set(edge.node.name, entry);
		}
	}
	const totalBytes = Array.from(byteTotals.values()).reduce(
		(sum, e) => sum + e.bytes,
		0,
	);
	if (totalBytes === 0) return [];
	return Array.from(byteTotals.entries())
		.map(([name, { bytes, color }]) => ({
			name,
			color,
			pct: Math.round((bytes / totalBytes) * 1000) / 10,
		}))
		.sort((a, b) => b.pct - a.pct)
		.slice(0, 5);
}

function pickTopRepos(repos: GqlRepo[]): TopRepo[] {
	return repos
		.filter((r) => !r.isArchived)
		.slice(0, 5)
		.map((r) => ({
			name: r.name,
			url: r.url,
			description: r.description,
			stars: r.stargazerCount,
			primaryLanguage: r.primaryLanguage,
			pushedAt: r.pushedAt,
		}));
}

function utcDateString(d: Date): string {
	return d.toISOString().slice(0, 10);
}
