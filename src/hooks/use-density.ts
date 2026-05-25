import { useStore } from "@tanstack/react-store";
import { useEffect } from "react";
import { type Density, densityStore } from "#/store/density";

/**
 * Applies the active density to <html data-density="..."> so the global
 * `--ui-scale` rule in styles.css picks it up. Returns the current value
 * for consumers that want to render a UI control.
 */
export function useDensity(): Density {
	const density = useStore(densityStore, (s) => s.value);

	useEffect(() => {
		if (typeof document === "undefined") return;
		document.documentElement.setAttribute("data-density", density);
	}, [density]);

	return density;
}
