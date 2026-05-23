import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { themeStore } from "#/store/theme";
import { useTheme } from "./use-theme";

beforeEach(() => {
	window.localStorage.clear();
	themeStore.setState(() => ({ slug: "nord-green" }));
	document.documentElement.removeAttribute("data-theme");
});

function Probe() {
	const { theme } = useTheme();
	return <span data-testid="probe">{theme}</span>;
}

describe("useTheme", () => {
	it("renders the current slug", () => {
		const { getByTestId } = render(<Probe />);
		expect(getByTestId("probe").textContent).toBe("nord-green");
	});

	it("sets data-theme on the html element", () => {
		render(<Probe />);
		expect(document.documentElement.dataset.theme).toBe("nord-green");
	});

	it("re-renders and updates data-theme when the store changes", () => {
		const { getByTestId } = render(<Probe />);
		act(() => {
			themeStore.setState(() => ({ slug: "dracula" }));
		});
		expect(getByTestId("probe").textContent).toBe("dracula");
		expect(document.documentElement.dataset.theme).toBe("dracula");
	});
});
