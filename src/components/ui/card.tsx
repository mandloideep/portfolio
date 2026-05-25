import type { ComponentPropsWithoutRef, ElementType } from "react";
import { cn } from "#/lib/utils";

type CardTone = "default" | "accent";

const TONE_CLASS: Record<CardTone, string> = {
	default: "border-border/70 bg-bg-elev/50",
	accent: "border-accent/60 bg-bg-elev/50 shadow-glow",
};

export type CardProps<T extends ElementType = "div"> = {
	as?: T;
	tone?: CardTone;
	interactive?: boolean;
	className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className">;

/**
 * Shared card surface used across every page (project rows, experience
 * cards, research entries, contact rows). `tone` controls baseline
 * border/glow; `interactive` adds focus/hover affordances for clickable
 * card callsites. Pass `as` to change the rendered element (li, button,
 * a, ...) without losing the consistent surface look.
 */
export function Card<T extends ElementType = "div">({
	as,
	tone = "default",
	interactive,
	className,
	...rest
}: CardProps<T>) {
	const Tag = (as ?? "div") as ElementType;
	return (
		<Tag
			className={cn(
				"rounded-md border text-left transition-[border-color,box-shadow,transform] duration-base",
				TONE_CLASS[tone],
				tone === "default" && "hover:border-border",
				interactive &&
					"hover:border-accent/60 hover:shadow-glow focus-visible:outline-none focus-visible:border-accent/70 focus-visible:shadow-glow-strong",
				className,
			)}
			{...rest}
		/>
	);
}
