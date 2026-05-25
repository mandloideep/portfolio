import type { ReactNode } from "react";
import { Chrome } from "#/components/terminal/chrome";
import { cn } from "#/lib/utils";

type TerminalFrameProps = {
	title?: string;
	chrome?: ReactNode;
	children: ReactNode;
	className?: string;
};

/**
 * Editorial-workstation terminal window. Renders the macOS chrome + a
 * subtle elevated container that hosts the page's content. `chrome` lets
 * the caller slot a top-tab strip directly below the title bar.
 */
export function TerminalFrame({
	title = "soney — portfolio — 80×24",
	chrome,
	children,
	className,
}: TerminalFrameProps) {
	return (
		<div
			className={cn(
				"mx-auto w-full max-w-5xl overflow-hidden rounded-xl border border-border/80 bg-bg-elev shadow-[0_1px_0_var(--color-border),0_30px_60px_-20px_rgba(0,0,0,0.55)]",
				className,
			)}
		>
			<Chrome title={title} />
			{chrome ? (
				<div className="border-b border-border/70 bg-bg-elev/95">{chrome}</div>
			) : null}
			<div className="bg-bg">{children}</div>
		</div>
	);
}
