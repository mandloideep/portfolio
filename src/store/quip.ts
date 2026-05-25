import { Store } from "@tanstack/store";
import { pickQuip, type Quip } from "#/content/quips";

/**
 * One quip per page load, shared across every consumer (hero, footer, ...).
 * Initialized at module load with a fresh random pick — re-rolls on hard
 * refresh, stays stable within a session.
 */
export const quipStore = new Store<{ current: Quip }>({
	current: pickQuip(Math.random() * 1e9),
});

export function rerollQuip(): void {
	quipStore.setState(() => ({
		current: pickQuip(Math.random() * 1e9),
	}));
}
