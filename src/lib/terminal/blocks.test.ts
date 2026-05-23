import { describe, expect, it } from "vitest";
import { type Block, type BlockKind, makeBlock, newId } from "./blocks";

describe("blocks", () => {
	it("newId returns unique strings", () => {
		const ids = new Set(Array.from({ length: 50 }, () => newId()));
		expect(ids.size).toBe(50);
	});

	it("makeBlock fills id, kind, ts", () => {
		const b = makeBlock("output", { text: "hi" });
		expect(b.kind).toBe("output");
		expect(b.text).toBe("hi");
		expect(typeof b.id).toBe("string");
		expect(typeof b.ts).toBe("number");
	});

	it("covers every kind in the discriminated union", () => {
		const expected: BlockKind[] = [
			"prompt",
			"output",
			"markdown",
			"error",
			"system",
			"activity",
		];
		const built: Block[] = expected.map((kind) => {
			if (kind === "prompt") {
				return makeBlock("prompt", { text: "x", mode: "agent" });
			}
			return makeBlock(kind, { text: "x" });
		});
		expect(built.map((b) => b.kind).sort()).toEqual([...expected].sort());
	});
});
