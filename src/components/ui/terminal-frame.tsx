import type { ReactNode } from "react";
import { Chrome } from "#/components/terminal/chrome";
import { cn } from "#/lib/utils";

type TerminalFrameProps = {
	title?: string;
	chrome?: ReactNode;
	mobileChrome?: ReactNode;
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
 *
 * Below the `sm` breakpoint the macOS chrome is replaced by `mobileChrome`
 * (or hidden entirely) since traffic-light dots + cols×rows readouts don't
 * carry payload on a phone.
 */
export function TerminalFrame({
	title = "~ — portfolio",
	chrome,
	mobileChrome,
	controls,
	closeTo,
	children,
	className,
}: TerminalFrameProps) {
	return (
		<div
			className={cn(
				"mx-auto w-full max-w-5xl overflow-hidden rounded-none border-0 bg-bg-elev sm:max-w-5xl sm:rounded-card sm:border sm:border-border/80 sm:shadow-frame",
				className,
			)}
		>
			<div className="hidden sm:block">
				<Chrome title={title} controls={controls} closeTo={closeTo} />
			</div>
			{mobileChrome ? <div className="sm:hidden">{mobileChrome}</div> : null}
			{chrome ? (
				<div className="border-b border-border/70 bg-bg-elev/95">{chrome}</div>
			) : null}
			<div className="bg-bg">{children}</div>
		</div>
	);
}
