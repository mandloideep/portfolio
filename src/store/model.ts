import { Store } from "@tanstack/store";
import {
	getActiveProviderClient,
	getDefaultModelForProvider,
	getModelsForProvider,
	isModelForProvider,
	type LlmModel,
} from "#/lib/openrouter";

export const MODEL_STORAGE_KEY = "portfolio.terminal.model";

const PROVIDER = getActiveProviderClient();
const PROVIDER_MODELS: readonly LlmModel[] = getModelsForProvider(PROVIDER);

export const DEFAULT_MODEL_ID: string = getDefaultModelForProvider(PROVIDER);

type ModelState = { activeModel: string };

function readInitial(): ModelState {
	if (typeof window === "undefined") return { activeModel: DEFAULT_MODEL_ID };
	try {
		const raw = window.localStorage.getItem(MODEL_STORAGE_KEY);
		if (raw && isModelForProvider(PROVIDER, raw)) {
			return { activeModel: raw };
		}
	} catch {
		// private browsing / restricted contexts
	}
	return { activeModel: DEFAULT_MODEL_ID };
}

export const modelStore = new Store<ModelState>(readInitial());

export function setModel(id: string): boolean {
	if (!isModelForProvider(PROVIDER, id)) return false;
	modelStore.setState(() => ({ activeModel: id }));
	if (typeof window !== "undefined") {
		try {
			window.localStorage.setItem(MODEL_STORAGE_KEY, id);
		} catch {
			// best-effort persistence
		}
	}
	return true;
}

export function getModel(): string {
	return modelStore.state.activeModel;
}

/** The model list for the currently active provider. */
export function getProviderModels(): readonly LlmModel[] {
	return PROVIDER_MODELS;
}
