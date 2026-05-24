import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Experience } from "#/content/site";

type IOCallback = (entries: Array<Partial<IntersectionObserverEntry>>) => void;

let lastIOCallback: IOCallback | null = null;

class MockIO {
	cb: IOCallback;
	target: Element | null = null;
	constructor(cb: IOCallback) {
		this.cb = cb;
		lastIOCallback = cb;
	}
	observe(el: Element) {
		this.target = el;
	}
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
	lastIOCallback = null;
	mockMatchMedia(false);
	(
		globalThis as unknown as { IntersectionObserver: typeof MockIO }
	).IntersectionObserver = MockIO;
});

afterEach(() => {
	vi.useRealTimers();
});

import { ExperienceCard } from "./experience-card";

function fireInView(isIntersecting: boolean) {
	lastIOCallback?.([{ isIntersecting }]);
}

const sample: Experience = {
	company: "Test Co",
	role: "Test Role",
	start: "2024-08",
	end: "present",
	bullets: ["bullet one", "bullet two"],
	tags: ["TypeScript", "React"],
};

describe("ExperienceCard", () => {
	it("renders role, company, and every bullet", () => {
		const { getByText } = render(<ExperienceCard entry={sample} index={0} />);
		expect(getByText("Test Role")).toBeInTheDocument();
		expect(getByText("Test Co")).toBeInTheDocument();
		expect(getByText("bullet one")).toBeInTheDocument();
		expect(getByText("bullet two")).toBeInTheDocument();
	});

	it("formats an open-ended range as 'Aug 2024 – Present'", () => {
		const { getByTestId } = render(<ExperienceCard entry={sample} index={0} />);
		expect(getByTestId("experience-dates-0").textContent).toBe(
			"Aug 2024 – Present",
		);
	});

	it("formats a closed range with month + year on both ends", () => {
		const { getByTestId } = render(
			<ExperienceCard
				entry={{ ...sample, start: "2023-06", end: "2023-12" }}
				index={0}
			/>,
		);
		expect(getByTestId("experience-dates-0").textContent).toBe(
			"Jun 2023 – Dec 2023",
		);
	});

	it("renders one Badge per tag", () => {
		const { getByText } = render(<ExperienceCard entry={sample} index={0} />);
		expect(getByText("TypeScript")).toBeInTheDocument();
		expect(getByText("React")).toBeInTheDocument();
	});

	it("activates the dot when it scrolls into view", () => {
		const { getByTestId } = render(<ExperienceCard entry={sample} index={0} />);
		const dot = getByTestId("experience-dot-0");
		expect(dot.dataset.inView).toBe("false");
		act(() => fireInView(true));
		expect(dot.dataset.inView).toBe("true");
	});

	it("flags the dot as reduced when prefers-reduced-motion is set", () => {
		mockMatchMedia(true);
		const { getByTestId } = render(<ExperienceCard entry={sample} index={0} />);
		expect(getByTestId("experience-dot-0").dataset.reduced).toBe("true");
	});
});
