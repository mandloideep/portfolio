import type { LanguageShare } from "#/routes/api.github-graph";

type Props = {
	languages: LanguageShare[];
	/** When `true`, each row gets a thin percent bar below the label. */
	showBars?: boolean;
	className?: string;
};

/**
 * Horizontal pill row showing the most-used languages by byte share.
 * Compact mode (`showBars=false`) is what the home heatmap section uses;
 * the bar variant is used on the dedicated `/github` page.
 */
export function LanguagePills({ languages, showBars, className }: Props) {
	if (languages.length === 0) return null;
	return (
		<div
			data-testid="language-pills"
			className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}
		>
			{languages.map((lang) => {
				const swatch = lang.color ?? "var(--accent)";
				return (
					<div
						key={lang.name}
						data-testid={`lang-${lang.name}`}
						className="flex flex-col gap-1 min-w-[7rem]"
					>
						<span className="inline-flex items-center gap-2 rounded-chip border border-border/60 bg-bg/40 px-2 py-1 font-mono text-meta text-fg/90">
							<span
								aria-hidden="true"
								className="inline-block size-2.5 shrink-0 rounded-pill"
								style={{ background: swatch }}
							/>
							<span className="truncate">{lang.name}</span>
							<span className="ml-auto text-muted [font-variant-numeric:tabular-nums]">
								{lang.pct.toFixed(1)}%
							</span>
						</span>
						{showBars ? (
							<span
								aria-hidden="true"
								className="block h-[3px] rounded-pill bg-border/40"
							>
								<span
									className="block h-full rounded-pill"
									style={{
										width: `${Math.min(100, lang.pct)}%`,
										background: swatch,
									}}
								/>
							</span>
						) : null}
					</div>
				);
			})}
		</div>
	);
}
