import { AnimatedGridPattern } from "#/components/ui/animated-grid-pattern";
import { useReducedMotion } from "#/hooks/use-reduced-motion";
import { cn } from "#/lib/utils";

export function AnimatedBackground({ className }: { className?: string }) {
	const reduced = useReducedMotion();

	return (
		<div
			aria-hidden
			data-testid="animated-background"
			data-reduced={reduced ? "true" : "false"}
			className={cn(
				"pointer-events-none fixed inset-0 -z-10 overflow-hidden",
				className,
			)}
		>
			<AnimatedGridPattern
				numSquares={reduced ? 0 : 36}
				maxOpacity={0.18}
				duration={3}
				repeatDelay={1}
				className={cn(
					"absolute inset-0 h-full w-full",
					"[mask-image:radial-gradient(60%_60%_at_50%_30%,black,transparent)]",
					"text-border/60",
				)}
			/>
		</div>
	);
}
