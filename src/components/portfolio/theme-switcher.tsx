import { Check, Palette } from "lucide-react";
import { useTheme } from "#/hooks/use-theme";
import { Button } from "../ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export function ThemeSwitcher() {
	const { theme, setTheme, themes } = useTheme();
	const activeName = themes.find((t) => t.slug === theme)?.name ?? "theme";

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					data-testid="theme-switcher"
					variant="ghost"
					size="sm"
					className="h-7 gap-1.5 rounded-card border border-border/70 bg-bg/40 px-2 font-mono text-meta text-muted hover:bg-accent/10 hover:text-accent"
				>
					<Palette className="size-3" aria-hidden="true" />
					<span className="hidden sm:inline">{activeName}</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				sideOffset={6}
				className="min-w-[14rem] border border-border bg-bg text-fg"
			>
				{themes.map((t) => {
					const active = t.slug === theme;
					return (
						<DropdownMenuItem
							key={t.slug}
							data-testid={`theme-option-${t.slug}`}
							onSelect={() => setTheme(t.slug)}
							className="flex items-start gap-3 focus:bg-accent/15 focus:text-fg"
						>
							<span
								aria-hidden="true"
								className="mt-0.5 flex size-4 items-center justify-center text-accent"
							>
								{active ? (
									<Check
										className="size-3.5"
										data-testid={`theme-active-${t.slug}`}
									/>
								) : null}
							</span>
							<span className="flex flex-col">
								<span className="text-sm text-fg">{t.name}</span>
								<span className="text-meta text-muted">{t.vibe}</span>
							</span>
						</DropdownMenuItem>
					);
				})}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
