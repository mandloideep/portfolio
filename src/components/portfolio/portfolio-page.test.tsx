import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
	// GithubGraph fires fetch on mount; keep it in the loading state so we
	// don't depend on the real /api/github-graph endpoint in page-level tests.
	vi.stubGlobal(
		"fetch",
		vi.fn<typeof fetch>().mockReturnValue(new Promise(() => {})),
	);
});

afterEach(() => {
	vi.restoreAllMocks();
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

	it("renders exactly one <main id='main'> landmark", () => {
		const { container } = render(<PortfolioPage />);
		const mains = container.querySelectorAll("main");
		expect(mains.length).toBe(1);
		expect(mains[0]?.id).toBe("main");
	});

	it("renders an sr-only <h1> with name + role", () => {
		const { container } = render(<PortfolioPage />);
		const h1 = container.querySelector("h1");
		expect(h1).not.toBeNull();
		expect(h1?.className).toMatch(/sr-only/);
		expect(h1?.textContent).toMatch(/deep/i);
	});

	it("renders SkillsGrid and ResearchList in the skills section", () => {
		const { getByTestId } = render(<PortfolioPage />);
		expect(getByTestId("skills-grid")).toBeInTheDocument();
		expect(getByTestId("research-list")).toBeInTheDocument();
	});

	it("renders GithubGraph in the github section", () => {
		const { getByTestId } = render(<PortfolioPage />);
		expect(getByTestId("github-graph")).toBeInTheDocument();
	});

	it("renders the contact card and footer", () => {
		const { getByTestId } = render(<PortfolioPage />);
		expect(getByTestId("contact-card")).toBeInTheDocument();
		expect(getByTestId("portfolio-footer")).toBeInTheDocument();
	});

	it("places the footer after main in document order", () => {
		const { container, getByTestId } = render(<PortfolioPage />);
		const main = container.querySelector("main");
		const footer = getByTestId("portfolio-footer");
		if (!main) throw new Error("expected <main> in the document");
		expect(
			main.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING,
		).toBeTruthy();
	});
});
