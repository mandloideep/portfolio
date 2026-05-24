import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Project } from "#/content/site";
import { ProjectModal } from "./project-modal";

const baseProject: Project = {
	slug: "modal-project",
	title: "Modal Project",
	status: "complete",
	summary: "Modal project summary.",
	bullets: ["first bullet", "second bullet", "third bullet"],
	tags: ["alpha", "beta"],
	links: {},
	featured: false,
};

describe("ProjectModal", () => {
	it("renders nothing visible when project is undefined", () => {
		const { queryByTestId } = render(
			<ProjectModal project={undefined} onClose={() => {}} />,
		);
		expect(queryByTestId("project-modal")).toBeNull();
	});

	it("renders the dialog with the project title when a project is provided", () => {
		const { getByTestId, getByRole } = render(
			<ProjectModal project={baseProject} onClose={() => {}} />,
		);
		expect(getByTestId("project-modal")).toBeInTheDocument();
		expect(getByTestId("project-modal-title").textContent).toBe(
			baseProject.title,
		);
		expect(getByRole("dialog")).toBeInTheDocument();
	});

	it("renders every bullet from the project", () => {
		const { getByTestId } = render(
			<ProjectModal project={baseProject} onClose={() => {}} />,
		);
		const list = getByTestId("project-modal-bullets");
		const items = list.querySelectorAll("li");
		expect(items.length).toBe(baseProject.bullets.length);
		expect(list.textContent).toContain("first bullet");
		expect(list.textContent).toContain("third bullet");
	});

	it("renders the poster image only when links.poster is set", () => {
		const { queryByTestId, rerender } = render(
			<ProjectModal project={baseProject} onClose={() => {}} />,
		);
		expect(queryByTestId("project-modal-poster")).toBeNull();

		const withPoster: Project = {
			...baseProject,
			links: { poster: "https://example.com/poster.png" },
		};
		rerender(<ProjectModal project={withPoster} onClose={() => {}} />);
		const img = queryByTestId("project-modal-poster");
		expect(img).not.toBeNull();
		expect(img?.getAttribute("src")).toBe("https://example.com/poster.png");
		expect(img?.getAttribute("loading")).toBe("lazy");
	});

	it("renders repo/live link row only when at least one link is set", () => {
		const { queryByTestId, rerender } = render(
			<ProjectModal project={baseProject} onClose={() => {}} />,
		);
		expect(queryByTestId("project-modal-links")).toBeNull();

		rerender(
			<ProjectModal
				project={{
					...baseProject,
					links: { repo: "https://example.com/r" },
				}}
				onClose={() => {}}
			/>,
		);
		expect(queryByTestId("project-modal-links")).not.toBeNull();
	});

	it("fires onClose when ESC is pressed inside the dialog", () => {
		const onClose = vi.fn();
		render(<ProjectModal project={baseProject} onClose={onClose} />);
		fireEvent.keyDown(document.body, { key: "Escape" });
		expect(onClose).toHaveBeenCalled();
	});
});
