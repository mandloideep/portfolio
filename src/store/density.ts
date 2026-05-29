import { Store } from "@tanstack/store";

export const DENSITY_STORAGE_KEY = "portfolio.density";

export const DENSITIES = ["compact", "cozy", "comfy", "roomy"] as const;
export type Density = (typeof DENSITIES)[number];

export const DEFAULT_DENSITY: Density = "cozy";

function isDensity(v: unknown): v is Density {
	return typeof v === "string" && (DENSITIES as readonly string[]).includes(v);
}

function readInitial(): { value: Density } {
	if (typeof window === "undefined") return { value: DEFAULT_DENSITY };
	try {
		const raw = window.localStorage.getItem(DENSITY_STORAGE_KEY);
		if (isDensity(raw)) return { value: raw };
	} catch {
		// localStorage may throw in restricted contexts.
	}
	return { value: DEFAULT_DENSITY };
}

export const densityStore = new Store(readInitial());

export function setDensity(value: Density): void {
	if (!isDensity(value)) return;
	densityStore.setState(() => ({ value }));
	if (typeof window !== "undefined") {
		try {
			window.localStorage.setItem(DENSITY_STORAGE_KEY, value);
		} catch {
			// best-effort persistence
		}
	}
}
