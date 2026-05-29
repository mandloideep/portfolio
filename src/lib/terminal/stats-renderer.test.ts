import { describe, expect, it } from "vitest";
import type { GithubGraphResponse } from "#/routes/api.github-graph";
import { renderStatsTable } from "./stats-renderer";

function makeStats(): GithubGraphResponse {
	return {
		totalContributions: 1234,
		weeks: [],
		longestStreak: 21,
		currentStreak: 7,
		last30: 90,
		last7: 12,
		activeDayPct: 62.3,
		bestDay: { count: 18, date: "2026-04-12" },
		bestWeek: { count: 52, weekStart: "2026-04-06" },
		topWeekday: { name: "Tue", index: 2, mean: 3.4 },
		topLanguages: [
			{ name: "TypeScript", color: "#3178c6", pct: 51.2 },
			{ name: "Python", color: null, pct: 22.7 },
			{ name: "Go", color: "#00ADD8", pct: 14.1 },
		],
		topRepos: [
			{
				name: "mydininghall",
				url: "https://github.com/deep/mydininghall",
				description: null,
				stars: 12,
				primaryLanguage: { name: "TypeScript", color: "#3178c6" },
				pushedAt: "2026-05-01T00:00:00Z",
			},
		],
		publicRepoCount: 8,
		totalStars: 42,
		prs: { opened: 14, merged: 9 },
		issuesOpened: 4,
	};
}

describe("renderStatsTable", () => {
	it("wraps the table in a fenced code block", () => {
		const out = renderStatsTable(makeStats());
		expect(out.startsWith("```\n")).toBe(true);
		expect(out.endsWith("\n```")).toBe(true);
	});

	it("includes the headline numbers in the body", () => {
		const out = renderStatsTable(makeStats());
		expect(out).toContain("1.2K"); // total contributions (compacted)
		expect(out).toContain("90"); // last 30 days
		expect(out).toContain("62.3%"); // active days
		expect(out).toContain("21 days"); // longest streak
		expect(out).toContain("7 days"); // current streak
	});

	it("renders the languages section with a percentage bar and figure", () => {
		const out = renderStatsTable(makeStats());
		expect(out).toContain("LANGUAGES");
		expect(out).toContain("TypeScript");
		expect(out).toContain("51.2%");
	});

	it("renders the top repos section", () => {
		const out = renderStatsTable(makeStats());
		expect(out).toContain("TOP REPOS");
		expect(out).toContain("mydininghall");
		expect(out).toContain("★ 12");
	});

	it("omits language section when there are no languages", () => {
		const data = makeStats();
		data.topLanguages = [];
		const out = renderStatsTable(data);
		expect(out).not.toContain("LANGUAGES");
	});
});
