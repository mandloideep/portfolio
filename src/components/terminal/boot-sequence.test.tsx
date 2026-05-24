import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { terminalStore } from "#/store/terminal";
import { BootSequence } from "./boot-sequence";

beforeEach(() => {
	terminalStore.setState(() => ({
		blocks: [],
		history: [],
		historyCursor: null,
		mode: "agent",
		booted: false,
		cwd: "~",
	}));
	vi.useFakeTimers();
	mockMatchMedia(false);
});

afterEach(() => {
	vi.useRealTimers();
});

function mockMatchMedia(reduced: boolean) {
	Object.defineProperty(window, "matchMedia", {
		writable: true,
		configurable: true,
		value: vi.fn().mockImplementation((query: string) => ({
			matches: reduced && query.includes("reduced"),
			media: query,
			onchange: null,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			addListener: vi.fn(),
			removeListener: vi.fn(),
			dispatchEvent: vi.fn(),
		})),
	});
}

describe("BootSequence", () => {
	it("emits banner + 6 staggered system blocks then flips booted=true", () => {
		render(<BootSequence />);
		// Banner appears synchronously.
		expect(terminalStore.state.blocks.length).toBe(1);
		act(() => {
			vi.advanceTimersByTime(400);
		});
		expect(terminalStore.state.blocks.length).toBe(1 + 6);
		expect(terminalStore.state.booted).toBe(true);
	});

	it("does nothing when already booted", () => {
		terminalStore.setState((s) => ({ ...s, booted: true }));
		render(<BootSequence />);
		expect(terminalStore.state.blocks.length).toBe(0);
	});

	it("collapses to instant under reduced motion", () => {
		mockMatchMedia(true);
		render(<BootSequence />);
		// All 7 blocks land in the same tick.
		expect(terminalStore.state.blocks.length).toBe(1 + 6);
		expect(terminalStore.state.booted).toBe(true);
	});

	it("returns null", () => {
		const { container } = render(<BootSequence />);
		expect(container.firstChild).toBeNull();
	});
});
