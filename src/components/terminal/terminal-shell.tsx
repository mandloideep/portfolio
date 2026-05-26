import { Link } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { AgentEngineProvider } from "#/components/agent/agent-engine-provider";
import { HiddenCorpus } from "#/components/seo/hidden-corpus";
import { BootSequence } from "#/components/terminal/boot-sequence";
import { Chrome } from "#/components/terminal/chrome";
import { CommandPalette } from "#/components/terminal/command-palette";
import { CommandRail } from "#/components/terminal/command-rail";
import { MobileChrome } from "#/components/terminal/mobile-chrome";
import { Prompt } from "#/components/terminal/prompt";
import { Scrollback } from "#/components/terminal/scrollback";
import { StatusFooter } from "#/components/terminal/status-footer";
import { useTerminalAgentBinding } from "#/components/terminal/use-terminal-agent-binding";
import { CommandHint } from "#/components/ui/command-hint";
import { DensityToggle } from "#/components/ui/density-toggle";
import { LocalTime } from "#/components/ui/local-time";
import { RuleAccent } from "#/components/ui/rule-accent";
import { StatusPill } from "#/components/ui/status-pill";
import { ThemeSwitcher } from "#/components/ui/theme-switcher";
import { siteMeta } from "#/content/site";
import { useDensity } from "#/hooks/use-density";

export function TerminalShell() {
	return (
		<AgentEngineProvider>
			<TerminalShellInner />
		</AgentEngineProvider>
	);
}

function TerminalShellInner() {
	const [paletteOpen, setPaletteOpen] = useState(false);
	useDensity();
	useTerminalAgentBinding();

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

	function focusPrompt() {
		const ta = document.querySelector<HTMLTextAreaElement>(
			"[data-testid='prompt-input']",
		);
		ta?.focus();
	}

	return (
		<main
			id="main"
			data-page="terminal"
			className="surface-grain relative flex min-h-[100dvh] items-start justify-center bg-bg p-0 sm:p-4 md:p-8"
			style={{ paddingTop: "env(safe-area-inset-top)" }}
		>
			{/* Ambient hairline above the frame for atmosphere (desktop only) */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-x-0 top-[12vh] hidden h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent sm:block"
			/>

			<div className="relative z-overlay mx-auto flex min-h-[100dvh] w-full max-w-[min(82rem,100vw)] flex-col overflow-hidden bg-bg-elev sm:min-h-0 sm:max-w-[min(82rem,90vw)] sm:rounded-card sm:border sm:border-border/80 sm:shadow-frame">
				{/* Desktop chrome */}
				<div className="hidden sm:block">
					<Chrome
						title="~ — agent"
						closeTo="/"
						closeSearch={{ choose: 1 }}
						controls={
							<>
								<LocalTime className="hidden md:inline-flex" />
								<CommandHint onOpen={() => setPaletteOpen(true)} />
								<DensityToggle />
								<ThemeSwitcher />
								<Link
									to="/chat"
									data-testid="terminal-chat-link"
									className="inline-flex items-center gap-1.5 rounded-card border border-border/70 bg-bg/40 px-2 py-1 font-mono text-meta text-muted transition-colors duration-base hover:bg-accent/10 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
								>
									<MessageSquare className="size-3" aria-hidden="true" />
									<span className="hidden sm:inline">/chat</span>
								</Link>
							</>
						}
					/>
					<RuleAccent />
					<div className="flex items-center gap-2 border-b border-border/60 bg-bg/40 px-5 py-2">
						<StatusPill status={siteMeta.status} />
					</div>
				</div>

				{/* Mobile chrome */}
				<div className="sm:hidden">
					<MobileChrome onOpenPalette={() => setPaletteOpen(true)} />
				</div>

				<Scrollback />
				<CommandRail
					onOpenPalette={() => setPaletteOpen(true)}
					onFocusPrompt={focusPrompt}
				/>
				<Prompt onOpenPalette={() => setPaletteOpen(true)} />
				<StatusFooter />
			</div>
			<BootSequence />
			<CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
			<HiddenCorpus />
		</main>
	);
}
