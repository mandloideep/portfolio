import { fireEvent, render } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { themes } from "#/content/themes";
import { THEME_STORAGE_KEY, themeStore } from "#/store/theme";
import { ThemeSwitcher } from "./theme-switcher";

beforeEach(() => {
	window.localStorage.clear();
	themeStore.setState(() => ({ slug: "nord-green" }));
	document.documentElement.removeAttribute("data-theme");
});

function openMenu(trigger: HTMLElement) {
	fireEvent.pointerDown(trigger, { button: 0 });
	fireEvent.pointerUp(trigger, { button: 0 });
	fireEvent.click(trigger);
}

describe("ThemeSwitcher", () => {
	it("shows the active theme name on the trigger", () => {
		const { getByTestId } = render(<ThemeSwitcher />);
		expect(getByTestId("theme-switcher").textContent).toContain("Nord Green");
	});

	it("lists every registered theme when opened", () => {
		const { getByTestId, findByTestId } = render(<ThemeSwitcher />);
		openMenu(getByTestId("theme-switcher"));
		return Promise.all(
			themes.map(async (t) => {
				const item = await findByTestId(`theme-option-${t.slug}`);
				expect(item).toBeInTheDocument();
			}),
		);
	});

	it("marks the active option with the check icon", async () => {
		const { getByTestId, findByTestId } = render(<ThemeSwitcher />);
		openMenu(getByTestId("theme-switcher"));
		await findByTestId("theme-option-nord-green");
		expect(getByTestId("theme-active-nord-green")).toBeInTheDocument();
	});

	it("updates the store and persists when an option is selected", async () => {
		const { getByTestId, findByTestId } = render(<ThemeSwitcher />);
		openMenu(getByTestId("theme-switcher"));
		const dracula = await findByTestId("theme-option-dracula");
		fireEvent.click(dracula);
		expect(themeStore.state.slug).toBe("dracula");
		expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dracula");
	});

	it("updates the trigger label after a selection", async () => {
		const { getByTestId, findByTestId } = render(<ThemeSwitcher />);
		openMenu(getByTestId("theme-switcher"));
		const tokyo = await findByTestId("theme-option-tokyo-night");
		fireEvent.click(tokyo);
		expect(getByTestId("theme-switcher").textContent).toContain("Tokyo Night");
	});
});
