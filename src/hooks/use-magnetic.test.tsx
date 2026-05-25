import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useMagnetic } from "./use-magnetic";

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

function Target() {
	const ref = useMagnetic<HTMLButtonElement>();
	return (
		<button
			ref={ref}
			type="button"
			data-testid="magnet"
			style={{ width: 100, height: 40 }}
		>
			ok
		</button>
	);
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe("useMagnetic", () => {
	beforeEach(() => {
		mockMatchMedia(false);
	});

	it("marks the element as on under normal motion", () => {
		const { getByTestId } = render(<Target />);
		const el = getByTestId("magnet") as HTMLButtonElement;
		expect(el.dataset.magnetic).toBe("on");
	});

	it("translates within ±8px on pointer move", () => {
		const { getByTestId } = render(<Target />);
		const el = getByTestId("magnet") as HTMLButtonElement;
		// Fake the bounding rect so the computation has a known center.
		el.getBoundingClientRect = () =>
			({
				left: 0,
				top: 0,
				right: 100,
				bottom: 40,
				width: 100,
				height: 40,
				x: 0,
				y: 0,
				toJSON: () => ({}),
			}) as DOMRect;

		act(() => {
			// Pointer far to the right; expected dx is clamped at +8.
			el.dispatchEvent(
				new PointerEvent("pointermove", {
					clientX: 9999,
					clientY: 20,
					bubbles: true,
				}),
			);
		});
		const match = el.style.transform.match(
			/translate3d\((-?\d+(?:\.\d+)?)px, (-?\d+(?:\.\d+)?)px, 0\)/,
		);
		expect(match).not.toBeNull();
		const dx = Number(match?.[1]);
		const dy = Number(match?.[2]);
		expect(Math.abs(dx)).toBeLessThanOrEqual(8);
		expect(Math.abs(dy)).toBeLessThanOrEqual(8);
	});

	it("resets transform on pointerleave", () => {
		const { getByTestId } = render(<Target />);
		const el = getByTestId("magnet") as HTMLButtonElement;
		el.getBoundingClientRect = () =>
			({
				left: 0,
				top: 0,
				right: 100,
				bottom: 40,
				width: 100,
				height: 40,
				x: 0,
				y: 0,
				toJSON: () => ({}),
			}) as DOMRect;
		act(() => {
			el.dispatchEvent(
				new PointerEvent("pointermove", {
					clientX: 80,
					clientY: 30,
					bubbles: true,
				}),
			);
			el.dispatchEvent(new PointerEvent("pointerleave", { bubbles: true }));
		});
		// jsdom normalizes zero-px translations by dropping the unit.
		expect(el.style.transform).toMatch(
			/^translate3d\(0(?:px)?, 0(?:px)?, 0\)$/,
		);
	});

	it("no-ops under reduced motion (data-magnetic=off, no transform)", () => {
		mockMatchMedia(true);
		const { getByTestId } = render(<Target />);
		const el = getByTestId("magnet") as HTMLButtonElement;
		expect(el.dataset.magnetic).toBe("off");
		act(() => {
			el.dispatchEvent(
				new PointerEvent("pointermove", {
					clientX: 50,
					clientY: 20,
					bubbles: true,
				}),
			);
		});
		expect(el.style.transform).toBe("");
	});
});
