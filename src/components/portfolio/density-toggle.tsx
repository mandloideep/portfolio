import { useStore } from "@tanstack/react-store";
import { Minus, Plus } from "lucide-react";
import { cn } from "#/lib/utils";
import {
	DENSITIES,
	type Density,
	densityStore,
	setDensity,
} from "#/store/density";

/**
 * Compact +/- button pair that walks through the four density steps:
 * compact → cozy → comfy → roomy. Reflects the active step beneath as
 * a one-letter glyph. Persists via the density store.
 */
export function DensityToggle({ className }: { className?: string }) {
	const current = useStore(densityStore, (s) => s.value);
	const index = DENSITIES.indexOf(current);

	function step(delta: number) {
		const next =
			DENSITIES[Math.max(0, Math.min(DENSITIES.length - 1, index + delta))];
		if (next) setDensity(next);
	}

	const label: Record<Density, string> = {
		compact: "S",
		cozy: "M",
		comfy: "L",
		roomy: "XL",
	};

	return (
		<div
			data-testid="density-toggle"
			data-density={current}
			className={cn(
				"inline-flex items-center gap-0.5 rounded-md border border-border/70 bg-bg/40 p-0.5 font-mono text-meta text-muted",
				className,
			)}
		>
			<button
				type="button"
				aria-label="Decrease UI size"
				data-testid="density-down"
				onClick={() => step(-1)}
				disabled={index === 0}
				className="inline-flex h-6 w-6 items-center justify-center rounded-sm transition-colors duration-base hover:text-accent disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			>
				<Minus className="h-3 w-3" aria-hidden="true" />
			</button>
			<span aria-live="polite" className="min-w-6 text-center text-fg/90">
				{label[current]}
			</span>
			<button
				type="button"
				aria-label="Increase UI size"
				data-testid="density-up"
				onClick={() => step(1)}
				disabled={index === DENSITIES.length - 1}
				className="inline-flex h-6 w-6 items-center justify-center rounded-sm transition-colors duration-base hover:text-accent disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			>
				<Plus className="h-3 w-3" aria-hidden="true" />
			</button>
		</div>
	);
}
