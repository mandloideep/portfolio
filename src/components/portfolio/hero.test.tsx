import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { QUIPS } from "#/content/quips";
import { siteMeta } from "#/content/site";
import { Hero } from "./hero";

describe("Hero", () => {
	it("renders the user's name", () => {
		const { getByTestId } = render(<Hero />);
		expect(getByTestId("hero-name").textContent).toContain(siteMeta.name);
	});

	it("renders the role from siteMeta", () => {
		const { getByText } = render(<Hero />);
		expect(getByText(siteMeta.role)).toBeInTheDocument();
	});

	it("renders the status from siteMeta", () => {
		const { container } = render(<Hero />);
		expect(container.textContent).toContain(siteMeta.status);
	});

	it("renders a quip from the QUIPS list", () => {
		const { getByTestId } = render(<Hero />);
		const text = getByTestId("hero-quip").textContent ?? "";
		const matched = QUIPS.some((q) => text.includes(q));
		expect(matched).toBe(true);
	});

	it("renders the cat whoami command prompt above the card", () => {
		const { container } = render(<Hero />);
		expect(container.textContent).toMatch(/cat whoami/);
	});
});
