import type { ReactNode } from "react";
import { cn } from "#/lib/utils";

export interface PortfolioSectionProps {
	id: string;
	title: string;
	eyebrow?: string;
	children?: ReactNode;
	className?: string;
}

export function PortfolioSection({
	id,
	title,
	eyebrow,
	children,
	className,
}: PortfolioSectionProps) {
	const labelId = `${id}-label`;
	return (
		<section
			id={id}
			aria-labelledby={labelId}
			data-section={id}
			className={cn("scroll-mt-20 py-24 md:py-32", className)}
		>
			<div className="mx-auto max-w-3xl px-6">
				{eyebrow ? (
					<p className="text-muted text-xs uppercase tracking-[0.18em] mb-2">
						<span className="text-accent">$</span> {eyebrow}
					</p>
				) : null}
				<h2
					id={labelId}
					className="text-2xl md:text-3xl font-medium tracking-tight"
				>
					{title}
				</h2>
				{children ? <div className="mt-8">{children}</div> : null}
			</div>
		</section>
	);
}
