import { describe, expect, it } from "vitest";
import { themes } from "#/content/themes";
import { generateThemeCss } from "./theme-css";

describe("generateThemeCss", () => {
	it("emits one block per theme", () => {
		const css = generateThemeCss(themes);
		for (const t of themes) {
			expect(css).toContain(`[data-theme="${t.slug}"]`);
		}
	});

	it("emits all expected tokens as CSS variables", () => {
		const css = generateThemeCss(themes);
		expect(css).toMatch(/--bg:/);
		expect(css).toMatch(/--fg:/);
		expect(css).toMatch(/--accent:/);
		expect(css).toMatch(/--accent-alt:/);
	});

	it("emits the actual hex values from the registry", () => {
		const css = generateThemeCss(themes);
		const nord = themes.find((t) => t.slug === "nord-green");
		expect(nord).toBeDefined();
		expect(css).toContain(`--bg: ${nord?.tokens.bg};`);
		expect(css).toContain(`--accent: ${nord?.tokens.accent};`);
	});

	it("is deterministic for the same input", () => {
		const a = generateThemeCss(themes);
		const b = generateThemeCss(themes);
		expect(a).toBe(b);
	});
});
