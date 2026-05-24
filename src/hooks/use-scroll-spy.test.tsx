import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useScrollSpy } from "./use-scroll-spy";

type Callback = (entries: Array<Partial<IntersectionObserverEntry>>) => void;

let lastCallback: Callback | null = null;
const observed: Element[] = [];

class MockIO {
	cb: Callback;
	constructor(cb: Callback) {
		this.cb = cb;
		lastCallback = cb;
	}
	observe(el: Element) {
		observed.push(el);
	}
	unobserve() {}
	disconnect() {}
	takeRecords() {
		return [];
	}
	root = null;
	rootMargin = "";
	thresholds = [];
}

beforeEach(() => {
	lastCallback = null;
	observed.length = 0;
	(
		globalThis as unknown as { IntersectionObserver: typeof MockIO }
	).IntersectionObserver = MockIO;

	for (const id of ["a", "b", "c"]) {
		const el = document.createElement("section");
		el.id = id;
		document.body.appendChild(el);
	}
});

afterEach(() => {
	document.body.innerHTML = "";
});

function fire(id: string, isIntersecting: boolean) {
	const target = document.getElementById(id);
	if (!target) throw new Error(`missing #${id}`);
	lastCallback?.([{ target, isIntersecting }]);
}

describe("useScrollSpy", () => {
	it("seeds the active id from the first id in the list", () => {
		const { result } = renderHook(() => useScrollSpy(["a", "b", "c"]));
		expect(result.current).toBe("a");
	});

	it("updates active id when sections intersect", () => {
		const { result } = renderHook(() => useScrollSpy(["a", "b", "c"]));
		act(() => fire("b", true));
		expect(result.current).toBe("b");
	});

	it("prefers the first id (in document order) when multiple are visible", () => {
		const { result } = renderHook(() => useScrollSpy(["a", "b", "c"]));
		act(() => {
			fire("b", true);
			fire("c", true);
		});
		expect(result.current).toBe("b");
		act(() => fire("a", true));
		expect(result.current).toBe("a");
	});
});
