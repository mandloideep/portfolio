/**
 * <ModelTierChips> — three-segment chip group (M / L / XL) for fast tier
 * switching in the chat header.
 *
 * Tier → model mapping (matches src/lib/agent/models.ts ordering):
 *   M  → Gemma 4 26B fast        (fast, no reasoning)
 *   L  → Gemma 4 31B thinking    (reasoning traces, slower)
 *   XL → Gemini 2.5 Flash Lite   (premium, capped)
 *
 * Tiers whose model isn't available in the current env (no provider key)
 * are hidden so dev environments with only one provider configured still
 * see a coherent UI.
 */

import { useAgentSession } from "#/components/agent/agent-engine-provider";
import { ChatChip } from "#/components/chat/chat-chip";
import { cn } from "#/lib/utils";

type Tier = { key: "M" | "L" | "XL"; modelId: string; label: string };

const TIERS: ReadonlyArray<Tier> = [
	{ key: "M", modelId: "google/gemma-4-26b-a4b-it:free", label: "M" },
	{ key: "L", modelId: "gemma-4-31b-it", label: "L" },
	{ key: "XL", modelId: "gemini-2.5-flash-lite", label: "XL" },
];

const TIER_TITLE: Record<Tier["key"], string> = {
	M: "fast · Gemma 4 26B",
	L: "thinking · Gemma 4 31B",
	XL: "premium · Gemini 2.5 Flash Lite",
};

export function ModelTierChips({ className }: { className?: string }) {
	const { meta, actions } = useAgentSession();
	const availableIds = new Set(meta.availableModels.map((m) => m.id));
	const activeId = meta.activeModel.id;
	const tiers = TIERS.filter((t) => availableIds.has(t.modelId));
	if (tiers.length === 0) return null;

	return (
		<div
			data-testid="model-tier-chips"
			className={cn(
				"inline-flex h-8 items-center overflow-hidden rounded-pill border border-border/70 bg-bg-elev/70 shadow-sm",
				className,
			)}
			role="toolbar"
			aria-label="model tier"
		>
			{tiers.map((t, i) => {
				const isActive = t.modelId === activeId;
				return (
					<button
						key={t.key}
						type="button"
						title={TIER_TITLE[t.key]}
						aria-label={TIER_TITLE[t.key]}
						aria-pressed={isActive}
						data-testid={`model-tier-${t.key}`}
						onClick={() => actions.setModel(t.modelId)}
						className={cn(
							"inline-flex h-full items-center px-3 font-mono text-meta uppercase tracking-tab transition-colors duration-base focus-visible:outline-none focus-visible:bg-accent/10 focus-visible:text-accent",
							i > 0 && "border-l border-border/70",
							isActive
								? "bg-accent/10 text-accent"
								: "text-fg/80 hover:text-accent",
						)}
					>
						{t.label}
					</button>
				);
			})}
		</div>
	);
}
