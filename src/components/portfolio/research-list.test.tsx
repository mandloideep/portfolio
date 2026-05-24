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
		const years = Array.from(cards).map((card) => {
			const yearBadge = card.querySelector('[data-variant="default"]');
			return Number(yearBadge?.textContent);
		});
		for (let i = 1; i < years.length; i++) {
			expect(years[i - 1]).toBeGreaterThanOrEqual(years[i]);
		}
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

	it("renders each entry's tags as Badges", () => {
		const { getByTestId } = render(<ResearchList />);
		for (const entry of research) {
			const card = getByTestId(`research-card-${entry.slug}`);
			const scope = within(card);
			for (const tag of entry.tags) {
				expect(scope.getByText(tag)).toBeInTheDocument();
			}
		}
	});

	it("uses variant=default for the year pill and variant=outline for the venue pill", () => {
		const { getByTestId } = render(<ResearchList />);
		for (const entry of research) {
			const card = getByTestId(`research-card-${entry.slug}`);
			const yearBadge = within(card).getByText(String(entry.year));
			const venueBadge = within(card).getByText(entry.venue);
			expect(yearBadge.dataset.variant).toBe("default");
			expect(venueBadge.dataset.variant).toBe("outline");
		}
	});
});
