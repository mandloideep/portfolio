import { Store } from "@tanstack/store";
import { pickQuip, type Quip } from "#/content/quips";

/**
 * One quip per day, shared across every consumer (hero, footer, terminal,
 * chat). Seeded by the current UTC date so SSR and CSR agree — using
 * `Math.random()` here caused a hydration mismatch because the server and
 * the client picked different quips. `rerollQuip()` still bumps to a new
 * pick on demand for interactive UI.
 */
function dailySeed(): number {
	const d = new Date();
	return (
		d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate()
	);
}

export const quipStore = new Store<{ current: Quip }>({
	current: pickQuip(dailySeed()),
});

export function rerollQuip(): void {
	quipStore.setState(() => ({
		current: pickQuip(Math.random() * 1e9),
	}));
}
