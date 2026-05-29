import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { projects, siteMeta } from "#/content/site";

const navigateMock = vi.fn();
vi.mock("@tanstack/react-router", async () => {
	const actual = await vi.importActual<typeof import("@tanstack/react-router")>(
		"@tanstack/react-router",
	);
	return {
		...actual,
		useNavigate: () => navigateMock,
		useSearch: () => ({}),
		useRouterState: () => "/",
		Link: ({
			children,
			to,
			...rest
		}: React.PropsWithChildren<{ to?: string } & Record<string, unknown>>) => (
			<a href={to as string} {...(rest as Record<string, string>)}>
				{children}
			</a>
		),
	};
});

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
	vi.stubGlobal(
		"fetch",
		vi.fn<typeof fetch>().mockReturnValue(new Promise(() => {})),
	);
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe("PortfolioPage (whoami)", () => {
	it("renders the hero profile card", () => {
		const { getByTestId } = render(<PortfolioPage />);
		expect(getByTestId("hero")).toBeInTheDocument();
		expect(getByTestId("hero-name").textContent).toContain(siteMeta.name);
	});

	it("marks the root with data-page=portfolio for page-scoped styling", () => {
		const { container } = render(<PortfolioPage />);
		expect(container.querySelector('[data-page="portfolio"]')).not.toBeNull();
	});

	it("renders the top-tab nav", () => {
		const { getByTestId } = render(<PortfolioPage />);
		expect(getByTestId("top-tabs")).toBeInTheDocument();
	});

	it("renders a top-tab for each enabled portfolio section", () => {
		const { getByTestId, queryByTestId } = render(<PortfolioPage />);
		// hero / projects / experience / github / contact are enabled by default;
		// research is hidden via the section registry in site.ts. Assert both.
		for (const id of ["hero", "projects", "experience", "contact"]) {
			expect(getByTestId(`top-tab-${id}`)).toBeInTheDocument();
		}
		expect(queryByTestId("top-tab-research")).toBeNull();
	});

	it("renders a stat block for every featured project that ships stats", () => {
		const { getByTestId } = render(<PortfolioPage />);
		const featured = projects.filter((p) => p.featured && p.stats);
		for (const p of featured) {
			expect(getByTestId(`whoami-stat-${p.slug}`)).toBeInTheDocument();
		}
	});

	it("renders the GitHub graph block at the bottom", () => {
		const { getByTestId } = render(<PortfolioPage />);
		expect(getByTestId("github-graph")).toBeInTheDocument();
	});

	it("renders the footer", () => {
		const { getByTestId } = render(<PortfolioPage />);
		expect(getByTestId("portfolio-footer")).toBeInTheDocument();
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
});
