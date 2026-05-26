/**
 * <ChatChip> — the single rounded-pill shape used by every widget in the
 * chat header (brand chip, M/L/XL group, model name, info button).
 *
 * Single source of truth keeps the chrome visually symmetric: same height,
 * same border, same bg, same mono uppercase tab-case typography. Explicit
 * `as` variant (composition-patterns: explicit-variants) — links use `a`,
 * actions use `button`. `active` controls the highlighted state for tier
 * chips. `tone="bare"` drops the border/bg so the chip can host a nested
 * chip group (e.g. the M/L/XL segment) without doubling the frame.
 */

import type {
	AnchorHTMLAttributes,
	ButtonHTMLAttributes,
	ReactNode,
} from "react";
import { cn } from "#/lib/utils";

type CommonProps = {
	children: ReactNode;
	className?: string;
	active?: boolean;
	tone?: "default" | "bare";
};

type ButtonProps = CommonProps &
	ButtonHTMLAttributes<HTMLButtonElement> & { as?: "button" };

type AnchorProps = CommonProps &
	AnchorHTMLAttributes<HTMLAnchorElement> & { as: "a" };

type ChatChipProps = ButtonProps | AnchorProps;

const BASE =
	"inline-flex h-8 items-center gap-1.5 px-3 font-mono text-meta uppercase tracking-tab transition-colors duration-base focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50";

const FRAMED =
	"rounded-pill border border-border/70 bg-bg-elev/70 text-fg/90 shadow-sm hover:border-accent/60 hover:text-accent";

const ACTIVE =
	"border-accent/60 bg-accent/10 text-accent shadow-[inset_0_0_0_1px_var(--color-accent)]";

export function ChatChip(props: ChatChipProps) {
	const { children, className, active, tone = "default", ...rest } = props;
	const classes = cn(
		BASE,
		tone === "default" && FRAMED,
		tone === "default" && active && ACTIVE,
		className,
	);

	if (props.as === "a") {
		const { as: _as, ...anchorRest } = rest as AnchorProps;
		return (
			<a className={classes} {...anchorRest}>
				{children}
			</a>
		);
	}
	const { as: _as, ...buttonRest } = rest as ButtonProps;
	return (
		<button type="button" className={classes} {...buttonRest}>
			{children}
		</button>
	);
}
