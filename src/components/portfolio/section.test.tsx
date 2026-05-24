import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PortfolioSection } from "./section";

describe("PortfolioSection", () => {
	it("uses the id and labels the heading", () => {
		const { container, getByText } = render(
			<PortfolioSection id="hero" title="intro" eyebrow="cat ~/intro" />,
		);
		const section = container.querySelector("section");
		expect(section?.id).toBe("hero");
		expect(section?.getAttribute("aria-labelledby")).toBe("hero-label");
		expect(getByText("intro").id).toBe("hero-label");
	});

	it("renders the eyebrow when provided", () => {
		const { getByText } = render(
			<PortfolioSection id="x" title="t" eyebrow="ls -la" />,
		);
		expect(getByText(/ls -la/)).toBeInTheDocument();
	});

	it("renders children when provided", () => {
		const { getByText } = render(
			<PortfolioSection id="x" title="t">
				<span>body</span>
			</PortfolioSection>,
		);
		expect(getByText("body")).toBeInTheDocument();
	});
});
