/**
 * <ChatAvatar> — initials badge for chat surfaces.
 *
 * Explicit `size` variants (composition-patterns: explicit-variants) — `sm`,
 * `lg`, `xl`. The photo branch was intentionally removed in the refinement
 * round; visitors see clean tokenized initials. Future photo support can be
 * re-added behind an explicit `withImage` prop if the user wants it back.
 */

import { siteMeta } from "#/content/site";
import { cn } from "#/lib/utils";

type Size = "sm" | "lg" | "xl";

const SIZE_CLASS: Record<Size, string> = {
	sm: "size-9",
	lg: "size-20",
	xl: "size-44 sm:size-56",
};

const TEXT_SIZE: Record<Size, string> = {
	sm: "text-xs",
	lg: "text-2xl",
	xl: "text-6xl",
};

function getInitials(name: string): string {
	return name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? "")
		.join("");
}

export function ChatAvatar({
	size,
	className,
	ariaLabel,
}: {
	size: Size;
	className?: string;
	ariaLabel?: string;
}) {
	const label = ariaLabel ?? `${siteMeta.name} avatar`;
	const initials = getInitials(siteMeta.name);

	return (
		<span
			className={cn(
				"inline-flex shrink-0 items-center justify-center rounded-full bg-bg-elev/80 ring-1 ring-border/60",
				size === "xl" && "shadow-frame",
				SIZE_CLASS[size],
				className,
			)}
			role="img"
			aria-label={label}
			data-testid="chat-avatar"
		>
			<span
				className={cn("font-display font-medium text-fg/90", TEXT_SIZE[size])}
				aria-hidden="true"
			>
				{initials}
			</span>
		</span>
	);
}
