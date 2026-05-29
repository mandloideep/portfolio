import { useSyncExternalStore } from "react";

const QUERY = "(max-width: 639px)";

function subscribe(callback: () => void) {
	if (typeof window === "undefined" || !window.matchMedia) return () => {};
	const mql = window.matchMedia(QUERY);
	mql.addEventListener("change", callback);
	return () => mql.removeEventListener("change", callback);
}

function getSnapshot() {
	if (typeof window === "undefined" || !window.matchMedia) return false;
	return window.matchMedia(QUERY).matches;
}

function getServerSnapshot() {
	return false;
}

export function useIsMobile(): boolean {
	return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
