import { useStore } from "@tanstack/react-store";
import { Minus, Plus } from "lucide-react";
import { ChromeButtonGroup } from "#/components/ui/chrome-button";
import { cn } from "#/lib/utils";
import {
	DENSITIES,
	type Density,
	densityStore,
	setDensity,
} from "#/store/density";

/**
 * Compact +/- segmented control that walks through the four density
 * steps: compact → cozy → comfy → roomy. The frame comes from the
 * shared <ChromeButtonGroup> so the resting height matches every other
 * chip in the chrome bar.
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
		<ChromeButtonGroup
			data-testid="density-toggle"
			data-density={current}
			className={cn("font-mono text-meta text-muted", className)}
		>
			<button
				type="button"
				aria-label="Decrease UI size"
				data-testid="density-down"
				onClick={() => step(-1)}
				disabled={index === 0}
				className="inline-flex size-5 items-center justify-center rounded-chip transition-colors duration-base hover:text-accent disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			>
				<Minus className="size-3" aria-hidden="true" />
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
				className="inline-flex size-5 items-center justify-center rounded-chip transition-colors duration-base hover:text-accent disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			>
				<Plus className="size-3" aria-hidden="true" />
			</button>
		</ChromeButtonGroup>
	);
}
