import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { terminalStore } from "#/store/terminal";

const navigateMock = vi.fn();
vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => navigateMock,
}));

import { AgentTestWrapper } from "#/components/agent/test-utils";
import { MobileQuickChips } from "./mobile-quick-chips";

beforeEach(() => {
	window.localStorage.clear();
	terminalStore.setState(() => ({
		blocks: [],
		history: [],
		historyCursor: null,
		mode: "agent",
		booted: false,
		cwd: "~",
	}));
	navigateMock.mockReset();
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe("MobileQuickChips", () => {
	it("renders all four chips", () => {
		const { getByTestId } = render(<MobileQuickChips />, {
			wrapper: AgentTestWrapper,
		});
		expect(getByTestId("mobile-chip-me")).toHaveTextContent("/me");
		expect(getByTestId("mobile-chip-projects")).toHaveTextContent("/projects");
		expect(getByTestId("mobile-chip-help")).toHaveTextContent("/help");
		expect(getByTestId("mobile-chip-exit")).toHaveTextContent("/exit");
	});

	it("is hidden at sm+ via Tailwind responsive class", () => {
		const { getByTestId } = render(<MobileQuickChips />, {
			wrapper: AgentTestWrapper,
		});
		expect(getByTestId("mobile-quick-chips").className).toContain("sm:hidden");
	});

	it("uses type=button so a parent <form> would not submit by accident", () => {
		const { getByTestId } = render(<MobileQuickChips />, {
			wrapper: AgentTestWrapper,
		});
		for (const slug of ["me", "projects", "help", "exit"]) {
			const btn = getByTestId(`mobile-chip-${slug}`) as HTMLButtonElement;
			expect(btn.type).toBe("button");
		}
	});

	it("tapping a chip submits the command (appends a prompt block)", async () => {
		const { getByTestId } = render(<MobileQuickChips />, {
			wrapper: AgentTestWrapper,
		});
		await act(async () => {
			fireEvent.click(getByTestId("mobile-chip-help"));
		});
		const first = terminalStore.state.blocks[0];
		expect(first?.kind).toBe("prompt");
		expect(first && "text" in first && first.text).toBe("/help");
		expect(terminalStore.state.history).toEqual(["/help"]);
	});
});
