import { cn } from "#/lib/utils";
import { NumberTicker } from "./number-ticker";

type StatCardProps = {
	value: string;
	label: string;
	sublabel?: string;
	pulse?: boolean;
	className?: string;
};

/**
 * Parses a string stat into a numeric prefix + literal suffix when possible
 * (e.g. "1.2k" → { num: 1.2, suffix: "k", decimals: 1 }). Returns null when
 * the value doesn't start with a number (e.g. "~3x").
 */
function parseNumericPrefix(value: string): {
	num: number;
	suffix: string;
	decimals: number;
} | null {
	const m = value.match(/^([0-9]+(?:\.[0-9]+)?)(.*)$/);
	if (!m) return null;
	const numStr = m[1] ?? "";
	const num = Number(numStr);
	if (!Number.isFinite(num)) return null;
	const decimals = numStr.includes(".")
		? (numStr.split(".")[1] ?? "").length
		: 0;
	return { num, suffix: m[2] ?? "", decimals };
}

/**
 * Mini stat card with weight contrast: large accent numeral (text-stat),
 * link-colored label, muted sub-label. Numeric prefixes animate from 0
 * via `NumberTicker` when the card scrolls into view; reduced-motion
 * users see the final value instantly.
 */
export function StatCard({
	value,
	label,
	sublabel,
	pulse,
	className,
}: StatCardProps) {
	const parsed = parseNumericPrefix(value);

	return (
		<div
			className={cn(
				"flex flex-col items-center gap-1.5 rounded-card border border-border/70 bg-bg-elev/70 px-3 py-5 text-center",
				className,
			)}
		>
			<div className="flex items-center gap-1.5">
				{pulse ? (
					<span
						aria-hidden="true"
						className="size-2 shrink-0 animate-[status-pulse_1.6s_ease-in-out_infinite] rounded-pill bg-accent shadow-glow"
					/>
				) : null}
				<span className="font-mono text-stat font-medium leading-none text-accent [font-variant-numeric:tabular-nums]">
					{parsed ? (
						<>
							<NumberTicker
								value={parsed.num}
								decimalPlaces={parsed.decimals}
								className="text-accent"
							/>
							{parsed.suffix}
						</>
					) : (
						value
					)}
				</span>
			</div>
			<span className="font-mono text-sm text-link">{label}</span>
			{sublabel ? (
				<span className="font-mono text-meta text-muted">{sublabel}</span>
			) : null}
		</div>
	);
}
