import { cn } from "#/lib/utils";
import { useSubmit } from "./use-submit";

const CHIPS = ["/me", "/projects", "/help", "/exit"] as const;

/**
 * Visible only below the `sm` breakpoint. One tap submits the command via
 * the same `useSubmit()` hook the prompt uses, so the chip path and the
 * keyboard path stay in lockstep.
 *
 * Touch target ≥ 36px tall, with weight-contrast typography and a soft
 * accent active state that matches the prompt prefix vibe.
 */
export function MobileQuickChips() {
	const submit = useSubmit();

	return (
		<div
			data-testid="mobile-quick-chips"
			className={cn(
				"flex sm:hidden gap-2 overflow-x-auto border-t border-border bg-bg-elev/70 px-4 py-2.5",
				"[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
			)}
		>
			{CHIPS.map((cmd) => (
				<button
					key={cmd}
					type="button"
					data-testid={`mobile-chip-${cmd.slice(1)}`}
					onClick={() => {
						void submit(cmd);
					}}
					className={cn(
						"shrink-0 inline-flex items-center h-10 rounded-md border border-border/80 bg-bg/70 px-3.5 font-mono text-sm font-medium text-fg/90",
						"transition-colors duration-base hover:border-accent/60 hover:bg-accent/10 hover:text-accent",
						"active:bg-accent/20 active:border-accent",
						"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
					)}
				>
					{cmd}
				</button>
			))}
		</div>
	);
}
