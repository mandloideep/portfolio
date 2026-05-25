import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { siteMeta } from "#/content/site";

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

// Import after the mocks so the module sees the patched globals.
import { Hero } from "./hero";

function fireInView(isIntersecting: boolean) {
	lastIOCallback?.([{ isIntersecting }]);
}

describe("Hero", () => {
	it("renders the name and role from siteMeta", () => {
		const { getByText } = render(<Hero />);
		expect(getByText(siteMeta.name)).toBeInTheDocument();
		expect(getByText(siteMeta.role)).toBeInTheDocument();
	});

	it("renders both CTAs with the expected hrefs", () => {
		const { getByTestId } = render(<Hero />);
		const projects = getByTestId("hero-cta-projects");
		const terminal = getByTestId("hero-cta-terminal");
		expect(projects.getAttribute("href")).toBe("#projects");
		expect(terminal.getAttribute("href")).toBe("/terminal");
	});

	it("renders the status pill copy from siteMeta", () => {
		const { getByTestId } = render(<Hero />);
		expect(getByTestId("status-pill").textContent).toContain(siteMeta.status);
	});

	it("activates shimmer only when the name is in view", () => {
		const { getByTestId } = render(<Hero />);
		expect(getByTestId("hero-name").dataset.shimmer).toBe("false");
		act(() => fireInView(true));
		expect(getByTestId("hero-name").dataset.shimmer).toBe("true");
		act(() => fireInView(false));
		expect(getByTestId("hero-name").dataset.shimmer).toBe("false");
	});

	it("never shimmers when prefers-reduced-motion is set", () => {
		mockMatchMedia(true);
		const { getByTestId } = render(<Hero />);
		act(() => fireInView(true));
		expect(getByTestId("hero-name").dataset.shimmer).toBe("false");
	});

	it("CTAs are magnetic under normal motion", () => {
		const { getByTestId } = render(<Hero />);
		expect(
			(getByTestId("hero-cta-projects") as HTMLAnchorElement).dataset.magnetic,
		).toBe("on");
		expect(
			(getByTestId("hero-cta-terminal") as HTMLAnchorElement).dataset.magnetic,
		).toBe("on");
	});

	it("CTAs are non-magnetic under reduced motion", () => {
		mockMatchMedia(true);
		const { getByTestId } = render(<Hero />);
		expect(
			(getByTestId("hero-cta-projects") as HTMLAnchorElement).dataset.magnetic,
		).toBe("off");
		expect(
			(getByTestId("hero-cta-terminal") as HTMLAnchorElement).dataset.magnetic,
		).toBe("off");
	});
});
