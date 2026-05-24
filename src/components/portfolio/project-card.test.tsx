import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Project } from "#/content/site";

type IOCallback = (entries: Array<Partial<IntersectionObserverEntry>>) => void;

let lastIOCallback: IOCallback | null = null;

class MockIO {
	cb: IOCallback;
	constructor(cb: IOCallback) {
		this.cb = cb;
		lastIOCallback = cb;
	}
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
	lastIOCallback = null;
	mockMatchMedia(false);
	(
		globalThis as unknown as { IntersectionObserver: typeof MockIO }
	).IntersectionObserver = MockIO;
});

afterEach(() => {
	vi.useRealTimers();
});

import { ProjectCard } from "./project-card";

const baseProject: Project = {
	slug: "test-project",
	title: "Test Project",
	status: "running",
	summary: "A summary for the test project.",
	bullets: ["bullet a", "bullet b"],
	tags: ["one", "two", "three", "four", "five", "six"],
	links: {
		repo: "https://example.com/repo",
		live: "https://example.com/live",
	},
	featured: true,
};

function fireInView(isIntersecting: boolean) {
	lastIOCallback?.([{ isIntersecting }]);
}

describe("ProjectCard", () => {
	it("renders title, summary, and the status chip", () => {
		const { getByText, getByTestId } = render(
			<ProjectCard project={baseProject} size="medium" onOpen={() => {}} />,
		);
		expect(getByText("Test Project")).toBeInTheDocument();
		expect(getByText("A summary for the test project.")).toBeInTheDocument();
		expect(getByTestId(`project-status-${baseProject.slug}`).textContent).toBe(
			"running",
		);
	});

	it("renders repo and live links only when the project has them", () => {
		const { queryByTestId, rerender } = render(
			<ProjectCard project={baseProject} size="medium" onOpen={() => {}} />,
		);
		expect(
			queryByTestId(`project-link-repo-${baseProject.slug}`),
		).not.toBeNull();
		expect(
			queryByTestId(`project-link-live-${baseProject.slug}`),
		).not.toBeNull();

		const bare: Project = { ...baseProject, links: {} };
		rerender(<ProjectCard project={bare} size="medium" onOpen={() => {}} />);
		expect(queryByTestId(`project-link-repo-${baseProject.slug}`)).toBeNull();
		expect(queryByTestId(`project-link-live-${baseProject.slug}`)).toBeNull();
	});

	it("caps tag chips at 4 on medium and shows the +N overflow", () => {
		const { container, getByText } = render(
			<ProjectCard project={baseProject} size="medium" onOpen={() => {}} />,
		);
		const chips = container.querySelectorAll(
			'[data-slot="badge"][data-variant="outline"]',
		);
		expect(chips.length).toBe(4);
		expect(getByText("+2")).toBeInTheDocument();
	});

	it("shows all tags on the hero size", () => {
		const { container, queryByText } = render(
			<ProjectCard project={baseProject} size="hero" onOpen={() => {}} />,
		);
		const chips = container.querySelectorAll(
			'[data-slot="badge"][data-variant="outline"]',
		);
		expect(chips.length).toBe(baseProject.tags.length);
		expect(queryByText(/^\+\d+$/)).toBeNull();
	});

	it("calls onOpen with the slug on card click", () => {
		const onOpen = vi.fn();
		const { getByTestId } = render(
			<ProjectCard project={baseProject} size="medium" onOpen={onOpen} />,
		);
		fireEvent.click(getByTestId(`project-card-${baseProject.slug}`));
		expect(onOpen).toHaveBeenCalledOnce();
		expect(onOpen).toHaveBeenCalledWith(baseProject.slug);
	});

	it("does not call onOpen when an inner link is clicked (stopPropagation)", () => {
		const onOpen = vi.fn();
		const { getByTestId } = render(
			<ProjectCard project={baseProject} size="medium" onOpen={onOpen} />,
		);
		fireEvent.click(getByTestId(`project-link-repo-${baseProject.slug}`));
		expect(onOpen).not.toHaveBeenCalled();
	});

	it("uses shimmer on the hero title only when in view", () => {
		const { container } = render(
			<ProjectCard project={baseProject} size="hero" onOpen={() => {}} />,
		);
		const titleSpan = container.querySelector("[data-shimmer]");
		expect(titleSpan?.getAttribute("data-shimmer")).toBe("false");
		act(() => fireInView(true));
		expect(
			container.querySelector("[data-shimmer]")?.getAttribute("data-shimmer"),
		).toBe("true");
	});

	it("never shimmers when prefers-reduced-motion is set", () => {
		mockMatchMedia(true);
		const { container } = render(
			<ProjectCard project={baseProject} size="hero" onOpen={() => {}} />,
		);
		act(() => fireInView(true));
		expect(
			container.querySelector("[data-shimmer]")?.getAttribute("data-shimmer"),
		).toBe("false");
	});
});
