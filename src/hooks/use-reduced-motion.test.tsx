import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useReducedMotion } from "./use-reduced-motion";

type Listener = (e: MediaQueryListEvent) => void;

function mockMatchMedia(reduced: boolean) {
	const listeners: Listener[] = [];
	const mql = {
		matches: reduced,
		media: "(prefers-reduced-motion: reduce)",
		onchange: null,
		addEventListener: (_: string, fn: Listener) => listeners.push(fn),
		removeEventListener: (_: string, fn: Listener) => {
			const i = listeners.indexOf(fn);
			if (i >= 0) listeners.splice(i, 1);
		},
		addListener: vi.fn(),
		removeListener: vi.fn(),
		dispatchEvent: vi.fn(),
	};
	Object.defineProperty(window, "matchMedia", {
		writable: true,
		configurable: true,
		value: vi.fn().mockImplementation(() => mql),
	});
	return { mql, listeners };
}

beforeEach(() => {
	mockMatchMedia(false);
});

describe("useReducedMotion", () => {
	it("returns false when no preference is set", () => {
		mockMatchMedia(false);
		const { result } = renderHook(() => useReducedMotion());
		expect(result.current).toBe(false);
	});

	it("returns true when the user prefers reduced motion", () => {
		mockMatchMedia(true);
		const { result } = renderHook(() => useReducedMotion());
		expect(result.current).toBe(true);
	});
});
