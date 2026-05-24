import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const navigateMock = vi.fn();
vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => navigateMock,
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

const EXPECTED_IDS = [
	"hero",
	"projects",
	"experience",
	"skills",
	"github",
	"contact",
];

describe("PortfolioPage", () => {
	it("renders all section scaffolds with the expected ids", () => {
		const { container } = render(<PortfolioPage />);
		for (const id of EXPECTED_IDS) {
			expect(container.querySelector(`#${id}`)).not.toBeNull();
		}
	});

	it("renders the animated background and dock nav", () => {
		const { getByTestId } = render(<PortfolioPage />);
		expect(getByTestId("animated-background")).toBeInTheDocument();
		expect(getByTestId("dock-nav")).toBeInTheDocument();
	});

	it("renders one dock item per section", () => {
		const { getByTestId } = render(<PortfolioPage />);
		for (const id of EXPECTED_IDS) {
			expect(getByTestId(`dock-item-${id}`)).toBeInTheDocument();
		}
	});

	it("marks the root with data-page=portfolio for page-scoped styling", () => {
		const { container } = render(<PortfolioPage />);
		expect(container.querySelector('[data-page="portfolio"]')).not.toBeNull();
	});

	it("includes a skip-link to #hero", () => {
		const { container } = render(<PortfolioPage />);
		const link = container.querySelector('a[href="#hero"]');
		expect(link).not.toBeNull();
		expect(link?.textContent).toMatch(/skip/i);
	});
});
