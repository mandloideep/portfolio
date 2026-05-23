import { Store } from "@tanstack/store";
import {
	DEFAULT_THEME_SLUG,
	isThemeSlug,
	type ThemeSlug,
} from "#/content/themes";

export const THEME_STORAGE_KEY = "portfolio.theme";

type ThemeState = { slug: ThemeSlug };

function readInitial(): ThemeState {
	if (typeof window === "undefined") return { slug: DEFAULT_THEME_SLUG };
	try {
		const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
		if (raw && isThemeSlug(raw)) return { slug: raw };
	} catch {
		// localStorage can throw in private browsing / restricted contexts
	}
	return { slug: DEFAULT_THEME_SLUG };
}

export const themeStore = new Store<ThemeState>(readInitial());

export function setTheme(slug: ThemeSlug): void {
	if (!isThemeSlug(slug)) {
		if (import.meta.env?.DEV) {
			throw new Error(`unknown theme slug: ${String(slug)}`);
		}
		return;
	}
	themeStore.setState(() => ({ slug }));
	if (typeof window !== "undefined") {
		try {
			window.localStorage.setItem(THEME_STORAGE_KEY, slug);
		} catch {
			// best-effort persistence
		}
	}
}

/**
 * Read the persisted theme from localStorage, falling back to the default.
 * Used by hydration code paths that need a synchronous value.
 */
export function getStoredTheme(): ThemeSlug {
	return themeStore.state.slug;
}
