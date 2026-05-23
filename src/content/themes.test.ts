import { describe, expect, it } from "vitest";
import {
	DEFAULT_THEME_SLUG,
	isThemeSlug,
	themes,
	themeTokenKeys,
} from "./themes";

describe("themes registry", () => {
	it("ships exactly five themes", () => {
		expect(themes).toHaveLength(5);
	});

	it("nord-green is the default and first in the list", () => {
		expect(DEFAULT_THEME_SLUG).toBe("nord-green");
		expect(themes[0]?.slug).toBe("nord-green");
	});

	it("all slugs are unique", () => {
		const slugs = themes.map((t) => t.slug);
		expect(new Set(slugs).size).toBe(slugs.length);
	});

	it("every theme has all token keys populated with hex strings", () => {
		for (const t of themes) {
			for (const key of themeTokenKeys) {
				const value = t.tokens[key];
				expect(value, `${t.slug}.${key}`).toMatch(/^#([0-9a-fA-F]{3,8})$/);
			}
		}
	});

	it("isThemeSlug guards correctly", () => {
		expect(isThemeSlug("nord-green")).toBe(true);
		expect(isThemeSlug("dracula")).toBe(true);
		expect(isThemeSlug("not-a-theme")).toBe(false);
		expect(isThemeSlug(42)).toBe(false);
		expect(isThemeSlug(null)).toBe(false);
	});
});
