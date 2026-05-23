import { beforeEach, describe, expect, it } from "vitest";
import {
	getStoredTheme,
	setTheme,
	THEME_STORAGE_KEY,
	themeStore,
} from "./theme";

beforeEach(() => {
	window.localStorage.clear();
	themeStore.setState(() => ({ slug: "nord-green" }));
});

describe("theme store", () => {
	it("starts at the default slug", () => {
		expect(getStoredTheme()).toBe("nord-green");
	});

	it("setTheme updates the store", () => {
		setTheme("dracula");
		expect(themeStore.state.slug).toBe("dracula");
	});

	it("setTheme persists to localStorage", () => {
		setTheme("tokyo-night");
		expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("tokyo-night");
	});

	it("setTheme throws on an unknown slug in dev", () => {
		// import.meta.env.DEV is true under vitest
		expect(() => setTheme("bogus" as never)).toThrow();
	});

	it("notifies subscribers", () => {
		const seen: string[] = [];
		const sub = themeStore.subscribe(() => seen.push(themeStore.state.slug));
		setTheme("solarized-light");
		setTheme("anthropic-cream");
		sub.unsubscribe();
		expect(seen).toEqual(["solarized-light", "anthropic-cream"]);
	});
});
