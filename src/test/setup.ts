import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// jsdom doesn't ship ResizeObserver; Magic UI's AnimatedGridPattern needs it.
class ResizeObserverStub {
	observe() {}
	unobserve() {}
	disconnect() {}
}
if (!("ResizeObserver" in globalThis)) {
	(
		globalThis as unknown as { ResizeObserver: typeof ResizeObserverStub }
	).ResizeObserver = ResizeObserverStub;
}

// jsdom doesn't implement scrollIntoView; tests can still spy on it via the
// prototype now that it exists.
if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
	Element.prototype.scrollIntoView = vi.fn();
}

// Radix popper-style primitives (DropdownMenu, Select, Popover) call pointer
// capture APIs on the trigger; jsdom doesn't implement them. Stub them in so
// dropdowns can open under tests.
if (typeof Element !== "undefined") {
	if (!Element.prototype.hasPointerCapture) {
		Element.prototype.hasPointerCapture = () => false;
	}
	if (!Element.prototype.setPointerCapture) {
		Element.prototype.setPointerCapture = () => {};
	}
	if (!Element.prototype.releasePointerCapture) {
		Element.prototype.releasePointerCapture = () => {};
	}
}

afterEach(() => {
	cleanup();
	window.localStorage.clear();
});
