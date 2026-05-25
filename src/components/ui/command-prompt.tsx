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
 * portfolio. Renders `user@host:cwd$ command  → trailing`, with token-driven
 * syntax coloring: user in accent (green), host in link (cyan), prompt punct
 * in muted, command in fg. Set `user`/`host`/`cwd` to override; pass
 * `trailing` for the optional `→ link` suffix.
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
				"flex flex-wrap items-baseline gap-x-2 font-mono text-[13px] sm:text-[13.5px] [font-variant-numeric:tabular-nums]",
				className,
			)}
		>
			<span className="shrink-0 select-none">
				<span className="text-accent">{user}</span>
				<span className="text-muted">@</span>
				<span className="text-link">{host}</span>
				<span className="text-muted">:{cwd}$</span>
			</span>
			<span className="text-fg/95">{command}</span>
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
