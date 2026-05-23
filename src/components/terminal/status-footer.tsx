import { useStore } from "@tanstack/react-store";
import { themes } from "#/content/themes";
import { terminalStore } from "#/store/terminal";
import { themeStore } from "#/store/theme";

/**
 * Persistent bottom strip inside the terminal chrome window. Surfaces the
 * pieces of state the user is most likely to forget: current prompt mode,
 * active theme, model selection (placeholder until phase 6).
 */
export function StatusFooter() {
	const themeSlug = useStore(themeStore, (s) => s.slug);
	const mode = useStore(terminalStore, (s) => s.mode);
	const themeName = themes.find((t) => t.slug === themeSlug)?.name ?? themeSlug;

	return (
		<div
			data-testid="status-footer"
			className="flex items-center justify-between border-t border-border bg-bg/80 px-3 py-1.5 text-xs text-muted font-mono"
		>
			<div className="flex items-center gap-2">
				<span className="rounded bg-border/60 px-1.5 py-0.5 text-fg uppercase tracking-wide">
					{mode}
				</span>
				<span>·</span>
				<span data-testid="status-theme">theme: {themeName}</span>
			</div>
			<div className="flex items-center gap-2">
				<span data-testid="status-model">model: —</span>
			</div>
		</div>
	);
}
