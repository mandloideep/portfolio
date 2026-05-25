import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { corpusRecord } from "#/lib/terminal/corpus";
import { HiddenCorpus } from "./hidden-corpus";

describe("HiddenCorpus", () => {
	it("renders a single div with hidden + aria-hidden + data-seo-corpus", () => {
		const { container } = render(<HiddenCorpus />);
		const matches = container.querySelectorAll("[data-seo-corpus]");
		expect(matches.length).toBe(1);
		const el = matches[0] as HTMLElement;
		expect(el.tagName).toBe("DIV");
		expect(el.hasAttribute("hidden")).toBe(true);
		expect(el.getAttribute("aria-hidden")).toBe("true");
	});

	it("includes a known phrase from me.md", () => {
		const me = corpusRecord["/src/content/agent/me.md"];
		expect(typeof me).toBe("string");
		const firstLine = (me ?? "").split("\n")[0];
		const { container } = render(<HiddenCorpus />);
		const el = container.querySelector(
			"[data-seo-corpus]",
		) as HTMLElement | null;
		expect(el?.textContent ?? "").toContain(firstLine);
	});

	it("does not leak system-prompt.md", () => {
		const systemPrompt = corpusRecord["/src/content/agent/system-prompt.md"];
		expect(typeof systemPrompt).toBe("string");
		const { container } = render(<HiddenCorpus />);
		const el = container.querySelector(
			"[data-seo-corpus]",
		) as HTMLElement | null;
		const text = el?.textContent ?? "";
		// First line of system prompt should be absent from the public corpus.
		const firstLine = (systemPrompt ?? "").split("\n")[0];
		if (firstLine.length > 0) expect(text).not.toContain(firstLine);
	});
});
