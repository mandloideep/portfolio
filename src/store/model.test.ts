import { beforeEach, describe, expect, it } from "vitest";
import {
	DEFAULT_MODEL_ID,
	getModel,
	getProviderModels,
	MODEL_STORAGE_KEY,
	modelStore,
	setModel,
} from "./model";

beforeEach(() => {
	window.localStorage.clear();
	modelStore.setState(() => ({ activeModel: DEFAULT_MODEL_ID }));
});

// Pick a model from the active provider's catalog that isn't the default.
// Keeps the test independent of which provider .env.development points at.
function pickNonDefaultModelId(): string {
	const models = getProviderModels();
	const alt = models.find((m) => m.id !== DEFAULT_MODEL_ID);
	if (!alt) {
		throw new Error(
			"active provider has only one model — this test needs at least two",
		);
	}
	return alt.id;
}

describe("modelStore", () => {
	it("starts at the default", () => {
		expect(getModel()).toBe(DEFAULT_MODEL_ID);
	});

	it("setModel updates store + localStorage for a known id", () => {
		const target = pickNonDefaultModelId();
		const ok = setModel(target);
		expect(ok).toBe(true);
		expect(getModel()).toBe(target);
		const stored = window.localStorage.getItem(MODEL_STORAGE_KEY);
		expect(stored).toBeTruthy();
		expect(JSON.parse(stored ?? "{}")).toMatchObject({
			version: 2,
			model: target,
		});
	});

	it("setModel rejects unknown ids without mutating state", () => {
		const ok = setModel("not/real");
		expect(ok).toBe(false);
		expect(getModel()).toBe(DEFAULT_MODEL_ID);
		expect(window.localStorage.getItem(MODEL_STORAGE_KEY)).toBeNull();
	});
});
