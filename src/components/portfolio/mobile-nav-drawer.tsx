/**
 * <MobileNav> — slim sticky header + slide-out drawer that replaces the
 * 7-tab horizontal nav on phones. Below `sm`, the desktop <TopTabs>
 * overflows; this gives one burger button that opens a left Sheet with
 * each route as a vertical row.
 *
 * Mirrors the chat header pattern: brand chip on the left, settings on
 * the right, route drawer behind the burger. Themes + density share the
 * <SettingsSheet> so the same controls follow the visitor everywhere.
 */

import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, MessageSquare, Settings2 } from "lucide-react";
import { useState } from "react";
import { SettingsSheet } from "#/components/ui/settings-sheet";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "#/components/ui/sheet";
import { siteMeta } from "#/content/site";
import { cn } from "#/lib/utils";
import type { TopTab } from "./top-tabs";

type Props = {
	items: readonly TopTab[];
};

export function MobileNav({ items }: Props) {
	const [navOpen, setNavOpen] = useState(false);
	const [settingsOpen, setSettingsOpen] = useState(false);
	const pathname = useRouterState({ select: (s) => s.location.pathname });

	return (
		<div
			data-testid="portfolio-mobile-nav"
			className="flex items-center gap-2 border-b border-border/70 bg-bg-elev/95 px-3 py-2 sm:hidden"
		>
			<button
				type="button"
				data-testid="portfolio-mobile-nav-trigger"
				aria-label="open menu"
				onClick={() => setNavOpen(true)}
				className="inline-flex size-10 items-center justify-center rounded-card border border-border/70 bg-bg/40 text-fg transition-colors duration-base hover:bg-accent/10 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			>
				<Menu className="size-4" aria-hidden="true" />
			</button>

			<Link
				to="/"
				className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-card border border-border/70 bg-bg/40 px-3 font-mono text-meta uppercase tracking-tab text-muted transition-colors duration-base hover:bg-accent/10 hover:text-accent"
			>
				<span aria-hidden="true" className="text-prompt-user">
					$
				</span>
				<span>{siteMeta.name.toLowerCase()} — portfolio</span>
			</Link>

			<button
				type="button"
				data-testid="portfolio-mobile-settings"
				aria-label="open settings"
				onClick={() => setSettingsOpen(true)}
				className="inline-flex size-10 items-center justify-center rounded-card border border-border/70 bg-bg/40 text-fg transition-colors duration-base hover:bg-accent/10 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			>
				<Settings2 className="size-4" aria-hidden="true" />
			</button>

			<Sheet open={navOpen} onOpenChange={setNavOpen}>
				<SheetContent
					side="left"
					className="border-border bg-bg p-0 sm:max-w-xs"
					data-testid="portfolio-mobile-nav-sheet"
				>
					<SheetHeader className="border-border/60 border-b px-5 py-4">
						<SheetTitle className="font-mono text-meta uppercase tracking-tab text-fg">
							navigate
						</SheetTitle>
					</SheetHeader>
					<nav
						aria-label="portfolio sections"
						className="flex flex-col gap-1 px-3 py-3"
					>
						{items.map((item) => {
							const isActive =
								item.to === "/"
									? pathname === "/"
									: pathname === item.to || pathname.startsWith(`${item.to}/`);
							return (
								<SheetClose asChild key={item.id}>
									<Link
										to={item.to}
										data-testid={`mobile-nav-${item.id}`}
										aria-current={isActive ? "page" : undefined}
										className={cn(
											"flex items-center justify-between gap-3 rounded-card border px-4 py-3 font-mono text-base transition-colors duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
											isActive
												? "border-accent/60 bg-accent/15 text-accent"
												: "border-border/60 bg-bg-elev/40 text-fg hover:border-accent/40 hover:bg-accent/10",
										)}
									>
										<span>[{item.label}]</span>
										{isActive ? (
											<span
												aria-hidden="true"
												className="text-meta text-accent/80"
											>
												●
											</span>
										) : null}
									</Link>
								</SheetClose>
							);
						})}
					</nav>
				</SheetContent>
			</Sheet>

			<SettingsSheet
				open={settingsOpen}
				onOpenChange={setSettingsOpen}
				showModel={false}
			>
				<SheetClose asChild>
					<a
						href="/chat"
						className="flex w-full items-center gap-3 rounded-card border border-border/60 bg-bg-elev/40 px-4 py-3 text-left font-mono text-meta uppercase tracking-tab text-fg transition-colors duration-base hover:border-accent/60 hover:bg-accent/10 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					>
						<MessageSquare className="size-4" aria-hidden="true" />
						<span>open chat</span>
					</a>
				</SheetClose>
			</SettingsSheet>
		</div>
	);
}
