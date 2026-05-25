import { cn } from "#/lib/utils";
import { useSubmit } from "./use-submit";

const CHIPS = ["/me", "/projects", "/help", "/exit"] as const;

/**
 * Visible only below the `sm` breakpoint. One tap submits the command via
 * the same `useSubmit()` hook the prompt uses, so the chip path and the
 * keyboard path stay in lockstep.
 */
export function MobileQuickChips() {
	const submit = useSubmit();

	return (
		<div
			data-testid="mobile-quick-chips"
			className={cn(
				"flex sm:hidden gap-2 overflow-x-auto border-t border-border bg-bg/60 px-3 py-2",
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
						"shrink-0 rounded border border-border bg-bg px-2 py-1 text-xs font-mono text-fg",
						"transition-colors hover:bg-border/40 active:bg-border/60",
					)}
				>
					{cmd}
				</button>
			))}
		</div>
	);
}
