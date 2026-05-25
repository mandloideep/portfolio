import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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

	it("renders the quip from siteMeta", () => {
		const { getByTestId } = render(<Hero />);
		expect(getByTestId("hero-quip").textContent).toContain(siteMeta.quip);
	});

	it("renders the cat whoami command prompt above the card", () => {
		const { container } = render(<Hero />);
		expect(container.textContent).toMatch(/cat whoami/);
	});
});
