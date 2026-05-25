import { render, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { research } from "#/content/site";
import { ResearchList } from "./research-list";

describe("ResearchList", () => {
	it("renders one <li> per research entry", () => {
		const { container } = render(<ResearchList />);
		expect(container.querySelectorAll("li").length).toBe(research.length);
	});

	it("orders entries by year descending", () => {
		const { container } = render(<ResearchList />);
		const cards = container.querySelectorAll('[data-testid^="research-card-"]');
		const sortedByYear = [...research].sort((a, b) => b.year - a.year);
		Array.from(cards).forEach((card, i) => {
			expect(card.getAttribute("data-testid")).toBe(
				`research-card-${sortedByYear[i]?.slug}`,
			);
		});
	});

	it("renders year, venue, title and abstract for every entry", () => {
		const { getByTestId } = render(<ResearchList />);
		for (const entry of research) {
			const card = getByTestId(`research-card-${entry.slug}`);
			const scope = within(card);
			expect(scope.getByText(String(entry.year))).toBeInTheDocument();
			expect(scope.getByText(entry.venue)).toBeInTheDocument();
			expect(scope.getByText(entry.title)).toBeInTheDocument();
			expect(scope.getByText(entry.abstract)).toBeInTheDocument();
		}
	});

	it("renders each entry's tags", () => {
		const { getByTestId } = render(<ResearchList />);
		for (const entry of research) {
			const card = getByTestId(`research-card-${entry.slug}`);
			const scope = within(card);
			for (const tag of entry.tags) {
				expect(scope.getByText(tag)).toBeInTheDocument();
			}
		}
	});
});
