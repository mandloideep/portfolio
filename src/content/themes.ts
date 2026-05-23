import { z } from "zod";

/**
 * Theme token registry. Single source of truth for all themes.
 *
 * To add a theme: append one Theme object to `themes` below.
 * CSS variables are generated at SSR from this registry via `generateThemeCss`
 * in `#/lib/theme-css` and inlined into the document head. Do not hand-edit
 * `[data-theme="..."]` blocks elsewhere.
 *
 * Token names are stable; consumers reference them as `var(--bg)`, etc., or
 * via the Tailwind `@theme inline` mappings in `src/styles.css`.
 */

export const themeTokenKeys = [
	"bg",
	"fg",
	"muted",
	"border",
	"accent",
	"accentAlt",
	"link",
	"success",
	"error",
] as const;

export type ThemeTokenKey = (typeof themeTokenKeys)[number];

const hex = z.string().regex(/^#([0-9a-fA-F]{3,8})$/, "expected hex color");

export const ThemeTokensSchema = z.object({
	bg: hex,
	fg: hex,
	muted: hex,
	border: hex,
	accent: hex,
	accentAlt: hex,
	link: hex,
	success: hex,
	error: hex,
});

export type ThemeTokens = z.infer<typeof ThemeTokensSchema>;

export const ThemeSchema = z.object({
	slug: z.string().regex(/^[a-z0-9-]+$/, "slug must be kebab-case"),
	name: z.string(),
	vibe: z.string(),
	tokens: ThemeTokensSchema,
});

export type Theme = z.infer<typeof ThemeSchema>;

// Curated reference palettes. Hex values sourced from each project's spec.
// Nord: https://www.nordtheme.com  •  Dracula: https://draculatheme.com
// Solarized: https://ethanschoonover.com/solarized
// Tokyo Night: https://github.com/enkia/tokyo-night-vscode-theme
// Anthropic cream: inspired by Claude Code light theme.

export const themes: Theme[] = z.array(ThemeSchema).parse([
	{
		slug: "nord-green",
		name: "Nord Green",
		vibe: "Dark slate base, bright green accents, gray body.",
		tokens: {
			bg: "#2e3440",
			fg: "#d8dee9",
			muted: "#4c566a",
			border: "#3b4252",
			accent: "#69ff96",
			accentAlt: "#88c0d0",
			link: "#81a1c1",
			success: "#a3be8c",
			error: "#bf616a",
		},
	},
	{
		slug: "dracula",
		name: "Dracula",
		vibe: "Classic dracula palette, purple-leaning.",
		tokens: {
			bg: "#282a36",
			fg: "#f8f8f2",
			muted: "#6272a4",
			border: "#44475a",
			accent: "#50fa7b",
			accentAlt: "#ff79c6",
			link: "#8be9fd",
			success: "#50fa7b",
			error: "#ff5555",
		},
	},
	{
		slug: "solarized-light",
		name: "Solarized Light",
		vibe: "Beige bg, low-glare contrast.",
		tokens: {
			bg: "#fdf6e3",
			fg: "#586e75",
			muted: "#93a1a1",
			border: "#eee8d5",
			accent: "#859900",
			accentAlt: "#268bd2",
			link: "#268bd2",
			success: "#859900",
			error: "#dc322f",
		},
	},
	{
		slug: "tokyo-night",
		name: "Tokyo Night",
		vibe: "Deep blue-black base, neon accents.",
		tokens: {
			bg: "#1a1b26",
			fg: "#c0caf5",
			muted: "#565f89",
			border: "#292e42",
			accent: "#7aa2f7",
			accentAlt: "#ff79c6",
			link: "#7dcfff",
			success: "#9ece6a",
			error: "#f7768e",
		},
	},
	{
		slug: "anthropic-cream",
		name: "Anthropic Cream",
		vibe: "Cream bg, warm orange accents.",
		tokens: {
			bg: "#f5f0e6",
			fg: "#2b2620",
			muted: "#8a7e6e",
			border: "#e3dccd",
			accent: "#cc6a37",
			accentAlt: "#b8893b",
			link: "#3e7bb6",
			success: "#5b8a3a",
			error: "#b3402b",
		},
	},
]);

export type ThemeSlug = (typeof themes)[number]["slug"];

export const DEFAULT_THEME_SLUG: ThemeSlug = "nord-green";

export function isThemeSlug(value: unknown): value is ThemeSlug {
	return typeof value === "string" && themes.some((t) => t.slug === value);
}
