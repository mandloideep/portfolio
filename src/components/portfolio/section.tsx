import type { ReactNode } from "react";
import { CommandPrompt } from "#/components/ui/command-prompt";
import { cn } from "#/lib/utils";

export interface PortfolioSectionProps {
	id: string;
	title: string;
	command: string;
	trailing?: ReactNode;
	children?: ReactNode;
	className?: string;
	/** When set, the section title is rendered visually hidden (the
	 * CommandPrompt acts as the visible header). */
	hideTitle?: boolean;
}

/**
 * A portfolio section. Each one reads as a terminal command + its output:
 * the CommandPrompt line is the visible heading, then the section body.
 * The semantic `<h2>` is kept for accessibility but hidden visually.
 */
export function PortfolioSection({
	id,
	title,
	command,
	trailing,
	children,
	className,
	hideTitle = true,
}: PortfolioSectionProps) {
	const labelId = `${id}-label`;
	return (
		<section
			id={id}
			aria-labelledby={labelId}
			data-section={id}
			className={cn("scroll-mt-20 px-6 py-12 sm:px-10 sm:py-16", className)}
		>
			<div className="mx-auto max-w-3xl">
				<h2
					id={labelId}
					className={cn(
						"font-mono text-base font-semibold text-fg",
						hideTitle && "sr-only",
					)}
				>
					{title}
				</h2>
				<CommandPrompt command={command} trailing={trailing} className="mb-5" />
				{children}
			</div>
		</section>
	);
}
