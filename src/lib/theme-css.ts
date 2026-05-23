import type { Theme } from "#/content/themes";
import { themeTokenKeys } from "#/content/themes";

/**
 * camelCase token key → kebab-case CSS custom property.
 *   accentAlt → --accent-alt
 *   bg        → --bg
 */
function toCssVar(key: string): string {
	const kebab = key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
	return `--${kebab}`;
}

/**
 * Emit `[data-theme="<slug>"] { --bg: ...; ... }` rules from the theme
 * registry. Called at SSR and inlined into the root document so the page
 * paints with the correct theme even before client JS runs.
 *
 * Pure — no I/O, deterministic by theme set.
 */
export function generateThemeCss(themes: readonly Theme[]): string {
	return themes
		.map((theme) => {
			const declarations = themeTokenKeys
				.map((key) => `  ${toCssVar(key)}: ${theme.tokens[key]};`)
				.join("\n");
			return `[data-theme="${theme.slug}"] {\n${declarations}\n}`;
		})
		.join("\n\n");
}
