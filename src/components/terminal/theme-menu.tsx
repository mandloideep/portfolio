import { Palette } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { useTheme } from "#/hooks/use-theme";

/**
 * Clickable theme indicator that lives in the terminal chrome bar. The
 * `/theme` command still works — this is a parallel surface for the
 * mouse-first crowd. Sourced from the `themes` array in `src/content/themes.ts`
 * via the existing `useTheme()` hook.
 */
export function ThemeMenu() {
	const { theme, setTheme, themes } = useTheme();
	const active = themes.find((t) => t.slug === theme);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				data-testid="chrome-theme-trigger"
				aria-label={`Theme: ${active?.name ?? theme}. Click to change.`}
				className="flex items-center gap-1.5 rounded-chip border border-border/60 bg-bg/40 px-2 py-1 font-mono text-eyebrow uppercase tracking-eyebrow text-muted/80 transition-colors duration-base hover:border-border hover:text-fg/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [font-variant-numeric:tabular-nums]"
			>
				<Palette aria-hidden="true" className="size-3" />
				<span className="truncate max-w-[14ch]">{active?.name ?? theme}</span>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				sideOffset={8}
				data-testid="chrome-theme-menu"
				className="min-w-[14rem] max-h-[60vh] overflow-y-auto"
			>
				{themes.map((t) => {
					const isActive = t.slug === theme;
					return (
						<DropdownMenuItem
							key={t.slug}
							data-testid={`chrome-theme-item-${t.slug}`}
							data-active={isActive || undefined}
							onSelect={() => setTheme(t.slug)}
							className="flex items-center justify-between gap-3"
						>
							<span className="flex items-center gap-2">
								<span
									aria-hidden="true"
									className="inline-block size-2.5 rounded-pill border border-border/40"
									style={{ background: t.tokens.accent }}
								/>
								<span className="font-mono text-sm">{t.name}</span>
							</span>
							{isActive ? (
								<span
									aria-hidden="true"
									className="font-mono text-meta uppercase tracking-tab text-muted/70"
								>
									active
								</span>
							) : (
								<span className="font-mono text-meta uppercase tracking-tab text-muted/40">
									{t.vibe}
								</span>
							)}
						</DropdownMenuItem>
					);
				})}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
