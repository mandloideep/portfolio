/**
 * <ChromeButton> — the single chip/button primitive used across every
 * chrome surface (portfolio top-tabs right slot, chat header, terminal
 * chrome, mobile chrome, command rail, status footer).
 *
 * Explicit `size` / `tone` / `as` variants (composition-patterns:
 * patterns-explicit-variants, architecture-avoid-boolean-props). No
 * forwardRef (react19-no-forwardref). All sizing is rem-based so
 * `--ui-scale` (density) rescales the whole family in lockstep, and
 * every colour comes from a registry token so theme swaps keep working.
 *
 * Sizes
 *   sm    — compact chip (⌘K, mode pills, footer chips). h-7, text-eyebrow.
 *   md    — desktop chrome chip (density, theme, model). h-9 sm:h-7, text-meta.
 *   touch — mobile tap target (mobile-chrome, command rail). h-10, text-meta.
 *
 * Tones
 *   default — interactive chrome chip; hover lights up the accent.
 *   muted   — resting/discovery chip (⌘K, status pills); hover settles to fg.
 *   accent  — selected/active state (selected theme, active tab segment).
 *   bare    — no border / no bg; for segmented children inside a
 *             <ChromeButtonGroup> frame.
 *
 * Render shape
 *   as="button" (default) | "a" | "link"
 *
 * Group helper
 *   <ChromeButtonGroup> wraps multiple bare children in a shared
 *   `border + bg-bg/40 + rounded-card` frame — used by DensityToggle and
 *   any future segmented control.
 */

import { Link, type LinkProps } from "@tanstack/react-router";
import type {
	AnchorHTMLAttributes,
	ButtonHTMLAttributes,
	HTMLAttributes,
	ReactNode,
} from "react";
import { cn } from "#/lib/utils";

export type ChromeButtonSize = "sm" | "md" | "touch";
export type ChromeButtonTone = "default" | "muted" | "accent" | "bare";

type CommonProps = {
	size?: ChromeButtonSize;
	tone?: ChromeButtonTone;
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

export type ChromeButtonProps = ButtonVariant | AnchorVariant | LinkVariant;

const BASE =
	"inline-flex items-center justify-center gap-1.5 rounded-chip border font-mono uppercase tracking-tab transition-colors duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

const SIZE: Record<ChromeButtonSize, string> = {
	sm: "h-7 px-2 text-eyebrow",
	md: "h-9 px-3 text-meta sm:h-7 sm:px-2.5",
	touch: "h-10 px-3 text-meta",
};

const TONE: Record<ChromeButtonTone, string> = {
	default:
		"border-border/60 bg-bg/40 text-muted hover:border-accent/40 hover:bg-accent/10 hover:text-accent",
	muted:
		"border-border/60 bg-bg/40 text-muted/80 hover:border-border hover:text-fg/90",
	accent: "border-accent/60 bg-accent/15 text-accent",
	bare: "border-transparent bg-transparent text-muted hover:text-accent",
};

export function ChromeButton(props: ChromeButtonProps) {
	const {
		size = "md",
		tone = "default",
		className,
		children,
		...rest
	} = props as ChromeButtonProps & { as?: "button" | "a" | "link" };

	const classes = cn(BASE, SIZE[size], TONE[tone], className);

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

/**
 * Shared frame for segmented controls (e.g. DensityToggle's S/M/L/XL).
 * Children should be `<ChromeButton tone="bare" size="sm">` so the frame
 * owns the border + bg and individual segments only contribute their
 * hover / selected colour.
 */
export function ChromeButtonGroup({
	children,
	className,
	...rest
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
	return (
		<div
			{...rest}
			className={cn(
				"inline-flex items-center gap-0.5 rounded-card border border-border/60 bg-bg/40 p-0.5",
				className,
			)}
		>
			{children}
		</div>
	);
}
