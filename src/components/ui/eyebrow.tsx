import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "#/lib/utils";

type EyebrowProps<T extends ElementType = "span"> = {
	as?: T;
	children: ReactNode;
	className?: string;
} & Omit<HTMLAttributes<HTMLElement>, "children" | "className">;

export function Eyebrow<T extends ElementType = "span">({
	as,
	className,
	children,
	...rest
}: EyebrowProps<T>) {
	const Tag = (as ?? "span") as ElementType;
	return (
		<Tag
			className={cn(
				"font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted",
				className,
			)}
			{...rest}
		>
			{children}
		</Tag>
	);
}
