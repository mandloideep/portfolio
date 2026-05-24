import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { terminalStore } from "#/store/terminal";

const navigateMock = vi.fn();
vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => navigateMock,
}));

// Import after mock so the hook resolves to the mocked navigate.
import { useSubmit } from "./use-submit";

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

function lastBlock() {
	const blocks = terminalStore.state.blocks;
	return blocks[blocks.length - 1];
}

describe("useSubmit — agent mode (existing)", () => {
	it("emits the phase-6 placeholder for free text", async () => {
		const { result } = renderHook(() => useSubmit());
		await act(async () => {
			await result.current("hello there");
		});
		expect(lastBlock()?.kind).toBe("system");
		expect((lastBlock() as { text: string }).text).toMatch(/phase 6/i);
	});

	it("runs slash commands in agent mode", async () => {
		const { result } = renderHook(() => useSubmit());
		await act(async () => {
			await result.current("/clear");
		});
		expect(terminalStore.state.blocks).toEqual([]);
	});
});

describe("useSubmit — shell mode", () => {
	beforeEach(() => {
		terminalStore.setState((s) => ({ ...s, mode: "shell" }));
	});

	it("dispatches to shell command registry", async () => {
		const { result } = renderHook(() => useSubmit());
		await act(async () => {
			await result.current("whoami");
		});
		expect(lastBlock()).toMatchObject({ kind: "output", text: "deep" });
	});

	it("`deep` flips back to agent mode and emits a system block", async () => {
		const { result } = renderHook(() => useSubmit());
		await act(async () => {
			await result.current("deep");
		});
		expect(terminalStore.state.mode).toBe("agent");
		expect(lastBlock()?.kind).toBe("system");
	});

	it("`claude` also flips back to agent mode", async () => {
		const { result } = renderHook(() => useSubmit());
		await act(async () => {
			await result.current("claude");
		});
		expect(terminalStore.state.mode).toBe("agent");
	});

	it("`open ui` navigates to /", async () => {
		const { result } = renderHook(() => useSubmit());
		await act(async () => {
			await result.current("open ui");
		});
		expect(navigateMock).toHaveBeenCalledWith({ to: "/" });
	});

	it("slash commands in shell mode are command-not-found", async () => {
		const { result } = renderHook(() => useSubmit());
		await act(async () => {
			await result.current("/help");
		});
		expect(lastBlock()).toMatchObject({
			kind: "error",
			text: expect.stringContaining("command not found"),
		});
	});
});
