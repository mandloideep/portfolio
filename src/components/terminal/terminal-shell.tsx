import { useEffect, useState } from "react";
import { HiddenCorpus } from "#/components/seo/hidden-corpus";
import { BootSequence } from "#/components/terminal/boot-sequence";
import { Chrome } from "#/components/terminal/chrome";
import { CommandPalette } from "#/components/terminal/command-palette";
import { MobileQuickChips } from "#/components/terminal/mobile-quick-chips";
import { Prompt } from "#/components/terminal/prompt";
import { Scrollback } from "#/components/terminal/scrollback";
import { StatusFooter } from "#/components/terminal/status-footer";
import { RuleAccent } from "#/components/ui/rule-accent";

export function TerminalShell() {
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
		<main
			id="main"
			data-page="terminal"
			className="surface-grain relative min-h-screen flex items-center justify-center bg-bg p-4 md:p-8"
		>
			{/* Ambient hairline above the frame for atmosphere */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-x-0 top-[12vh] h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent"
			/>

			<div className="relative z-10 w-full max-w-4xl overflow-hidden rounded-xl border border-border/80 bg-bg-elev shadow-[0_1px_0_var(--color-border),0_30px_60px_-20px_rgba(0,0,0,0.45)]">
				<Chrome />
				<RuleAccent />
				<Scrollback />
				<MobileQuickChips />
				<Prompt onOpenPalette={() => setPaletteOpen(true)} />
				<StatusFooter />
			</div>
			<BootSequence />
			<CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
			<HiddenCorpus />
		</main>
	);
}
