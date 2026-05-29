import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// tailwind-merge ships with knowledge of stock Tailwind utility groups but
// can't infer our custom `--text-*`, `--leading-*`, `--tracking-*`,
// `--radius-*`, `--shadow-*`, `--duration-*` tokens in `src/styles.css`.
// Without this hint, classes like `text-eyebrow` (font-size) silently
// collide with `text-muted/80` (color) and get dropped — which is exactly
// how `CommandHint` lost its eyebrow size at runtime.
const twMerge = extendTailwindMerge({
	extend: {
		classGroups: {
			"font-size": [{ text: ["eyebrow", "meta", "md", "stat", "display"] }],
			leading: [{ leading: ["snug", "body", "relaxed"] }],
			tracking: [{ tracking: ["eyebrow", "tab", "wide"] }],
			rounded: [{ rounded: ["chip", "card", "pill"] }],
			shadow: [
				{
					shadow: ["frame", "card", "glow", "glow-strong", "tab-active"],
				},
			],
			duration: [{ duration: ["fast", "base", "slow"] }],
		},
	},
});

export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs));
}
