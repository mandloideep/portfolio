import type { ReactNode } from "react";
import { cn } from "#/lib/utils";

type KVRowProps = {
	label: string;
	value: ReactNode;
	className?: string;
};

/**
 * Profile-card key/value row. Muted label on the left (mono, fixed-width
 * gutter), accent or link value on the right. Used inside the hero profile
 * card and contact card.
 */
export function KVRow({ label, value, className }: KVRowProps) {
	return (
		<div className={cn("flex items-start gap-6 py-1.5", className)}>
			<dt className="w-28 shrink-0 font-mono text-[13px] text-muted">
				{label}:
			</dt>
			<dd className="flex-1 font-mono text-[13px] text-accent">{value}</dd>
		</div>
	);
}
