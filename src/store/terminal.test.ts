import { beforeEach, describe, expect, it } from "vitest";
import { makeBlock } from "#/lib/terminal/blocks";
import {
	appendBlock,
	clearBlocks,
	emit,
	HISTORY_LIMIT,
	HISTORY_STORAGE_KEY,
	pushHistory,
	setBooted,
	setHistoryCursor,
	setMode,
	terminalStore,
	updateBlock,
} from "./terminal";

beforeEach(() => {
	window.localStorage.clear();
	terminalStore.setState(() => ({
		blocks: [],
		history: [],
		historyCursor: null,
		mode: "agent",
		booted: false,
		cwd: "~",
	}));
});

describe("terminal store", () => {
	it("appends blocks", () => {
		appendBlock(makeBlock("output", { text: "a" }));
		appendBlock(makeBlock("output", { text: "b" }));
		expect(
			terminalStore.state.blocks.map((b) => "text" in b && b.text),
		).toEqual(["a", "b"]);
	});

	it("clearBlocks empties", () => {
		appendBlock(makeBlock("output", { text: "x" }));
		clearBlocks();
		expect(terminalStore.state.blocks).toEqual([]);
	});

	it("emit appends a single text block", () => {
		emit("system", "hello");
		const [b] = terminalStore.state.blocks;
		expect(b?.kind).toBe("system");
	});

	it("pushHistory dedupes consecutive duplicates", () => {
		pushHistory("/help");
		pushHistory("/help");
		pushHistory("/clear");
		pushHistory("/clear");
		expect(terminalStore.state.history).toEqual(["/help", "/clear"]);
	});

	it("pushHistory ignores empty / whitespace-only lines", () => {
		pushHistory("");
		pushHistory("   ");
		expect(terminalStore.state.history).toEqual([]);
	});

	it("pushHistory caps at HISTORY_LIMIT", () => {
		for (let i = 0; i < HISTORY_LIMIT + 25; i += 1) {
			pushHistory(`cmd-${i}`);
		}
		expect(terminalStore.state.history.length).toBe(HISTORY_LIMIT);
		expect(terminalStore.state.history[0]).toBe(`cmd-${25}`);
	});

	it("pushHistory persists to localStorage", () => {
		pushHistory("/help");
		const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
		expect(raw).not.toBeNull();
		expect(JSON.parse(raw as string)).toEqual(["/help"]);
	});

	it("updateBlock patches an existing block's text", () => {
		const block = makeBlock("markdown", { text: "Hel" });
		appendBlock(block);
		updateBlock(block.id, { text: "Hello" });
		const updated = terminalStore.state.blocks[0];
		expect(updated && "text" in updated && updated.text).toBe("Hello");
	});

	it("updateBlock is a no-op for unknown ids", () => {
		const block = makeBlock("markdown", { text: "x" });
		appendBlock(block);
		updateBlock("nope", { text: "y" });
		const after = terminalStore.state.blocks[0];
		expect(after && "text" in after && after.text).toBe("x");
	});

	it("setHistoryCursor / setBooted / setMode mutate state", () => {
		setHistoryCursor(3);
		expect(terminalStore.state.historyCursor).toBe(3);
		setBooted(true);
		expect(terminalStore.state.booted).toBe(true);
		setMode("shell");
		expect(terminalStore.state.mode).toBe("shell");
	});
});
