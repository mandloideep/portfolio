import { fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DockNav } from "./dock-nav";

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

const ITEMS = [
	{ id: "hero", label: "intro" },
	{ id: "projects", label: "projects" },
	{ id: "contact", label: "contact" },
] as const;

beforeEach(() => {
	(
		globalThis as unknown as { IntersectionObserver: typeof MockIO }
	).IntersectionObserver = MockIO;
	for (const { id } of ITEMS) {
		const el = document.createElement("section");
		el.id = id;
		document.body.appendChild(el);
	}
});

afterEach(() => {
	document.body.innerHTML = "";
});

describe("DockNav", () => {
	it("renders one button per item", () => {
		const { getByTestId } = render(<DockNav items={ITEMS} />);
		for (const item of ITEMS) {
			expect(getByTestId(`dock-item-${item.id}`)).toBeInTheDocument();
		}
	});

	it("hides itself on mobile via responsive class", () => {
		const { container } = render(<DockNav items={ITEMS} />);
		const nav = container.querySelector("nav");
		expect(nav?.className).toMatch(/hidden/);
		expect(nav?.className).toMatch(/sm:flex/);
	});

	it("calls scrollIntoView on the matching id when an item is clicked", () => {
		const projects = document.getElementById("projects");
		if (!projects) throw new Error("missing #projects");
		const spy = vi
			.spyOn(projects, "scrollIntoView")
			.mockImplementation(() => {});

		const { getByTestId } = render(<DockNav items={ITEMS} />);
		fireEvent.click(getByTestId("dock-item-projects"));

		expect(spy).toHaveBeenCalledOnce();
		expect(spy).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
	});

	it("marks the first id as active by default (seeded by scroll-spy)", () => {
		const { getByTestId } = render(<DockNav items={ITEMS} />);
		expect(getByTestId("dock-item-hero").dataset.active).toBe("true");
		expect(getByTestId("dock-item-projects").dataset.active).toBe("false");
	});
});
