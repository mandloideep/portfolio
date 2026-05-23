/**
 * macOS-style window chrome bar for the terminal route.
 * Pure presentation — no state, no events.
 */
export function Chrome({
	title = "deep — portfolio — 80×24",
}: {
	title?: string;
}) {
	return (
		<div
			data-testid="terminal-chrome"
			className="flex items-center gap-3 border-b border-border bg-bg/80 px-3 py-2"
		>
			<div className="flex items-center gap-1.5">
				<span className="size-3 rounded-full bg-[#ff5f57]" aria-hidden="true" />
				<span className="size-3 rounded-full bg-[#febc2e]" aria-hidden="true" />
				<span className="size-3 rounded-full bg-[#28c840]" aria-hidden="true" />
			</div>
			<div className="flex-1 text-center text-xs text-muted select-none">
				{title}
			</div>
			<div className="w-12" aria-hidden="true" />
		</div>
	);
}
