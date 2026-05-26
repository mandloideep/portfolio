/**
 * <QuotaIndicator> — tier-aware quota display.
 *
 * No `variant` boolean. The component reads `quotaStore.tier` and picks the
 * right inner variant: free → `∞`, premium → `N/cap`, unknown → `?/?`.
 * Surfaces compose this once and trust the store to drive it.
 *
 * Tokens: bg-bg-elev, text-fg, text-muted, text-accent, border-border.
 */

import { useStore } from "@tanstack/react-store";
import { cn } from "#/lib/utils";
import { type QuotaState, quotaStore } from "#/store/quota";

export function QuotaIndicator({
	className,
	title,
}: {
	className?: string;
	title?: string;
}) {
	const quota = useStore(quotaStore);

	const label = quota.tier === "premium" ? "premium/" : "msgs/";
	const tooltip =
		title ??
		(quota.tier === "premium"
			? "premium messages used / capped per visitor"
			: quota.tier === "free" && quota.unlimited
				? "free Gemma — only the shared per-minute quota applies"
				: "messages remaining in your daily quota");

	return (
		<span
			className={cn("truncate", className)}
			data-testid="status-quota"
			title={tooltip}
		>
			<span className="text-muted/70">{label}</span>
			<span className={valueClass(quota)}>{valueText(quota)}</span>
		</span>
	);
}

function valueText(quota: QuotaState): string {
	if (quota.unlimited) return "∞";
	if (quota.tier === "premium") {
		if (quota.remaining === null) return `?/${quota.limit || "?"}`;
		const used = Math.max(0, quota.limit - quota.remaining);
		return `${used}/${quota.limit}`;
	}
	if (quota.remaining === null) {
		return quota.limit > 0 ? `?/${quota.limit}` : "?";
	}
	return `${quota.remaining}/${quota.limit}`;
}

function valueClass(quota: QuotaState): string {
	if (quota.unlimited) return "text-fg/90";
	if (quota.remaining === null) return "text-fg/60";
	if (quota.tier === "premium") {
		if (quota.remaining === 0) return "text-error";
		if (quota.remaining <= 1) return "text-accent-alt";
		return "text-fg/90";
	}
	if (quota.remaining === 0) return "text-error";
	if (quota.remaining <= 1) return "text-accent-alt";
	return "text-fg/90";
}
