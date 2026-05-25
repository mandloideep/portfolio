import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { experience } from "#/content/site";

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

function mockMatchMedia() {
	Object.defineProperty(window, "matchMedia", {
		writable: true,
		configurable: true,
		value: vi.fn().mockImplementation((query: string) => ({
			matches: false,
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
	mockMatchMedia();
	(
		globalThis as unknown as { IntersectionObserver: typeof MockIO }
	).IntersectionObserver = MockIO;
});

import { ExperienceTimeline } from "./experience-timeline";

describe("ExperienceTimeline", () => {
	it("renders one card per entry in experience[]", () => {
		const { getAllByTestId } = render(<ExperienceTimeline />);
		const cards = getAllByTestId(/^experience-card-/);
		expect(cards).toHaveLength(experience.length);
	});

	it("renders entries in document order matching experience[]", () => {
		const { getAllByRole } = render(<ExperienceTimeline />);
		const headings = getAllByRole("heading", { level: 3 });
		headings.forEach((h, i) => {
			expect(h.textContent).toBe(experience[i].company);
		});
	});

	it("wraps the entries in an <ol>", () => {
		const { getByTestId } = render(<ExperienceTimeline />);
		expect(getByTestId("experience-timeline").tagName).toBe("OL");
	});
});
