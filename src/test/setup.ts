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

afterEach(() => {
	cleanup();
	window.localStorage.clear();
});
