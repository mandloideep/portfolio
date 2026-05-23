import { describe, expect, it } from "vitest";

const corpus = import.meta.glob("./agent/**/*.md", {
	query: "?raw",
	import: "default",
	eager: true,
}) as Record<string, string>;

describe("agent markdown corpus", () => {
	it("loads non-empty record of markdown files", () => {
		const keys = Object.keys(corpus);
		expect(keys.length).toBeGreaterThan(0);
	});

	it("every file starts with an H1", () => {
		for (const [path, text] of Object.entries(corpus)) {
			expect(text.startsWith("# "), `${path} should start with "# "`).toBe(
				true,
			);
		}
	});

	it("system-prompt.md contains refusal + format rules", () => {
		const systemPrompt = corpus["./agent/system-prompt.md"];
		expect(systemPrompt).toBeDefined();
		expect(systemPrompt).toMatch(/Markdown/);
		expect(systemPrompt).toMatch(/Never invent facts/);
	});

	it("includes required top-level files", () => {
		const required = [
			"./agent/system-prompt.md",
			"./agent/me.md",
			"./agent/experience.md",
			"./agent/skills.md",
			"./agent/contact.md",
			"./agent/facts/crazy-facts.md",
		];
		for (const path of required) {
			expect(corpus[path], `missing ${path}`).toBeDefined();
		}
	});
});
