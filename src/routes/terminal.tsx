import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BootSequence } from "#/components/terminal/boot-sequence";
import { Chrome } from "#/components/terminal/chrome";
import { CommandPalette } from "#/components/terminal/command-palette";
import { Prompt } from "#/components/terminal/prompt";
import { Scrollback } from "#/components/terminal/scrollback";
import { StatusFooter } from "#/components/terminal/status-footer";

export const Route = createFileRoute("/terminal")({ component: Terminal });

function Terminal() {
	const [paletteOpen, setPaletteOpen] = useState(false);

	useEffect(() => {
		// Global Ctrl/Cmd+K opens the palette from anywhere on the route.
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
		<main className="min-h-screen flex items-center justify-center p-4 md:p-8">
			<div className="w-full max-w-4xl rounded-lg border border-border bg-bg shadow-2xl overflow-hidden">
				<Chrome />
				<Scrollback />
				<Prompt onOpenPalette={() => setPaletteOpen(true)} />
				<StatusFooter />
			</div>
			<BootSequence />
			<CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
		</main>
	);
}
