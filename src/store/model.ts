import { Store } from "@tanstack/store";
import {
	isOpenRouterModel,
	OPENROUTER_MODELS,
	type OpenRouterModelId,
} from "#/lib/openrouter";

export const MODEL_STORAGE_KEY = "portfolio.terminal.model";

export const DEFAULT_MODEL_ID: OpenRouterModelId = OPENROUTER_MODELS[0].id;

type ModelState = { activeModel: OpenRouterModelId };

function readInitial(): ModelState {
	if (typeof window === "undefined") return { activeModel: DEFAULT_MODEL_ID };
	try {
		const raw = window.localStorage.getItem(MODEL_STORAGE_KEY);
		if (raw && isOpenRouterModel(raw)) return { activeModel: raw };
	} catch {
		// private browsing / restricted contexts
	}
	return { activeModel: DEFAULT_MODEL_ID };
}

export const modelStore = new Store<ModelState>(readInitial());

export function setModel(id: string): boolean {
	if (!isOpenRouterModel(id)) return false;
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

export function getModel(): OpenRouterModelId {
	return modelStore.state.activeModel;
}
