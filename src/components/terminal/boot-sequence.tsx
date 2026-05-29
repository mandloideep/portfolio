import { useEffect } from "react";
import { siteMeta } from "#/content/site";
import { makeBlock } from "#/lib/terminal/blocks";
import { commands } from "#/lib/terminal/commands";
import { appendBlock, setBooted, terminalStore } from "#/store/terminal";

const STEP_MS = 50;

function prefersReducedMotion(): boolean {
	if (typeof window === "undefined" || !window.matchMedia) return false;
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Side-effect-only component. Mounts once at the top of the terminal route
 * and emits a banner + six fake-load lines, then flips `booted=true` on the
 * store. Under reduced motion, all lines land synchronously.
 */
export function BootSequence() {
	useEffect(() => {
		if (terminalStore.state.booted) return;

		const historyCount = terminalStore.state.history.length;
		const commandCount = commands.length;

		const banner = makeBlock("system", {
			text: `deep — portfolio terminal v0.1.0\n"${siteMeta.quip}"\ntype /help for commands, /ui to open the visual portfolio`,
		});
		const steps: Array<{ text: string }> = [
			{ text: "* loading theme registry... ok" },
			{ text: `* hydrating history (${historyCount} entries)... ok` },
			{ text: `* mounting command registry (${commandCount} commands)... ok` },
			{ text: "* checking openrouter handshake... deferred" },
			{ text: "* warming agent context... deferred" },
			{ text: "* ready." },
		];

		appendBlock(banner);

		if (prefersReducedMotion()) {
			for (const s of steps) appendBlock(makeBlock("system", s));
			setBooted(true);
			return;
		}

		const timers: ReturnType<typeof setTimeout>[] = [];
		steps.forEach((s, i) => {
			timers.push(
				setTimeout(
					() => {
						appendBlock(makeBlock("system", s));
						if (i === steps.length - 1) setBooted(true);
					},
					STEP_MS * (i + 1),
				),
			);
		});

		return () => {
			for (const t of timers) clearTimeout(t);
		};
	}, []);

	return null;
}
