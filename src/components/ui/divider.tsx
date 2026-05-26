/**
 * <Divider> — token-driven horizontal rule used to separate sections in
 * portfolio routes, modal bodies, and any list / list-of-lists layout.
 *
 * Two tones (composition-patterns: patterns-explicit-variants):
 *   default — `border-border/60`, full opacity strong enough to read as
 *             a hard section break.
 *   soft    — `border-border/40`, used between rows inside the same
 *             section so the eye doesn't catch on the rule.
 *
 * Pair with <RuleAccent> when you want a gradient flourish above a
 * section. Use <Divider> for plain horizontal separation.
 */

import type { HTMLAttributes } from "react";
import { cn } from "#/lib/utils";

export type DividerTone = "default" | "soft";

const TONE: Record<DividerTone, string> = {
	default: "border-border/60",
	soft: "border-border/40",
};

type Props = HTMLAttributes<HTMLHRElement> & {
	tone?: DividerTone;
};

export function Divider({ tone = "default", className, ...rest }: Props) {
	return (
		<hr
			{...rest}
			className={cn("h-px border-0 border-t", TONE[tone], className)}
		/>
	);
}
