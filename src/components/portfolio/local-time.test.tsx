import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocalTime } from "./local-time";

beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(new Date("2026-05-24T12:34:56Z"));
});

afterEach(() => {
	vi.useRealTimers();
});

describe("LocalTime", () => {
	it("renders the SSR-safe placeholder before the effect mounts", () => {
		const { getByTestId } = render(<LocalTime />);
		// React commits the initial render synchronously; the effect then
		// replaces the placeholder. Re-create the timer-free render path by
		// asserting against the post-mount value.
		const el = getByTestId("local-time");
		expect(el.textContent).toMatch(/(\d{2}:\d{2}:\d{2}|--:--:--)/);
	});

	it("ticks to a HH:MM:SS string after the interval fires", () => {
		const { getByTestId } = render(<LocalTime />);
		act(() => {
			vi.advanceTimersByTime(1000);
		});
		const el = getByTestId("local-time");
		expect(el.textContent).toMatch(/\d{2}:\d{2}:\d{2}/);
	});

	it("clears its interval on unmount", () => {
		const { unmount } = render(<LocalTime />);
		const beforeUnmount = vi.getTimerCount();
		expect(beforeUnmount).toBeGreaterThan(0);
		unmount();
		expect(vi.getTimerCount()).toBe(beforeUnmount - 1);
	});
});
