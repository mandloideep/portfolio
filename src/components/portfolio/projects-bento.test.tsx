import { fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { projects } from "#/content/site";

const navigateMock = vi.fn();
let currentSearch: { project?: string; choose?: number } = {};

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => navigateMock,
	useSearch: () => currentSearch,
}));

beforeEach(() => {
	navigateMock.mockReset();
	currentSearch = {};
});

afterEach(() => {
	currentSearch = {};
});

import { ProjectsBento } from "./projects-bento";

describe("ProjectsBento", () => {
	it("renders one row per project from site.ts", () => {
		const { getByTestId } = render(<ProjectsBento />);
		for (const p of projects) {
			expect(getByTestId(`project-card-${p.slug}`)).toBeInTheDocument();
		}
	});

	it("expands the first featured project by default", () => {
		const { getByTestId } = render(<ProjectsBento />);
		const firstFeatured = projects.find((p) => p.featured);
		if (!firstFeatured)
			throw new Error("expected at least one featured project");
		const card = getByTestId(`project-card-${firstFeatured.slug}`);
		expect(card.dataset.expanded).toBe("true");
	});

	it("toggling a project navigates with the slug in the search", () => {
		const target = projects[1];
		if (!target) throw new Error("expected a second project");
		const { getByTestId } = render(<ProjectsBento />);
		fireEvent.click(getByTestId(`project-card-open-${target.slug}`));
		expect(navigateMock).toHaveBeenCalledOnce();
		const [arg] = navigateMock.mock.calls[0] ?? [];
		expect(arg.to).toBe("/");
		expect(arg.search({ choose: 1 })).toEqual({
			choose: 1,
			project: target.slug,
		});
	});

	it("clicking the already-active project clears the slug", () => {
		const target = projects[0];
		if (!target) throw new Error("expected a project");
		currentSearch = { project: target.slug };
		const { getByTestId } = render(<ProjectsBento />);
		fireEvent.click(getByTestId(`project-card-open-${target.slug}`));
		expect(navigateMock).toHaveBeenCalledOnce();
		const [arg] = navigateMock.mock.calls[0] ?? [];
		expect(arg.search({})).toEqual({ project: undefined });
	});

	it("expands the project whose slug matches ?project=<slug>", () => {
		const target = projects[2] ?? projects[1] ?? projects[0];
		if (!target) throw new Error("expected a project");
		currentSearch = { project: target.slug };
		const { getByTestId } = render(<ProjectsBento />);
		expect(getByTestId(`project-card-${target.slug}`).dataset.expanded).toBe(
			"true",
		);
	});

	it("renders each project's status pill with the uppercase label", () => {
		const { getByTestId } = render(<ProjectsBento />);
		for (const p of projects) {
			const text = getByTestId(`project-status-${p.slug}`).textContent ?? "";
			expect(text.toLowerCase()).toContain(p.status.toLowerCase());
		}
	});
});
