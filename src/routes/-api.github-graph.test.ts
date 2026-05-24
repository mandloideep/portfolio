import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// getServerEnv() refuses to run when `typeof window !== "undefined"` — which
// is always true under jsdom. Mock the module so the route can call it freely.
vi.mock("#/lib/env", () => ({
	getServerEnv: () => ({
		OPENROUTER_API_KEY: "test-or",
		OPENROUTER_DEFAULT_MODEL: "test-model",
		GITHUB_TOKEN: "test-token",
		GITHUB_USERNAME: "deep",
	}),
	_resetEnvCacheForTests: () => {},
}));

import {
	_resetGithubGraphCacheForTests,
	type ContributionWeek,
	computeStreaks,
	handleGithubGraphRequest,
} from "./api.github-graph";

const VALID_GH_PAYLOAD = {
	data: {
		user: {
			contributionsCollection: {
				contributionCalendar: {
					totalContributions: 12,
					weeks: [
						{
							contributionDays: [
								{ date: "2026-05-18", contributionCount: 3, weekday: 1 },
								{ date: "2026-05-19", contributionCount: 0, weekday: 2 },
							],
						},
					],
				},
			},
		},
	},
};

function ghOkFetchMock(body: unknown) {
	return vi.fn<typeof fetch>().mockImplementation(
		async () =>
			new Response(JSON.stringify(body), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			}),
	);
}

beforeEach(() => {
	_resetGithubGraphCacheForTests();
});

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

describe("handleGithubGraphRequest — caching", () => {
	it("MISS on first call, HIT on second within TTL", async () => {
		const fetchMock = ghOkFetchMock(VALID_GH_PAYLOAD);
		vi.stubGlobal("fetch", fetchMock);

		const first = await handleGithubGraphRequest();
		expect(first.headers.get("x-cache")).toBe("MISS");
		expect(first.headers.get("Cache-Control")).toBe("public, max-age=3600");

		const second = await handleGithubGraphRequest();
		expect(second.headers.get("x-cache")).toBe("HIT");
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("bypasses the cache once the TTL expires", async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-05-24T00:00:00Z"));
		const fetchMock = ghOkFetchMock(VALID_GH_PAYLOAD);
		vi.stubGlobal("fetch", fetchMock);

		await handleGithubGraphRequest();
		vi.advanceTimersByTime(60 * 60 * 1000 + 1);
		const refetched = await handleGithubGraphRequest();

		expect(refetched.headers.get("x-cache")).toBe("MISS");
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it("returns 502 on GitHub error and does not cache the failure", async () => {
		const fetchMock = vi
			.fn<typeof fetch>()
			.mockImplementation(async () => new Response("nope", { status: 500 }));
		vi.stubGlobal("fetch", fetchMock);

		const first = await handleGithubGraphRequest();
		expect(first.status).toBe(502);
		const second = await handleGithubGraphRequest();
		expect(second.status).toBe(502);
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it("response body parses to the documented shape", async () => {
		const fetchMock = ghOkFetchMock(VALID_GH_PAYLOAD);
		vi.stubGlobal("fetch", fetchMock);

		const res = await handleGithubGraphRequest();
		const body = (await res.json()) as unknown;
		expect(body).toMatchObject({
			totalContributions: expect.any(Number),
			weeks: expect.any(Array),
			longestStreak: expect.any(Number),
			currentStreak: expect.any(Number),
		});
		const typed = body as {
			weeks: Array<{
				days: Array<{ date: string; count: number; weekday: number }>;
			}>;
		};
		expect(typed.weeks[0].days[0]).toEqual({
			date: "2026-05-18",
			count: 3,
			weekday: 1,
		});
	});
});

describe("computeStreaks", () => {
	function makeWeeks(counts: number[], startDate: string): ContributionWeek[] {
		const days = counts.map((count, i) => {
			const d = new Date(startDate);
			d.setUTCDate(d.getUTCDate() + i);
			return {
				date: d.toISOString().slice(0, 10),
				count,
				weekday: d.getUTCDay(),
			};
		});
		const weeks: ContributionWeek[] = [];
		for (let i = 0; i < days.length; i += 7) {
			weeks.push({ days: days.slice(i, i + 7) });
		}
		return weeks;
	}

	it("finds the longest streak across week boundaries", () => {
		// 14 days: 0,1,1,1,1,1,1,1,1,1,0,0,0,0 — 9-day run spanning two weeks.
		const counts = [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0];
		const weeks = makeWeeks(counts, "2026-04-01");
		expect(computeStreaks(weeks).longest).toBe(9);
	});

	it("computes the current streak ending today", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-05-24T12:00:00Z"));
		// last 5 days non-zero, ending on 2026-05-24
		const counts = [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1];
		const weeks = makeWeeks(counts, "2026-05-13");
		expect(computeStreaks(weeks).current).toBe(5);
	});

	it("ignores future-dated calendar cells for the current streak", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-05-24T12:00:00Z"));
		// Today + 3 future days, all zero; the prior 4 days are non-zero.
		const counts = [1, 1, 1, 1, 0, 0, 0];
		const weeks = makeWeeks(counts, "2026-05-21");
		// Today is 2026-05-24 → counts[3] (1). Run backwards: 1,1,1,1 = 4.
		expect(computeStreaks(weeks).current).toBe(4);
	});

	it("returns zero current streak when today has no contributions", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-05-24T12:00:00Z"));
		const counts = [1, 1, 1, 0]; // today (the 4th day) is zero
		const weeks = makeWeeks(counts, "2026-05-21");
		expect(computeStreaks(weeks).current).toBe(0);
	});
});
