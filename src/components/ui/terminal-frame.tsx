import type { ReactNode } from "react";
import { Chrome } from "#/components/terminal/chrome";
import { cn } from "#/lib/utils";

type TerminalFrameProps = {
	title?: string;
	chrome?: ReactNode;
	controls?: ReactNode;
	closeTo?: string;
	children: ReactNode;
	className?: string;
};

/**
 * Editorial-workstation terminal window. Renders the macOS chrome + a
 * subtle elevated container that hosts the page's content. `chrome` slots
 * a top-tab strip directly below the title bar; `controls` slots controls
 * (theme, density) on the chrome's right side.
 */
export function TerminalFrame({
	title = "~ — portfolio",
	chrome,
	controls,
	closeTo,
	children,
	className,
}: TerminalFrameProps) {
	return (
		<div
			className={cn(
				"mx-auto w-full max-w-5xl overflow-hidden rounded-card border border-border/80 bg-bg-elev shadow-frame",
				className,
			)}
		>
			<Chrome title={title} controls={controls} closeTo={closeTo} />
			{chrome ? (
				<div className="border-b border-border/70 bg-bg-elev/95">{chrome}</div>
			) : null}
			<div className="bg-bg">{children}</div>
		</div>
	);
}
