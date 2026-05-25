import type { ReactNode } from "react";
import { TerminalFrame } from "#/components/ui/terminal-frame";
import { siteMeta } from "#/content/site";
import { Footer } from "./footer";
import { type TopTab, TopTabs } from "./top-tabs";

const TABS: readonly TopTab[] = [
	{ id: "hero", label: "whoami", to: "/" },
	{ id: "projects", label: "/projects", to: "/projects" },
	{ id: "experience", label: "/experience", to: "/experience" },
	{ id: "research", label: "/research", to: "/research" },
	{ id: "contact", label: "/contact", to: "/contact" },
] as const;

/**
 * Shared shell for every portfolio route. Renders the terminal frame
 * (Chrome + bordered window), the top-tab nav, the route content, and
 * the footer. Page-level routes drop their content as children.
 */
export function PortfolioLayout({ children }: { children: ReactNode }) {
	return (
		<div
			data-page="portfolio"
			className="surface-grain relative min-h-screen bg-bg px-3 py-5 sm:px-6 sm:py-8"
		>
			<TerminalFrame
				className="max-w-[min(82rem,90vw)]"
				title={`${siteMeta.name.split(" ")[0]?.toLowerCase()} — portfolio — 80×24`}
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
		</div>
	);
}
