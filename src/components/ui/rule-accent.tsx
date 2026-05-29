import { cn } from "#/lib/utils";

type RuleAccentProps = {
	variant?: "solid" | "fade";
	className?: string;
};

/**
 * A 1px themed hairline. Two modes:
 *   - solid: flat accent line
 *   - fade:  transparent → accent → transparent gradient (used between
 *            terminal chrome and content, and beneath hero blocks)
 */
export function RuleAccent({ variant = "fade", className }: RuleAccentProps) {
	return (
		<div
			aria-hidden="true"
			className={cn(
				"h-px w-full",
				variant === "solid"
					? "bg-accent/60"
					: "bg-gradient-to-r from-transparent via-accent/60 to-transparent",
				className,
			)}
		/>
	);
}
