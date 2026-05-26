import { Command } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "#/lib/utils";

type Props = {
	onOpen: () => void;
	className?: string;
};

/**
 * Visible "⌘K" / "Ctrl K" chip in the chrome bar. Clicking opens the
 * palette via the supplied callback; the chip is also a discovery
 * affordance so users learn the shortcut exists.
 */
export function CommandHint({ onOpen, className }: Props) {
	const [glyph, setGlyph] = useState<"mac" | "other">("mac");

	useEffect(() => {
		// `navigator.userAgentData` is the modern API; `navigator.platform`
		// is the legacy fallback. Either way: render only on the client to
		// avoid SSR/CSR mismatch.
		const platform =
			(navigator as Navigator & { userAgentData?: { platform?: string } })
				.userAgentData?.platform ?? navigator.platform ?? "";
		setGlyph(/mac|iphone|ipod|ipad/i.test(platform) ? "mac" : "other");
	}, []);

	return (
		<button
			type="button"
			onClick={onOpen}
			data-testid="command-hint"
			aria-label="Open command palette"
			title="Open command palette"
			className={cn(
				"inline-flex items-center gap-1.5 rounded-chip border border-border/60 bg-bg/40 px-2 py-1 font-mono text-eyebrow uppercase tracking-tab text-muted/80 transition-colors duration-base hover:border-border hover:text-fg/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [font-variant-numeric:tabular-nums]",
				className,
			)}
		>
			<Command aria-hidden="true" className="size-3" />
			<span suppressHydrationWarning>{glyph === "mac" ? "⌘K" : "Ctrl K"}</span>
		</button>
	);
}
