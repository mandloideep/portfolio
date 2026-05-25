import { cn } from "#/lib/utils";

type StatCardProps = {
	value: string;
	label: string;
	sublabel?: string;
	pulse?: boolean;
	className?: string;
};

/**
 * Mini stat card with weight contrast: large accent numeral, link-colored
 * label, muted sub-label. Optionally renders a pulsing dot before the value
 * (used for "live" stats like uptime). Sits in a row of 3-4 with peers.
 */
export function StatCard({
	value,
	label,
	sublabel,
	pulse,
	className,
}: StatCardProps) {
	return (
		<div
			className={cn(
				"flex flex-col items-center gap-1 rounded-md border border-border/70 bg-bg-elev/70 px-3 py-4 text-center",
				className,
			)}
		>
			<div className="flex items-center gap-1.5">
				{pulse ? (
					<span
						aria-hidden="true"
						className="size-1.5 shrink-0 animate-[status-pulse_1.6s_ease-in-out_infinite] rounded-full bg-accent shadow-[0_0_0_2px_color-mix(in_oklch,var(--accent)_25%,transparent)]"
					/>
				) : null}
				<span className="font-mono text-[1.65rem] font-medium leading-none text-accent [font-variant-numeric:tabular-nums]">
					{value}
				</span>
			</div>
			<span className="font-mono text-[12px] text-link">{label}</span>
			{sublabel ? (
				<span className="font-mono text-[11px] text-muted">{sublabel}</span>
			) : null}
		</div>
	);
}
