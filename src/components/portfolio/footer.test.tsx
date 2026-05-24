import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { getProject, siteMeta } from "#/content/site";
import { themeStore } from "#/store/theme";
import { Footer } from "./footer";

beforeEach(() => {
	window.localStorage.clear();
	themeStore.setState(() => ({ slug: "nord-green" }));
});

describe("Footer", () => {
	it("renders the siteMeta quip", () => {
		const { getByText } = render(<Footer />);
		expect(getByText(siteMeta.quip)).toBeInTheDocument();
	});

	it("renders the current year", () => {
		const { getByTestId } = render(<Footer />);
		expect(getByTestId("footer-year").textContent).toContain(
			String(new Date().getFullYear()),
		);
	});

	it("links source on github to the agent-portfolio repo", () => {
		const expected = getProject("agent-portfolio")?.links.repo;
		expect(expected).toBeDefined();
		const { getByTestId } = render(<Footer />);
		const link = getByTestId("footer-source");
		expect(link.getAttribute("href")).toBe(expected);
		expect(link.getAttribute("target")).toBe("_blank");
		expect(link.getAttribute("rel")).toContain("noreferrer");
	});

	it("renders the theme switcher", () => {
		const { getByTestId } = render(<Footer />);
		expect(getByTestId("theme-switcher")).toBeInTheDocument();
	});
});
