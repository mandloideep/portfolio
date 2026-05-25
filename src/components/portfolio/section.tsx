import type { ReactNode } from "react";
import { Eyebrow } from "#/components/ui/eyebrow";
import { RuleAccent } from "#/components/ui/rule-accent";
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
			className={cn("scroll-mt-24 py-24 md:py-32", className)}
		>
			<div className="mx-auto max-w-3xl px-6">
				{eyebrow ? (
					<Eyebrow as="p" className="mb-3 flex items-center gap-2">
						<span aria-hidden="true" className="text-accent">
							$
						</span>
						<span>{eyebrow}</span>
					</Eyebrow>
				) : null}
				<h2
					id={labelId}
					className="font-display text-[clamp(2rem,4.2vw,3.25rem)] font-medium leading-[1.05] tracking-tight text-fg"
				>
					{title}
				</h2>
				<RuleAccent className="mt-4 max-w-[8rem]" variant="solid" />
				{children ? <div className="mt-10">{children}</div> : null}
			</div>
		</section>
	);
}
