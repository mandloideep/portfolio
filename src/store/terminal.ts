import { Store } from "@tanstack/store";
import { type Block, makeBlock, type PromptMode } from "#/lib/terminal/blocks";

export const HISTORY_STORAGE_KEY = "portfolio.terminal.history";
export const HISTORY_LIMIT = 100;

export type TerminalState = {
	blocks: Block[];
	history: string[];
	historyCursor: number | null;
	mode: PromptMode;
	booted: boolean;
};

function readInitialHistory(): string[] {
	if (typeof window === "undefined") return [];
	try {
		const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed
			.filter((x): x is string => typeof x === "string")
			.slice(-HISTORY_LIMIT);
	} catch {
		return [];
	}
}

function persistHistory(history: string[]): void {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
	} catch {
		// private browsing / quota — best-effort
	}
}

export const terminalStore = new Store<TerminalState>({
	blocks: [],
	history: readInitialHistory(),
	historyCursor: null,
	mode: "agent",
	booted: false,
});

export function appendBlock(block: Block): void {
	terminalStore.setState((s) => ({ ...s, blocks: [...s.blocks, block] }));
}

export function appendBlocks(blocks: Block[]): void {
	terminalStore.setState((s) => ({ ...s, blocks: [...s.blocks, ...blocks] }));
}

export function clearBlocks(): void {
	terminalStore.setState((s) => ({ ...s, blocks: [] }));
}

export function pushHistory(line: string): void {
	const trimmed = line.trim();
	if (!trimmed) return;
	terminalStore.setState((s) => {
		const last = s.history[s.history.length - 1];
		if (last === trimmed) return s;
		const next = [...s.history, trimmed].slice(-HISTORY_LIMIT);
		persistHistory(next);
		return { ...s, history: next, historyCursor: null };
	});
}

export function setHistoryCursor(cursor: number | null): void {
	terminalStore.setState((s) => ({ ...s, historyCursor: cursor }));
}

export function setBooted(booted: boolean): void {
	terminalStore.setState((s) => ({ ...s, booted }));
}

export function setMode(mode: PromptMode): void {
	terminalStore.setState((s) => ({ ...s, mode }));
}

/**
 * Convenience: append a single text block of the given kind without callers
 * needing to import `makeBlock` everywhere.
 */
export function emit(
	kind: "output" | "system" | "error" | "markdown" | "activity",
	text: string,
): void {
	appendBlock(makeBlock(kind, { text }));
}
