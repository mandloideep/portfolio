import { type ReactNode, useEffect, useState } from "react";
import { CommandHint } from "#/components/ui/command-hint";
import { DensityToggle } from "#/components/ui/density-toggle";
import { LocalTime } from "#/components/ui/local-time";
import { TerminalFrame } from "#/components/ui/terminal-frame";
import { ThemeSwitcher } from "#/components/ui/theme-switcher";
import { siteMeta } from "#/content/site";
import { useDensity } from "#/hooks/use-density";
import { DesktopChatIcon } from "./desktop-chat-icon";
import { DesktopTerminalIcon } from "./desktop-terminal-icon";
import { Footer } from "./footer";
import { PortfolioPalette } from "./portfolio-palette";
import { type TopTab, TopTabs } from "./top-tabs";

const TABS: readonly TopTab[] = [
	{ id: "hero", label: "whoami", to: "/" },
	{ id: "projects", label: "/projects", to: "/projects" },
	{ id: "experience", label: "/experience", to: "/experience" },
	{ id: "research", label: "/research", to: "/research" },
	{ id: "github", label: "/github", to: "/github" },
	{ id: "contact", label: "/contact", to: "/contact" },
	{ id: "chat", label: "/chat", to: "/chat" },
] as const;

/**
 * Shared shell for every portfolio route. Renders the terminal frame
 * (Chrome + bordered window), the top-tab nav, the route content, and
 * the footer. Page-level routes drop their content as children.
 */
export function PortfolioLayout({ children }: { children: ReactNode }) {
	useDensity();
	const [paletteOpen, setPaletteOpen] = useState(false);

	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
				e.preventDefault();
				setPaletteOpen(true);
			}
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);

	return (
		<div
			data-page="portfolio"
			className="surface-grain relative flex min-h-screen items-start justify-center bg-bg p-4 md:p-8"
		>
			<TerminalFrame
				className="max-w-[min(82rem,90vw)]"
				title={`${siteMeta.name.split(" ")[0]?.toLowerCase()} — portfolio`}
				closeTo="/terminal"
				controls={
					<>
						<LocalTime className="hidden md:inline-flex" />
						<CommandHint onOpen={() => setPaletteOpen(true)} />
						<DensityToggle />
						<ThemeSwitcher />
					</>
				}
				chrome={<TopTabs items={TABS} />}
			>
				<main id="main" className="flex flex-col">
					<h1 className="sr-only">
						{siteMeta.name} — {siteMeta.role}
					</h1>
					{children}
					<Footer />
				</main>
			</TerminalFrame>
			<DesktopChatIcon />
			<DesktopTerminalIcon />
			<PortfolioPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
		</div>
	);
}
