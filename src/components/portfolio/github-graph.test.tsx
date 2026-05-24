import { render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
	ContributionWeek,
	GithubGraphResponse,
} from "#/routes/api.github-graph";

class MockIO {
	observe() {}
	unobserve() {}
	disconnect() {}
	takeRecords() {
		return [];
	}
	root = null;
	rootMargin = "";
	thresholds = [];
}

function mockMatchMedia(reduced: boolean) {
	Object.defineProperty(window, "matchMedia", {
		writable: true,
		configurable: true,
		value: vi.fn().mockImplementation((query: string) => ({
			matches: reduced && query.includes("reduced"),
			media: query,
			onchange: null,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			addListener: vi.fn(),
			removeListener: vi.fn(),
			dispatchEvent: vi.fn(),
		})),
	});
}

beforeEach(() => {
	mockMatchMedia(false);
	(
		globalThis as unknown as { IntersectionObserver: typeof MockIO }
	).IntersectionObserver = MockIO;
});

afterEach(() => {
	vi.restoreAllMocks();
});

import { GithubGraph, intensityClass } from "./github-graph";

function buildResponse(): GithubGraphResponse {
	const weeks: ContributionWeek[] = [];
	for (let w = 0; w < 53; w += 1) {
		const days = [] as ContributionWeek["days"];
		for (let d = 0; d < 7; d += 1) {
			const dayIndex = w * 7 + d;
			const date = new Date(Date.UTC(2025, 4, 1 + dayIndex));
			days.push({
				date: date.toISOString().slice(0, 10),
				count: (w + d) % 5, // ensures every intensity step appears
				weekday: d,
			});
		}
		weeks.push({ days });
	}
	return {
		totalContributions: 321,
		weeks,
		longestStreak: 7,
		currentStreak: 3,
	};
}

function stubFetch(response: Response) {
	const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(response);
	vi.stubGlobal("fetch", fetchMock);
	return fetchMock;
}

function jsonResponse(body: unknown, init?: ResponseInit): Response {
	return new Response(JSON.stringify(body), {
		status: 200,
		headers: { "Content-Type": "application/json" },
		...init,
	});
}

describe("GithubGraph", () => {
	it("renders the skeleton while the request is in flight", () => {
		stubFetch(new Response(JSON.stringify(buildResponse())));
		const { getByTestId } = render(<GithubGraph />);
		expect(getByTestId("github-graph").dataset.state).toBe("loading");
		expect(getByTestId("heatmap-skeleton")).toBeInTheDocument();
	});

	it("renders 53×7 cells on success", async () => {
		stubFetch(jsonResponse(buildResponse()));
		const { getAllByRole, getByTestId } = render(<GithubGraph />);
		await waitFor(() =>
			expect(getByTestId("github-graph").dataset.state).toBe("ready"),
		);
		const cells = getAllByRole("button");
		expect(cells.length).toBe(53 * 7);
	});

	it("gives each cell an aria-label with count + date", async () => {
		stubFetch(jsonResponse(buildResponse()));
		const { getAllByRole, getByTestId } = render(<GithubGraph />);
		await waitFor(() =>
			expect(getByTestId("github-graph").dataset.state).toBe("ready"),
		);
		const cells = getAllByRole("button");
		expect(cells[0].getAttribute("aria-label")).toMatch(/contribution/);
		expect(cells[0].getAttribute("aria-label")).toMatch(
			/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/,
		);
	});

	it("renders the stat trio labels", async () => {
		stubFetch(jsonResponse(buildResponse()));
		const { getByText, getByTestId } = render(<GithubGraph />);
		await waitFor(() =>
			expect(getByTestId("github-graph").dataset.state).toBe("ready"),
		);
		expect(getByText(/total contributions/i)).toBeInTheDocument();
		expect(getByText(/longest streak/i)).toBeInTheDocument();
		expect(getByText(/current streak/i)).toBeInTheDocument();
	});

	it("renders the error message and no skeleton on fetch failure", async () => {
		stubFetch(new Response("nope", { status: 500 }));
		const { getByText, queryByTestId, getByTestId } = render(<GithubGraph />);
		await waitFor(() =>
			expect(getByTestId("github-graph").dataset.state).toBe("error"),
		);
		expect(getByText(/GitHub data unavailable/i)).toBeInTheDocument();
		expect(queryByTestId("heatmap-skeleton")).toBeNull();
	});

	it("cycles intensity classes across the dataset", async () => {
		stubFetch(jsonResponse(buildResponse()));
		const { getAllByRole, getByTestId } = render(<GithubGraph />);
		await waitFor(() =>
			expect(getByTestId("github-graph").dataset.state).toBe("ready"),
		);
		const classes = new Set<string>();
		for (const cell of getAllByRole("button")) {
			for (const cls of cell.className.split(/\s+/)) {
				if (cls.startsWith("hm-")) classes.add(cls);
			}
		}
		expect(classes).toEqual(new Set(["hm-0", "hm-1", "hm-2", "hm-3", "hm-4"]));
	});
});

describe("intensityClass", () => {
	it("returns hm-0 when count is zero", () => {
		expect(intensityClass(0, 10)).toBe("hm-0");
	});
	it("returns hm-0 when max is zero (guards divide-by-zero)", () => {
		expect(intensityClass(3, 0)).toBe("hm-0");
	});
	it("buckets non-zero counts into hm-1..hm-4", () => {
		expect(intensityClass(1, 100)).toBe("hm-1");
		expect(intensityClass(26, 100)).toBe("hm-2");
		expect(intensityClass(60, 100)).toBe("hm-3");
		expect(intensityClass(100, 100)).toBe("hm-4");
	});
	it("clamps counts above max to hm-4", () => {
		expect(intensityClass(999, 100)).toBe("hm-4");
	});
});
