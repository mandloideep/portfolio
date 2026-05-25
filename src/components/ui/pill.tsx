import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "#/lib/utils";

type PillTone = "muted" | "accent" | "link" | "error" | "success" | "warn";
type PillSize = "xs" | "sm" | "md";

const TONE_CLASS: Record<PillTone, string> = {
	muted: "border-border/70 bg-bg/40 text-fg/80",
	accent:
		"border-accent/60 bg-accent/10 text-accent shadow-glow",
	link: "border-link/50 bg-link/10 text-link",
	error: "border-error/60 bg-error/10 text-error",
	success: "border-success/60 bg-success/10 text-success",
	warn: "border-muted/40 bg-muted/10 text-fg/85",
};

const SIZE_CLASS: Record<PillSize, string> = {
	xs: "px-1.5 py-0.5 text-eyebrow",
	sm: "px-2 py-0.5 text-meta",
	md: "px-2.5 py-1 text-sm",
};

export type PillProps<T extends ElementType = "span"> = {
	as?: T;
	tone?: PillTone;
	size?: PillSize;
	children: ReactNode;
	className?: string;
	"data-slot"?: string;
} & Omit<HTMLAttributes<HTMLElement>, "children" | "className">;

/**
 * Single-source pill for tag chips, status labels, key shortcuts. Tone
 * controls color family; size controls type + padding. Default
 * (`tone=muted size=sm`) matches the existing tag-chip look used across
 * project cards, experience cards, and research entries.
 */
export function Pill<T extends ElementType = "span">({
	as,
	tone = "muted",
	size = "sm",
	className,
	children,
	...rest
}: PillProps<T>) {
	const Tag = (as ?? "span") as ElementType;
	return (
		<Tag
			data-slot={rest["data-slot"] ?? "badge"}
			className={cn(
				"inline-flex items-center rounded-chip border font-mono tracking-wide",
				TONE_CLASS[tone],
				SIZE_CLASS[size],
				className,
			)}
			{...rest}
		>
			{children}
		</Tag>
	);
}
