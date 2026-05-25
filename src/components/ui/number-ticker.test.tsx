import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NumberTicker } from "./number-ticker";

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

afterEach(() => {
	vi.restoreAllMocks();
});

describe("NumberTicker reduced-motion guard", () => {
	beforeEach(() => {
		mockMatchMedia(true);
		(
			globalThis as unknown as { IntersectionObserver: typeof MockIO }
		).IntersectionObserver = MockIO;
	});

	it("renders the final value immediately under reduced motion", () => {
		const { container } = render(
			<NumberTicker value={1234} data-testid="ticker" />,
		);
		const span = container.querySelector("span");
		expect(span?.textContent).toBe("1,234");
		expect(span?.getAttribute("data-reduced")).toBe("true");
	});

	it("under normal motion, exposes data-reduced=false", () => {
		mockMatchMedia(false);
		const { container } = render(<NumberTicker value={42} />);
		const span = container.querySelector("span");
		expect(span?.getAttribute("data-reduced")).toBe("false");
	});
});
