import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { skills } from "#/content/site";
import { SkillsGrid } from "./skills-grid";

describe("SkillsGrid", () => {
	it("renders a heading per skills group with the `$ {group}` prefix", () => {
		const { getByTestId } = render(<SkillsGrid />);
		for (const group of skills) {
			const block = getByTestId(`skill-group-${group.group}`);
			const heading = block.querySelector("h3");
			expect(heading).not.toBeNull();
			expect(heading?.textContent?.trim()).toBe(`$ ${group.group}`);
		}
	});

	it("renders every item across every group as a Badge", () => {
		const { getByText } = render(<SkillsGrid />);
		for (const group of skills) {
			for (const item of group.items) {
				expect(getByText(item)).toBeInTheDocument();
			}
		}
	});

	it("renders exactly one badge per item (count matches flattened items)", () => {
		const { container } = render(<SkillsGrid />);
		const expected = skills.flatMap((g) => g.items).length;
		const badges = container.querySelectorAll('[data-slot="badge"]');
		expect(badges.length).toBe(expected);
	});

	it("exposes each group via data-testid='skill-group-{group}'", () => {
		const { getByTestId } = render(<SkillsGrid />);
		for (const group of skills) {
			expect(getByTestId(`skill-group-${group.group}`)).toBeInTheDocument();
		}
	});

	it("renders a single root container with data-testid='skills-grid'", () => {
		const { getByTestId } = render(<SkillsGrid />);
		expect(getByTestId("skills-grid")).toBeInTheDocument();
	});
});
