import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { AgentTestWrapper } from "#/components/agent/test-utils";
import { setMode, terminalStore } from "#/store/terminal";
import { setTheme, themeStore } from "#/store/theme";
import { StatusFooter } from "./status-footer";

beforeEach(() => {
	window.localStorage.clear();
	themeStore.setState(() => ({ slug: "nord-green" }));
	terminalStore.setState((s) => ({ ...s, mode: "agent" }));
});

describe("StatusFooter", () => {
	it("renders the active theme + prompt mode", () => {
		const { getByTestId } = render(<StatusFooter />, {
			wrapper: AgentTestWrapper,
		});
		expect(getByTestId("status-theme").textContent).toMatch(/Nord Green/);
		expect(getByTestId("status-footer").textContent).toMatch(/agent/i);
	});

	it("updates when theme changes", () => {
		const { getByTestId } = render(<StatusFooter />, {
			wrapper: AgentTestWrapper,
		});
		act(() => {
			setTheme("dracula");
		});
		expect(getByTestId("status-theme").textContent).toMatch(/Dracula/);
	});

	it("updates when mode flips", () => {
		const { getByTestId } = render(<StatusFooter />, {
			wrapper: AgentTestWrapper,
		});
		act(() => {
			setMode("shell");
		});
		expect(getByTestId("status-footer").textContent).toMatch(/shell/i);
	});
});
