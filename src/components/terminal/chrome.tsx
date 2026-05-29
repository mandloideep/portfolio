import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useViewportCells } from "#/hooks/use-viewport-cells";

type ChromeProps = {
	title?: string;
	/**
	 * Where the red traffic-light dot routes to. If omitted, the dot is
	 * a decorative span. The portfolio passes `/terminal` so closing the
	 * window navigates to the agent shell.
	 */
	closeTo?: string;
	/** Optional search params to pass on close (e.g. `{ choose: 1 }`). */
	closeSearch?: Record<string, unknown>;
	/** Right-side slot for controls (theme switcher, density, etc.). */
	controls?: ReactNode;
};

/**
 * Editorial-workstation chrome bar. Theme-driven traffic-light dots, live
 * viewport dimensions on the right, optional controls slot.
 */
export function Chrome({
	title = "~ — agent",
	closeTo,
	closeSearch,
	controls,
}: ChromeProps) {
	const { cols, rows } = useViewportCells();
	const dotBase =
		"size-3 rounded-pill ring-1 ring-inset transition-transform duration-base";

	return (
		<div
			data-testid="terminal-chrome"
			className="relative flex items-center gap-3 border-b border-border bg-bg-elev/95 px-3.5 py-2.5"
		>
			<div className="flex items-center gap-1.5">
				{closeTo ? (
					<Link
						to={closeTo}
						search={closeSearch as never}
						aria-label="Close — go to terminal"
						data-testid="chrome-close"
						className={`${dotBase} bg-error/85 ring-error/30 hover:scale-110 focus-visible:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
					/>
				) : (
					<span
						className={`${dotBase} bg-error/85 ring-error/30`}
						aria-hidden="true"
					/>
				)}
				<span
					className={`${dotBase} bg-accent-alt/75 ring-accent-alt/30`}
					aria-hidden="true"
				/>
				<span
					className={`${dotBase} bg-success/80 ring-success/30`}
					aria-hidden="true"
				/>
			</div>
			<div className="flex-1 select-none text-center font-mono text-meta uppercase tracking-eyebrow text-muted">
				{title}
			</div>
			<div className="flex shrink-0 items-center gap-2.5">
				{controls ? (
					<div className="flex items-center gap-1.5">{controls}</div>
				) : null}
				<span
					data-testid="chrome-dims"
					className="select-none font-mono text-eyebrow uppercase tracking-eyebrow text-muted/70 [font-variant-numeric:tabular-nums]"
					aria-hidden="true"
				>
					{cols}×{rows}
				</span>
			</div>
		</div>
	);
}
