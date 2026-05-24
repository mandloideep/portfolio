import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MarkdownBlock } from "./markdown-block";

describe("MarkdownBlock", () => {
	it("renders an H1", () => {
		const { container } = render(<MarkdownBlock text="# Hello world" />);
		const h1 = container.querySelector("h1");
		expect(h1?.textContent).toMatch(/Hello world/);
	});

	it("renders a bulleted list", () => {
		const md = "- one\n- two\n- three";
		const { container } = render(<MarkdownBlock text={md} />);
		const items = container.querySelectorAll("li");
		expect(items.length).toBe(3);
	});

	it("renders inline code", () => {
		const { container } = render(<MarkdownBlock text="use `pnpm test`" />);
		expect(container.querySelector("code")?.textContent).toBe("pnpm test");
	});
});
