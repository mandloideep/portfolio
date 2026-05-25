import { cn } from "#/lib/utils";

type BorderBeamProps = {
	duration?: number;
	className?: string;
};

/**
 * Subtle rotating accent beam wrapped around the parent's border. Wraps
 * a square conic-gradient inside an overflow-hidden box and rotates the
 * whole thing — composed via CSS so it stays cheap. Parent should be
 * `position: relative`; the global reduced-motion guard pauses it.
 */
export function BorderBeam({ duration = 6, className }: BorderBeamProps) {
	return (
		<div
			aria-hidden="true"
			className={cn(
				"pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]",
				className,
			)}
		>
			<div
				className="absolute left-1/2 top-1/2 aspect-square w-[180%] -translate-x-1/2 -translate-y-1/2 [background:conic-gradient(from_0deg,transparent_0deg,color-mix(in_oklch,var(--color-accent)_55%,transparent)_25deg,transparent_70deg)] animate-[spin_var(--beam-duration)_linear_infinite]"
				style={{ ["--beam-duration" as string]: `${duration}s` }}
			/>
			<div className="absolute inset-px rounded-[inherit] bg-[color:var(--color-bg-elev)]" />
		</div>
	);
}
