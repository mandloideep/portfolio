import { ArrowRightIcon } from "@radix-ui/react-icons";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { Button } from "#/components/ui/button.tsx";
import { cn } from "#/lib/utils";

interface BentoGridProps extends ComponentPropsWithoutRef<"div"> {
	children: ReactNode;
	className?: string;
}

interface BentoCardProps extends ComponentPropsWithoutRef<"div"> {
	name: string;
	className: string;
	background: ReactNode;
	Icon: React.ElementType;
	description: string;
	href: string;
	cta: string;
}

const BentoGrid = ({ children, className, ...props }: BentoGridProps) => {
	return (
		<div
			className={cn(
				"grid w-full auto-rows-[22rem] grid-cols-3 gap-4",
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
};

const BentoCard = ({
	name,
	className,
	background,
	Icon,
	description,
	href,
	cta,
	...props
}: BentoCardProps) => (
	<div
		key={name}
		className={cn(
			"group relative col-span-3 flex transform-gpu flex-col justify-between overflow-hidden rounded-xl",
			"border border-border/80 bg-bg-elev",
			"shadow-[0_1px_0_var(--color-border),0_20px_40px_-24px_rgba(0,0,0,0.35)]",
			"transition-[border-color,transform,box-shadow] duration-300",
			"hover:-translate-y-0.5 hover:border-accent/60",
			className,
		)}
		{...props}
	>
		<div>{background}</div>
		<div className="p-5">
			<div className="pointer-events-none z-10 flex transform-gpu flex-col gap-1.5 transition-all duration-300 lg:group-hover:-translate-y-10">
				<Icon className="h-10 w-10 origin-left transform-gpu text-fg/80 transition-all duration-300 ease-in-out group-hover:scale-90 group-hover:text-accent" />
				<h3 className="font-display text-xl font-medium tracking-tight text-fg">
					{name}
				</h3>
				<p className="max-w-lg text-sm leading-relaxed text-fg/75">
					{description}
				</p>
			</div>

			<div
				className={cn(
					"pointer-events-none flex w-full translate-y-0 transform-gpu flex-row items-center transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 lg:hidden",
				)}
			>
				<Button
					variant="link"
					asChild
					size="sm"
					className="pointer-events-auto p-0 text-accent"
				>
					<a href={href}>
						{cta}
						<ArrowRightIcon className="ms-2 h-4 w-4 rtl:rotate-180" />
					</a>
				</Button>
			</div>
		</div>

		<div
			className={cn(
				"pointer-events-none absolute bottom-0 hidden w-full translate-y-10 transform-gpu flex-row items-center p-5 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 lg:flex",
			)}
		>
			<Button
				variant="link"
				asChild
				size="sm"
				className="pointer-events-auto p-0 text-accent"
			>
				<a href={href}>
					{cta}
					<ArrowRightIcon className="ms-2 h-4 w-4 rtl:rotate-180" />
				</a>
			</Button>
		</div>

		<div className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-accent/0 via-accent/70 to-accent/0 transition-transform duration-500 group-hover:scale-x-100" />
	</div>
);

export { BentoCard, BentoGrid };
