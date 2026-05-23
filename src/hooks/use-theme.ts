import { useStore } from "@tanstack/react-store";
import { useEffect } from "react";
import { type ThemeSlug, themes } from "#/content/themes";
import { setTheme, themeStore } from "#/store/theme";

/**
 * Hook for reading and changing the active theme.
 *
 * Returns the current slug, a setter, and the full theme list (useful for
 * theme-switcher UIs). Also synchronizes `<html data-theme="...">` on every
 * change so the CSS variables resolve to the right hex values.
 */
export function useTheme() {
	const slug = useStore(themeStore, (state) => state.slug);

	useEffect(() => {
		if (typeof document !== "undefined") {
			document.documentElement.dataset.theme = slug;
		}
	}, [slug]);

	return {
		theme: slug,
		setTheme: (next: ThemeSlug) => setTheme(next),
		themes,
	};
}
