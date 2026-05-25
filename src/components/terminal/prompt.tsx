import { useStore } from "@tanstack/react-store";
import {
	type KeyboardEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { autocomplete } from "#/lib/terminal/commands";
import { abortTour, isTourRunning } from "#/lib/terminal/tour";
import {
	clearBlocks,
	emit,
	setHistoryCursor,
	setMode,
	terminalStore,
} from "#/store/terminal";
import { abortAgentStream, isAgentStreaming } from "./use-agent-stream";
import { useSubmit } from "./use-submit";

type Props = {
	onOpenPalette: () => void;
};

/**
 * Prompt input. Handles submit, multi-line, history traversal, and the
 * Ctrl+L / Ctrl+K / Tab shortcuts. Ctrl+K is forwarded via `onOpenPalette`
 * so the dialog can live alongside the prompt without coupling.
 */
export function Prompt({ onOpenPalette }: Props) {
	const mode = useStore(terminalStore, (s) => s.mode);
	const [value, setValue] = useState("");
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const ctrlCArmedRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const submit = useSubmit();

	useEffect(() => {
		textareaRef.current?.focus();
	}, []);

	const focusPrompt = useCallback(() => {
		textareaRef.current?.focus();
	}, []);

	useEffect(() => {
		// Refocus the prompt whenever the user clicks anywhere that isn't
		// a button, input, or the palette dialog.
		function handler(e: MouseEvent) {
			const target = e.target as HTMLElement | null;
			if (!target) return;
			if (target.closest("button, a, input, textarea, [role=dialog]")) return;
			focusPrompt();
		}
		document.addEventListener("click", handler);
		return () => document.removeEventListener("click", handler);
	}, [focusPrompt]);

	function setFromHistory(direction: -1 | 1) {
		const { history, historyCursor } = terminalStore.state;
		if (history.length === 0) return;
		let next: number | null;
		if (historyCursor === null) {
			next = direction === -1 ? history.length - 1 : null;
		} else {
			const candidate = historyCursor + direction;
			if (candidate < 0) {
				next = 0;
			} else if (candidate >= history.length) {
				next = null;
			} else {
				next = candidate;
			}
		}
		setHistoryCursor(next);
		setValue(next === null ? "" : (history[next] ?? ""));
	}

	function handleTab() {
		const matches = autocomplete(value, mode);
		if (matches.length === 0) return;
		if (matches.length === 1) {
			setValue(`${matches[0]} `);
			return;
		}
		// Longest common prefix
		const lcp = matches.reduce((acc, m) => {
			let i = 0;
			while (i < acc.length && i < m.length && acc[i] === m[i]) i += 1;
			return acc.slice(0, i);
		});
		if (lcp.length > value.length) {
			setValue(lcp);
			return;
		}
		// No further auto-completion possible; surface the choices as a hint.
		emitTabHint(matches);
	}

	function emitTabHint(matches: string[]) {
		emit("system", `[tab] ${matches.join("  ")}`);
	}

	async function handleSubmit() {
		const raw = value;
		setValue("");
		setHistoryCursor(null);
		await submit(raw);
	}

	function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
		// Multi-line newline.
		if (e.key === "Enter" && e.shiftKey) {
			return;
		}
		if (e.key === "Enter") {
			e.preventDefault();
			void handleSubmit();
			return;
		}
		if (e.key === "ArrowUp" && !e.shiftKey) {
			// Only traverse history when caret is on first line.
			const el = e.currentTarget;
			const before = el.value.slice(0, el.selectionStart ?? 0);
			if (!before.includes("\n")) {
				e.preventDefault();
				setFromHistory(-1);
			}
			return;
		}
		if (e.key === "ArrowDown" && !e.shiftKey) {
			const el = e.currentTarget;
			const after = el.value.slice(el.selectionEnd ?? el.value.length);
			if (!after.includes("\n")) {
				e.preventDefault();
				setFromHistory(1);
			}
			return;
		}
		if (e.ctrlKey && e.key.toLowerCase() === "c") {
			// Tour or stream running → abort it.
			if (isTourRunning()) {
				e.preventDefault();
				abortTour();
				return;
			}
			if (isAgentStreaming()) {
				e.preventDefault();
				abortAgentStream();
				return;
			}
			// Preserve native copy when the user has actually selected text.
			const el = e.currentTarget;
			const selectionStart = el.selectionStart ?? 0;
			const selectionEnd = el.selectionEnd ?? 0;
			if (selectionEnd > selectionStart) return;
			// Double-tap to exit agent mode. First press primes the timer +
			// emits a hint; a second within 2s flips to shell.
			if (mode !== "agent") return;
			e.preventDefault();
			if (ctrlCArmedRef.current) {
				clearTimeout(ctrlCArmedRef.current);
				ctrlCArmedRef.current = null;
				setMode("shell");
				emit(
					"system",
					"dropped into shell. type `help` for commands, `deep` to return.",
				);
				return;
			}
			emit("system", "(ctrl+c again to drop into shell)");
			ctrlCArmedRef.current = setTimeout(() => {
				ctrlCArmedRef.current = null;
			}, 2000);
			return;
		}
		if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "l") {
			e.preventDefault();
			clearBlocks();
			return;
		}
		if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
			e.preventDefault();
			onOpenPalette();
			return;
		}
		if (e.key === "Tab") {
			e.preventDefault();
			handleTab();
			return;
		}
	}

	const rows = Math.min(8, Math.max(1, value.split("\n").length));
	const streaming =
		useStore(terminalStore, (s) =>
			s.blocks.some((b) => b.kind === "activity"),
		) && value.length === 0;
	const symbol = mode === "shell" ? "$" : "❯";

	return (
		<form
			data-testid="prompt-form"
			data-state={streaming ? "streaming" : "idle"}
			onSubmit={(e) => {
				e.preventDefault();
				void handleSubmit();
			}}
			className="flex items-start gap-2.5 border-t border-border bg-bg-elev/60 px-5 py-3.5 font-mono text-base transition-colors duration-base focus-within:bg-bg-elev/80"
		>
			<label htmlFor="terminal-prompt" className="sr-only">
				Terminal prompt
			</label>
			<span className="flex shrink-0 items-center gap-2 pt-[3px] font-semibold select-none">
				<span className="status-dot" aria-hidden="true" />
				<span>
					<span className="text-prompt-user">deep</span>
					<span className="text-prompt-symbol">@</span>
					<span className="text-prompt-host">portfolio</span>
					<span className="text-prompt-symbol">:~ {symbol}</span>
				</span>
			</span>
			<textarea
				id="terminal-prompt"
				ref={textareaRef}
				data-testid="prompt-input"
				value={value}
				onChange={(e) => setValue(e.target.value)}
				onKeyDown={onKeyDown}
				rows={rows}
				autoComplete="off"
				autoCorrect="off"
				autoCapitalize="off"
				spellCheck={false}
				aria-busy={streaming}
				className="flex-1 resize-none bg-transparent font-mono text-fg caret-accent outline-none placeholder:text-muted/70"
				placeholder="type /help"
			/>
		</form>
	);
}
