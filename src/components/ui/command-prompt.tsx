import type { ReactNode } from "react";
import { cn } from "#/lib/utils";

type CommandPromptProps = {
	command: string;
	trailing?: ReactNode;
	className?: string;
	user?: string;
	host?: string;
	cwd?: string;
};

/**
 * Terminal-style command line, used as a section header throughout the
 * portfolio. Renders `user@host:cwd$ command  → trailing`, with consistent
 * syntax coloring driven by `.text-prompt-*` utilities in styles.css.
 */
export function CommandPrompt({
	command,
	trailing,
	className,
	user = "deep",
	host = "portfolio",
	cwd = "~",
}: CommandPromptProps) {
	return (
		<div
			className={cn(
				"flex flex-wrap items-baseline gap-x-2 font-mono text-base [font-variant-numeric:tabular-nums]",
				className,
			)}
		>
			<span className="shrink-0 select-none">
				<span className="text-prompt-user">{user}</span>
				<span className="text-prompt-symbol">@</span>
				<span className="text-prompt-host">{host}</span>
				<span className="text-prompt-symbol">:{cwd}$</span>
			</span>
			<span className="text-prompt-cmd">{command}</span>
			{trailing ? (
				<>
					<span aria-hidden="true" className="select-none text-accent">
						→
					</span>
					<span className="text-link">{trailing}</span>
				</>
			) : null}
		</div>
	);
}
