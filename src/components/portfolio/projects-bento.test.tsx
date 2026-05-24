import { fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { projects } from "#/content/site";

const navigateMock = vi.fn();
let currentSearch: { project?: string; choose?: number } = {};

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => navigateMock,
	useSearch: () => currentSearch,
}));

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
	navigateMock.mockReset();
	currentSearch = {};
	mockMatchMedia(false);
	(
		globalThis as unknown as { IntersectionObserver: typeof MockIO }
	).IntersectionObserver = MockIO;
});

afterEach(() => {
	currentSearch = {};
});

import { ProjectsBento } from "./projects-bento";

describe("ProjectsBento", () => {
	it("renders one card per project from site.ts", () => {
		const { getByTestId } = render(<ProjectsBento />);
		for (const p of projects) {
			expect(getByTestId(`project-card-${p.slug}`)).toBeInTheDocument();
		}
	});

	it("renders the first featured project as the hero (size=hero)", () => {
		const { getByTestId } = render(<ProjectsBento />);
		const firstFeatured = projects.find((p) => p.featured);
		if (!firstFeatured)
			throw new Error("expected at least one featured project");
		const card = getByTestId(`project-card-${firstFeatured.slug}`);
		expect(card.dataset.size).toBe("hero");
		for (const other of projects) {
			if (other.slug === firstFeatured.slug) continue;
			const el = getByTestId(`project-card-${other.slug}`);
			expect(el.dataset.size).toBe("medium");
		}
	});

	it("collapses to single column on mobile via responsive grid class", () => {
		const { container } = render(<ProjectsBento />);
		const grid = container.querySelector(
			'[data-testid="projects-bento"] > div',
		);
		expect(grid?.className).toMatch(/grid-cols-1/);
		expect(grid?.className).toMatch(/sm:grid-cols-3/);
	});

	it("navigates with the slug when a card is clicked", () => {
		const target = projects[1];
		if (!target) throw new Error("expected a second project");
		const { getByTestId } = render(<ProjectsBento />);
		fireEvent.click(getByTestId(`project-card-${target.slug}`));
		expect(navigateMock).toHaveBeenCalledOnce();
		const [arg] = navigateMock.mock.calls[0] ?? [];
		expect(arg.to).toBe("/");
		expect(arg.search({ choose: 1 })).toEqual({
			choose: 1,
			project: target.slug,
		});
	});

	it("opens the modal when ?project=<slug> matches a known project", () => {
		const target = projects[0];
		if (!target) throw new Error("expected a project");
		currentSearch = { project: target.slug };
		const { getByTestId } = render(<ProjectsBento />);
		expect(getByTestId("project-modal")).toBeInTheDocument();
		expect(getByTestId("project-modal-title").textContent).toBe(target.title);
	});

	it("does not open the modal for an unknown slug", () => {
		currentSearch = { project: "does-not-exist" };
		const { queryByTestId } = render(<ProjectsBento />);
		expect(queryByTestId("project-modal")).toBeNull();
	});

	it("clears the project search param when the modal is closed", () => {
		const target = projects[0];
		if (!target) throw new Error("expected a project");
		currentSearch = { project: target.slug };
		render(<ProjectsBento />);
		fireEvent.keyDown(document.body, { key: "Escape" });
		expect(navigateMock).toHaveBeenCalled();
		const lastCall = navigateMock.mock.calls.at(-1);
		const arg = lastCall?.[0];
		expect(arg.to).toBe("/");
		expect(arg.search({ project: target.slug })).toEqual({
			project: undefined,
		});
	});

	it("renders each project's status chip", () => {
		const { getByTestId } = render(<ProjectsBento />);
		for (const p of projects) {
			expect(getByTestId(`project-status-${p.slug}`).textContent).toBe(
				p.status,
			);
		}
	});
});
