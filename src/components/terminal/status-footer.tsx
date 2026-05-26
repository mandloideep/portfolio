import { useStore } from "@tanstack/react-store";
import { useEffect } from "react";
import { themes } from "#/content/themes";
import { modelStore } from "#/store/model";
import { quotaStore, setQuota } from "#/store/quota";
import { terminalStore } from "#/store/terminal";
import { themeStore } from "#/store/theme";

/**
 * Persistent bottom strip inside the terminal chrome window. Surfaces the
 * pieces of state the user is most likely to forget: current prompt mode,
 * active theme, active OpenRouter model.
 *
 * Visual treatment: three columns separated by vertical pipes, uppercase
 * eyebrow type for the metadata, value rendered in fg with tabular numerals
 * so model+token labels don't jitter as state changes.
 */
export function StatusFooter() {
	const themeSlug = useStore(themeStore, (s) => s.slug);
	const mode = useStore(terminalStore, (s) => s.mode);
	const activeModel = useStore(modelStore, (s) => s.activeModel);
	const remaining = useStore(quotaStore, (s) => s.remaining);
	const limit = useStore(quotaStore, (s) => s.limit);
	const themeName = themes.find((t) => t.slug === themeSlug)?.name ?? themeSlug;
	const modelLabel = shortModelName(activeModel);

	useEffect(() => {
		let cancelled = false;
		fetch("/api/agent/quota", { cache: "no-store" })
			.then((r) => (r.ok ? r.json() : null))
			.then(
				(
					data: {
						remaining?: number;
						limit?: number;
						resetsAt?: string;
					} | null,
				) => {
					if (cancelled || !data) return;
					if (typeof data.remaining !== "number") return;
					const next: Partial<{
						remaining: number;
						limit: number;
						resetsAt: string | null;
					}> = {
						remaining: data.remaining,
						resetsAt: data.resetsAt ?? null,
					};
					if (typeof data.limit === "number") next.limit = data.limit;
					setQuota(next);
				},
			)
			.catch(() => {});
		return () => {
			cancelled = true;
		};
	}, []);

	return (
		<div
			data-testid="status-footer"
			className="flex items-center justify-between gap-3 border-t border-border bg-bg-elev/95 px-4 py-2.5 font-mono text-meta uppercase tracking-tab text-muted [font-variant-numeric:tabular-nums]"
		>
			<div className="flex items-center gap-2.5 min-w-0">
				<span className="rounded-chip border border-border/70 bg-bg/60 px-1.5 py-0.5 font-semibold tracking-tab text-fg/90">
					{mode}
				</span>
				<span className="select-none text-muted/40" aria-hidden="true">
					|
				</span>
				<span className="truncate" data-testid="status-theme">
					<span className="text-muted/70">theme/</span>
					<span className="text-fg/90">{themeName}</span>
				</span>
			</div>
			<div className="flex items-center gap-2.5 min-w-0">
				<span className="select-none text-muted/40" aria-hidden="true">
					|
				</span>
				<span className="truncate" data-testid="status-model">
					<span className="text-muted/70">model/</span>
					<span className="text-fg/90">{modelLabel}</span>
				</span>
				<span className="select-none text-muted/40" aria-hidden="true">
					|
				</span>
				<span
					className="truncate"
					data-testid="status-quota"
					title="messages remaining in your daily quota"
				>
					<span className="text-muted/70">msgs/</span>
					<span
						className={
							remaining === null
								? "text-fg/60"
								: remaining === 0
									? "text-error"
									: remaining <= 1
										? "text-accent-alt"
										: "text-fg/90"
						}
					>
						{remaining === null ? `?/${limit}` : `${remaining}/${limit}`}
					</span>
				</span>
			</div>
		</div>
	);
}

function shortModelName(id: string): string {
	// "anthropic/claude-haiku-4.5" → "claude-haiku-4.5"
	const slash = id.indexOf("/");
	return slash === -1 ? id : id.slice(slash + 1);
}
