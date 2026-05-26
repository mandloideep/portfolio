/**
 * <IconButton> — square icon-only button for non-labelled affordances:
 * send / stop, menu / settings triggers, dismiss / close, etc.
 *
 * Sibling of <ChromeButton>. The two split by use case, not by visual:
 *   ChromeButton — labelled chrome chip (icon + text, breakpoint-aware)
 *   IconButton   — square icon-only tap target (single icon, no text)
 *
 * Explicit `size` / `shape` / `tone` / `as` variants (composition-
 * patterns: patterns-explicit-variants). Density-compliant: every size
 * is rem-based so --ui-scale rescales the whole family. Theme-compliant:
 * every colour comes from a registry token.
 *
 * Sizes
 *   sm    — 32 px (8 rem-units) compact desktop control.
 *   md    — 36 px (9 rem-units) standard.
 *   lg    — 40 px (10 rem-units) mobile-only or large tap target.
 *   touch — 40 px on mobile, 32 px on desktop (sm:size-8). Default for
 *           send/stop pairs that need a thumb-friendly mobile target but
 *           tighten on desktop where the layout is mouse-driven.
 *
 * Shapes
 *   pill — rounded-pill (perfect circle); accent action affordance.
 *   card — rounded-card (soft rectangle); chrome trigger / drawer toggle.
 *
 * Tones
 *   default     — bordered chrome icon (menu / settings triggers).
 *   accent      — filled accent action (send arrow, primary).
 *   destructive — bordered + error hover (stop / cancel).
 *   ghost       — no frame; hover lights up the accent.
 */

import { Link, type LinkProps } from "@tanstack/react-router";
import type {
	AnchorHTMLAttributes,
	ButtonHTMLAttributes,
	ReactNode,
} from "react";
import { cn } from "#/lib/utils";

export type IconButtonSize = "sm" | "md" | "lg" | "touch";
export type IconButtonShape = "pill" | "card";
export type IconButtonTone = "default" | "accent" | "destructive" | "ghost";

type CommonProps = {
	size?: IconButtonSize;
	shape?: IconButtonShape;
	tone?: IconButtonTone;
	className?: string;
	children: ReactNode;
};

type ButtonVariant = CommonProps &
	Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
		as?: "button";
	};
type AnchorVariant = CommonProps &
	Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children"> & {
		as: "a";
		href: string;
	};
type LinkVariant = CommonProps &
	Omit<LinkProps, "children"> & { as: "link" };

export type IconButtonProps = ButtonVariant | AnchorVariant | LinkVariant;

const BASE =
	"relative z-0 inline-flex shrink-0 items-center justify-center transition-colors duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

const SIZE: Record<IconButtonSize, string> = {
	sm: "size-8",
	md: "size-9",
	lg: "size-10",
	touch: "size-10 sm:size-8",
};

const SHAPE: Record<IconButtonShape, string> = {
	pill: "rounded-pill",
	card: "rounded-card",
};

const TONE: Record<IconButtonTone, string> = {
	default:
		"border border-border/70 bg-bg/40 text-fg hover:bg-accent/10 hover:text-accent",
	accent:
		"bg-accent text-bg transition-transform hover:scale-105 focus-visible:scale-105",
	destructive:
		"border border-border bg-bg-elev text-muted hover:border-error hover:text-error focus-visible:border-error focus-visible:text-error",
	ghost: "text-muted hover:text-accent",
};

export function IconButton(props: IconButtonProps) {
	const {
		size = "md",
		shape = "card",
		tone = "default",
		className,
		children,
		...rest
	} = props as IconButtonProps & { as?: "button" | "a" | "link" };

	const classes = cn(BASE, SIZE[size], SHAPE[shape], TONE[tone], className);

	if (rest.as === "link") {
		const { as: _as, ...linkRest } = rest;
		return (
			<Link {...(linkRest as LinkProps)} className={classes}>
				{children}
			</Link>
		);
	}
	if (rest.as === "a") {
		const { as: _as, ...anchorRest } = rest;
		return (
			<a
				{...(anchorRest as AnchorHTMLAttributes<HTMLAnchorElement>)}
				className={classes}
			>
				{children}
			</a>
		);
	}
	const { as: _as, ...buttonRest } = rest;
	return (
		<button
			type="button"
			{...(buttonRest as ButtonHTMLAttributes<HTMLButtonElement>)}
			className={classes}
		>
			{children}
		</button>
	);
}
