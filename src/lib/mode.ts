/**
 * Mode chooser persistence helpers. Pure — no I/O, no globals — so the
 * chooser route and its tests can both rely on these.
 */

export const MODE_STORAGE_KEY = "portfolio.mode";

export type Mode = "ui" | "terminal" | "chat";

const MODES: readonly Mode[] = ["ui", "terminal", "chat"] as const;

export function isMode(value: unknown): value is Mode {
	return (
		typeof value === "string" && (MODES as readonly string[]).includes(value)
	);
}

export function getStoredMode(storage: Pick<Storage, "getItem">): Mode | null {
	try {
		const raw = storage.getItem(MODE_STORAGE_KEY);
		return isMode(raw) ? raw : null;
	} catch {
		return null;
	}
}

export function setStoredMode(
	storage: Pick<Storage, "setItem">,
	mode: Mode,
): void {
	try {
		storage.setItem(MODE_STORAGE_KEY, mode);
	} catch {
		// best-effort
	}
}
