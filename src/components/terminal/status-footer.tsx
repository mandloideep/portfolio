import { useStore } from "@tanstack/react-store";
import { useEffect } from "react";
import { ModelSwitcher } from "#/components/agent/model-switcher";
import { QuotaIndicator } from "#/components/agent/quota-indicator";
import { themes } from "#/content/themes";
import { useQuip } from "#/hooks/use-quip";
import { modelStore } from "#/store/model";
import { setQuota } from "#/store/quota";
import { terminalStore } from "#/store/terminal";
import { themeStore } from "#/store/theme";

/**
 * Persistent bottom strip inside the terminal chrome window. Surfaces the
 * pieces of state the user is most likely to forget: prompt mode, active
 * theme, current agent model (now a clickable popover trigger), and the
 * tier-aware quota chip (`∞` for free Gemma, `N/cap` for premium).
 *
 * The model + quota slots come from the shared agent primitives so the
 * chat surface gets the same chrome for free.
 */
export function StatusFooter() {
	const themeSlug = useStore(themeStore, (s) => s.slug);
	const mode = useStore(terminalStore, (s) => s.mode);
	const activeModelId = useStore(modelStore, (s) => s.activeModel);
	const themeName = themes.find((t) => t.slug === themeSlug)?.name ?? themeSlug;
	const quip = useQuip();

	// Paint the initial quota chip on mount. Subsequent updates flow
	// through the engine's SSE `quota` events.
	useEffect(() => {
		let cancelled = false;
		const params = new URLSearchParams({ model: activeModelId });
		fetch(`/api/agent/quota?${params.toString()}`, { cache: "no-store" })
			.then((r) => (r.ok ? r.json() : null))
			.then(
				(
					data: {
						remaining?: number | null;
						limit?: number | null;
						unlimited?: boolean;
						tier?: "free" | "premium";
						resetsAt?: string | null;
					} | null,
				) => {
					if (cancelled || !data) return;
					setQuota({
						remaining: data.remaining ?? null,
						unlimited: data.unlimited === true,
						tier: data.tier ?? "free",
						limit: typeof data.limit === "number" ? data.limit : 0,
						resetsAt: data.resetsAt ?? null,
					});
				},
			)
			.catch(() => {});
		return () => {
			cancelled = true;
		};
	}, [activeModelId]);

	return (
		<div
			data-testid="status-footer"
			className="flex items-center justify-between gap-3 border-t border-border bg-bg-elev/95 px-4 py-2.5 font-mono text-meta uppercase tracking-tab text-muted [font-variant-numeric:tabular-nums]"
		>
			<div className="flex items-center gap-2.5 min-w-0">
				<span className="rounded-chip border border-border/70 bg-bg/60 px-1.5 py-0.5 font-semibold tracking-tab text-fg/90">
					{mode}
				</span>
				<span className="select-none text-muted/40" aria-hidden="true">
					|
				</span>
				<span className="truncate" data-testid="status-theme">
					<span className="text-muted/70">theme/</span>
					<span className="text-fg/90">{themeName}</span>
				</span>
			</div>
			{quip ? (
				<p
					data-testid="status-quip"
					className="hidden flex-1 items-baseline justify-center gap-2 min-w-0 italic normal-case tracking-normal md:flex"
				>
					<span aria-hidden="true" className="not-italic text-accent">
						$
					</span>
					<span className="truncate">{quip}</span>
				</p>
			) : null}
			<div className="flex items-center gap-2.5 min-w-0">
				<span className="select-none text-muted/40" aria-hidden="true">
					|
				</span>
				<ModelSwitcher variant="footer" />
				<span className="select-none text-muted/40" aria-hidden="true">
					|
				</span>
				<QuotaIndicator />
			</div>
		</div>
	);
}
