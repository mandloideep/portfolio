import { Command } from "lucide-react";
import { useEffect, useState } from "react";
import { ChromeButton } from "#/components/ui/chrome-button";

type Props = {
	onOpen: () => void;
	className?: string;
};

/**
 * Visible "⌘K" / "Ctrl K" chip in the chrome bar. Clicking opens the
 * palette via the supplied callback; the chip is also a discovery
 * affordance so users learn the shortcut exists.
 *
 * Built on <ChromeButton size="sm" tone="muted"> so every chrome chip
 * shares the same shape across the portfolio, chat, and terminal.
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
		<ChromeButton
			size="sm"
			tone="muted"
			onClick={onOpen}
			data-testid="command-hint"
			aria-label="Open command palette"
			title="Open command palette"
			className={className}
		>
			<Command aria-hidden="true" className="size-3" />
			<span suppressHydrationWarning>{glyph === "mac" ? "⌘K" : "Ctrl K"}</span>
		</ChromeButton>
	);
}
