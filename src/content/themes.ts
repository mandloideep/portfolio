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
	"bgElev",
	"fg",
	"muted",
	"border",
	"accent",
	"accentAlt",
	"link",
	"success",
	"error",
	"ring",
] as const;

export type ThemeTokenKey = (typeof themeTokenKeys)[number];

const hex = z.string().regex(/^#([0-9a-fA-F]{3,8})$/, "expected hex color");

export const ThemeTokensSchema = z.object({
	bg: hex,
	bgElev: hex,
	fg: hex,
	muted: hex,
	border: hex,
	accent: hex,
	accentAlt: hex,
	link: hex,
	success: hex,
	error: hex,
	ring: hex,
});

export type ThemeTokens = z.infer<typeof ThemeTokensSchema>;

export const ThemeSchema = z.object({
	slug: z.string().regex(/^[a-z0-9-]+$/, "slug must be kebab-case"),
	name: z.string(),
	vibe: z.string(),
	tokens: ThemeTokensSchema,
});

export type Theme = z.infer<typeof ThemeSchema>;

// Curated reference palettes. Hex values sourced from each project's spec
// and tuned for WCAG AA on muted/fg pairings.
// Nord: https://www.nordtheme.com  •  Dracula: https://draculatheme.com
// Solarized: https://ethanschoonover.com/solarized
// Tokyo Night: https://github.com/enkia/tokyo-night-vscode-theme

export const themes: Theme[] = z.array(ThemeSchema).parse([
	{
		slug: "nord-green",
		name: "Nord Green",
		vibe: "Near-black terminal base, vivid green + sky cyan accents.",
		tokens: {
			bg: "#0d0e13",
			bgElev: "#14161d",
			fg: "#ffffff",
			muted: "#8a8e98",
			border: "#262932",
			accent: "#5ee68d",
			accentAlt: "#7dcfff",
			link: "#7dcfff",
			success: "#5ee68d",
			error: "#ff6b6b",
			ring: "#5ee68d",
		},
	},
	{
		slug: "dracula",
		name: "Dracula",
		vibe: "Classic dracula palette, purple-leaning.",
		tokens: {
			bg: "#282a36",
			bgElev: "#2f3142",
			fg: "#f8f8f2",
			muted: "#9aa3cb",
			border: "#44475a",
			accent: "#bd93f9",
			accentAlt: "#ff79c6",
			link: "#8be9fd",
			success: "#50fa7b",
			error: "#ff5555",
			ring: "#bd93f9",
		},
	},
	{
		slug: "solarized-light",
		name: "Solarized Light",
		vibe: "Beige bg, low-glare contrast.",
		tokens: {
			bg: "#fdf6e3",
			bgElev: "#efe8d0",
			fg: "#073642",
			muted: "#657b83",
			border: "#dfd8b8",
			accent: "#b58900",
			accentAlt: "#268bd2",
			link: "#268bd2",
			success: "#859900",
			error: "#dc322f",
			ring: "#b58900",
		},
	},
	{
		slug: "tokyo-night",
		name: "Tokyo Night",
		vibe: "Deep blue-black base, neon accents.",
		tokens: {
			bg: "#1a1b26",
			bgElev: "#1f2030",
			fg: "#c0caf5",
			muted: "#8e98c3",
			border: "#292e42",
			accent: "#bb9af7",
			accentAlt: "#7aa2f7",
			link: "#7dcfff",
			success: "#9ece6a",
			error: "#f7768e",
			ring: "#bb9af7",
		},
	},
	{
		slug: "anthropic-cream",
		name: "Anthropic Cream",
		vibe: "Cream bg, warm orange accents.",
		tokens: {
			bg: "#f5f0e6",
			bgElev: "#ede5d5",
			fg: "#1c1714",
			muted: "#6e6354",
			border: "#d8ccb6",
			accent: "#cc6a37",
			accentAlt: "#b8893b",
			link: "#3e7bb6",
			success: "#5b8a3a",
			error: "#b3402b",
			ring: "#cc6a37",
		},
	},
	{
		slug: "phosphor",
		name: "Phosphor",
		vibe: "Amber CRT — terminal-first warmth.",
		tokens: {
			bg: "#0e0a06",
			bgElev: "#1a120a",
			fg: "#ffb86b",
			muted: "#b88554",
			border: "#3a2412",
			accent: "#ffb86b",
			accentAlt: "#ff7a18",
			link: "#ffd49a",
			success: "#9ee06b",
			error: "#ff6f59",
			ring: "#ffb86b",
		},
	},
	{
		slug: "studio-paper",
		name: "Studio Paper",
		vibe: "Newsprint cream, oxblood rule.",
		tokens: {
			bg: "#f3ece0",
			bgElev: "#ede3d2",
			fg: "#1c1a17",
			muted: "#5d544a",
			border: "#d8ccb6",
			accent: "#9b2a2a",
			accentAlt: "#3b5e4a",
			link: "#3b5e4a",
			success: "#3b5e4a",
			error: "#9b2a2a",
			ring: "#9b2a2a",
		},
	},
]);

export type ThemeSlug = (typeof themes)[number]["slug"];

export const DEFAULT_THEME_SLUG: ThemeSlug = "nord-green";

export function isThemeSlug(value: unknown): value is ThemeSlug {
	return typeof value === "string" && themes.some((t) => t.slug === value);
}
