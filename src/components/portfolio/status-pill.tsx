import { cn } from "#/lib/utils";

export interface StatusPillProps {
	status: string;
	className?: string;
}

export function StatusPill({ status, className }: StatusPillProps) {
	return (
		<output
			data-testid="status-pill"
			className={cn(
				"inline-flex items-center gap-2 rounded-full border border-border bg-bg/60 px-3 py-1 text-xs text-fg",
				className,
			)}
		>
			<span aria-hidden="true" className="relative inline-flex h-2 w-2">
				<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
				<span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
			</span>
			{status}
		</output>
	);
}
