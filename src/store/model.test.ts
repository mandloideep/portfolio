import { beforeEach, describe, expect, it } from "vitest";
import {
	DEFAULT_MODEL_ID,
	getModel,
	MODEL_STORAGE_KEY,
	modelStore,
	setModel,
} from "./model";

beforeEach(() => {
	window.localStorage.clear();
	modelStore.setState(() => ({ activeModel: DEFAULT_MODEL_ID }));
});

describe("modelStore", () => {
	it("starts at the default", () => {
		expect(getModel()).toBe(DEFAULT_MODEL_ID);
	});

	it("setModel updates store + localStorage for a known id", () => {
		const ok = setModel("anthropic/claude-haiku-4.5");
		expect(ok).toBe(true);
		expect(getModel()).toBe("anthropic/claude-haiku-4.5");
		expect(window.localStorage.getItem(MODEL_STORAGE_KEY)).toBe(
			"anthropic/claude-haiku-4.5",
		);
	});

	it("setModel rejects unknown ids without mutating state", () => {
		const ok = setModel("not/real");
		expect(ok).toBe(false);
		expect(getModel()).toBe(DEFAULT_MODEL_ID);
		expect(window.localStorage.getItem(MODEL_STORAGE_KEY)).toBeNull();
	});
});
