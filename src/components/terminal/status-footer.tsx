import { useStore } from "@tanstack/react-store";
import { themes } from "#/content/themes";
import { modelStore } from "#/store/model";
import { terminalStore } from "#/store/terminal";
import { themeStore } from "#/store/theme";

/**
 * Persistent bottom strip inside the terminal chrome window. Surfaces the
 * pieces of state the user is most likely to forget: current prompt mode,
 * active theme, active OpenRouter model.
 */
export function StatusFooter() {
	const themeSlug = useStore(themeStore, (s) => s.slug);
	const mode = useStore(terminalStore, (s) => s.mode);
	const activeModel = useStore(modelStore, (s) => s.activeModel);
	const themeName = themes.find((t) => t.slug === themeSlug)?.name ?? themeSlug;
	const modelLabel = shortModelName(activeModel);

	return (
		<div
			data-testid="status-footer"
			className="flex items-center justify-between border-t border-border bg-bg/80 px-3 py-1.5 text-[11px] sm:text-xs text-muted font-mono"
		>
			<div className="flex items-center gap-2">
				<span className="rounded bg-border/60 px-1.5 py-0.5 text-fg uppercase tracking-wide">
					{mode}
				</span>
				<span>·</span>
				<span data-testid="status-theme">theme: {themeName}</span>
			</div>
			<div className="flex items-center gap-2">
				<span data-testid="status-model">model: {modelLabel}</span>
			</div>
		</div>
	);
}

function shortModelName(id: string): string {
	// "anthropic/claude-haiku-4.5" → "claude-haiku-4.5"
	const slash = id.indexOf("/");
	return slash === -1 ? id : id.slice(slash + 1);
}
