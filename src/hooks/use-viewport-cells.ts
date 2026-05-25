import { useEffect, useState } from "react";

const COL_PX = 9; // approx mono char width at body size
const ROW_PX = 18; // approx mono line height

/**
 * Returns viewport dimensions expressed as terminal columns × rows.
 * Updates on resize. SSR-safe: initial value is the default 80×24, then
 * overwritten on mount.
 */
export function useViewportCells(): { cols: number; rows: number } {
	const [cells, setCells] = useState({ cols: 80, rows: 24 });

	useEffect(() => {
		if (typeof window === "undefined") return;
		function measure() {
			setCells({
				cols: Math.max(40, Math.round(window.innerWidth / COL_PX)),
				rows: Math.max(12, Math.round(window.innerHeight / ROW_PX)),
			});
		}
		measure();
		window.addEventListener("resize", measure);
		return () => window.removeEventListener("resize", measure);
	}, []);

	return cells;
}
