import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import * as matchers from "vitest-axe/matchers";

// biome-ignore lint/suspicious/noExplicitAny: vitest-axe matchers shape varies between vitest majors
expect.extend(matchers as any);

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => vi.fn(),
	useSearch: () => ({}),
}));

import { PortfolioPage } from "./portfolio-page";

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

beforeEach(() => {
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
	(
		globalThis as unknown as { IntersectionObserver: typeof MockIO }
	).IntersectionObserver = MockIO;
	// Keep GithubGraph in its loading state so the axe run isn't gated on a
	// real /api/github-graph response.
	vi.stubGlobal(
		"fetch",
		vi.fn<typeof fetch>().mockReturnValue(new Promise(() => {})),
	);
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe("PortfolioPage a11y", () => {
	it("has no axe violations", async () => {
		const { container } = render(<PortfolioPage />);
		const results = await axe(container);
		// biome-ignore lint/suspicious/noExplicitAny: matcher added via expect.extend
		(expect(results) as any).toHaveNoViolations();
	});
});
