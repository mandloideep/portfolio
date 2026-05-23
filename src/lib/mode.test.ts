import { describe, expect, it } from "vitest";
import { getStoredMode, isMode, MODE_STORAGE_KEY, setStoredMode } from "./mode";

function makeFakeStorage(): Storage {
	const map = new Map<string, string>();
	return {
		get length() {
			return map.size;
		},
		clear: () => map.clear(),
		getItem: (k) => map.get(k) ?? null,
		key: (i) => Array.from(map.keys())[i] ?? null,
		removeItem: (k) => {
			map.delete(k);
		},
		setItem: (k, v) => {
			map.set(k, v);
		},
	};
}

describe("isMode", () => {
	it.each([
		["ui", true],
		["terminal", true],
		["UI", false],
		["", false],
		[null, false],
		[undefined, false],
		[42, false],
	] as const)("isMode(%j) → %s", (input, expected) => {
		expect(isMode(input)).toBe(expected);
	});
});

describe("getStoredMode / setStoredMode", () => {
	it("returns null when nothing stored", () => {
		const s = makeFakeStorage();
		expect(getStoredMode(s)).toBeNull();
	});

	it("round-trips a valid mode", () => {
		const s = makeFakeStorage();
		setStoredMode(s, "ui");
		expect(s.getItem(MODE_STORAGE_KEY)).toBe("ui");
		expect(getStoredMode(s)).toBe("ui");
	});

	it("returns null on garbage values", () => {
		const s = makeFakeStorage();
		s.setItem(MODE_STORAGE_KEY, "nonsense");
		expect(getStoredMode(s)).toBeNull();
	});

	it("survives a storage that throws", () => {
		const s = {
			getItem: () => {
				throw new Error("nope");
			},
			setItem: () => {
				throw new Error("nope");
			},
		};
		expect(getStoredMode(s)).toBeNull();
		expect(() => setStoredMode(s, "ui")).not.toThrow();
	});
});
