/**
 * Editorial-workstation chrome bar for the terminal route. Pure presentation
 * — no state, no events. The traffic-light dots are token-driven so they
 * shift with the active theme rather than locking the macOS palette.
 */
export function Chrome({
	title = "~/deep-mandloi — agent",
}: {
	title?: string;
}) {
	return (
		<div
			data-testid="terminal-chrome"
			className="relative flex items-center gap-3 border-b border-border bg-bg-elev/95 px-3.5 py-2.5"
		>
			<div className="flex items-center gap-1.5" aria-hidden="true">
				<span className="size-3 rounded-full bg-error/85 ring-1 ring-inset ring-error/30" />
				<span className="size-3 rounded-full bg-accent-alt/75 ring-1 ring-inset ring-accent-alt/30" />
				<span className="size-3 rounded-full bg-success/80 ring-1 ring-inset ring-success/30" />
			</div>
			<div className="flex-1 select-none text-center font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
				{title}
			</div>
			<div
				className="w-12 text-right font-mono text-[10px] uppercase tracking-[0.18em] text-muted/70"
				aria-hidden="true"
			>
				80×24
			</div>
		</div>
	);
}
