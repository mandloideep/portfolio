import { describe, expect, it } from "vitest";
import {
	aggregateLanguages,
	computeActiveDayPct,
	computeBestDay,
	computeBestWeek,
	computeTopWeekday,
	type ContributionWeek,
	sumLastNDays,
} from "./api.github-graph";

function week(start: string, counts: number[]): ContributionWeek {
	const days = counts.map((count, i) => {
		const d = new Date(`${start}T00:00:00Z`);
		d.setUTCDate(d.getUTCDate() + i);
		return {
			date: d.toISOString().slice(0, 10),
			count,
			weekday: i,
		};
	});
	return { days };
}

describe("github-graph derived fields", () => {
	it("sumLastNDays sums only the past N days through today", () => {
		const today = new Date().toISOString().slice(0, 10);
		const weeks: ContributionWeek[] = [
			{
				days: [
					{ date: today, count: 5, weekday: 0 },
					{ date: future(1), count: 100, weekday: 1 }, // future, ignored
				],
			},
		];
		expect(sumLastNDays(weeks, 7)).toBe(5);
	});

	it("computeActiveDayPct rounds to one decimal", () => {
		const today = new Date().toISOString().slice(0, 10);
		const weeks: ContributionWeek[] = [
			{
				days: [
					{ date: shifted(-3), count: 1, weekday: 0 },
					{ date: shifted(-2), count: 0, weekday: 1 },
					{ date: shifted(-1), count: 2, weekday: 2 },
					{ date: today, count: 0, weekday: 3 },
				],
			},
		];
		// 2 of 4 = 50.0%
		expect(computeActiveDayPct(weeks)).toBe(50);
	});

	it("computeBestDay returns the max count + date", () => {
		const weeks = [
			week("2025-05-04", [1, 5, 2, 9, 3, 1, 0]),
			week("2025-05-11", [4, 2, 0, 0, 8, 1, 1]),
		];
		const best = computeBestDay(weeks);
		expect(best.count).toBe(9);
		expect(best.date).toBe("2025-05-07");
	});

	it("computeBestWeek finds the peak rolling 7-day window", () => {
		const days = [1, 1, 1, 1, 1, 1, 1, 10, 0, 0, 0, 0, 0, 0]; // sum w0=7, w1=16
		const weeks = [
			week("2025-05-04", days.slice(0, 7)),
			week("2025-05-11", days.slice(7, 14)),
		];
		const best = computeBestWeek(weeks);
		expect(best.count).toBe(16);
	});

	it("computeTopWeekday picks the highest-mean weekday", () => {
		const weeks = [
			week("2025-05-04", [0, 10, 0, 0, 0, 0, 0]),
			week("2025-05-11", [0, 8, 0, 0, 0, 0, 0]),
		];
		expect(computeTopWeekday(weeks).index).toBe(1);
		expect(computeTopWeekday(weeks).name).toBe("Mon");
	});

	it("aggregateLanguages computes byte-weighted percentages", () => {
		const repos = [
			{
				name: "a",
				url: "",
				description: null,
				stargazerCount: 0,
				pushedAt: "",
				isArchived: false,
				primaryLanguage: null,
				languages: {
					totalSize: 100,
					edges: [
						{ size: 60, node: { name: "TypeScript", color: "#3178c6" } },
						{ size: 40, node: { name: "Python", color: null } },
					],
				},
			},
		];
		const out = aggregateLanguages(repos);
		expect(out[0]?.name).toBe("TypeScript");
		expect(out[0]?.pct).toBe(60);
		expect(out[1]?.name).toBe("Python");
		expect(out[1]?.pct).toBe(40);
	});
});

function shifted(deltaDays: number): string {
	const d = new Date();
	d.setUTCDate(d.getUTCDate() + deltaDays);
	return d.toISOString().slice(0, 10);
}

function future(deltaDays: number): string {
	return shifted(deltaDays);
}
