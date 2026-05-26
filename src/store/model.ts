import { Store } from "@tanstack/react-store";
import {
	getAvailableModelsClient,
	getDefaultModelClient,
	isModelAllowed,
	type LlmModel,
} from "#/lib/agent/models";

/**
 * Active model preference, persisted to localStorage. Schema v2 lets us
 * iterate the catalog without invalidating every user's saved choice — the
 * stored value is `{ version: 2, model }`. Reads from the v1 schema (a bare
 * model id) are migrated transparently.
 */

export const MODEL_STORAGE_KEY = "portfolio.agent.v2";
const LEGACY_KEYS = ["portfolio.terminal.model"];

/** Legacy export retained so older tests + callers keep compiling. The
 *  preferred shape is `getDefaultModelClient().id`. */
export const DEFAULT_MODEL_ID: string = getDefaultModelClient().id;

type StoredV2 = { version: 2; model: string };

type ModelState = { activeModel: string };

function readInitial(): ModelState {
	const defaultId = getDefaultModelClient().id;
	if (typeof window === "undefined") return { activeModel: defaultId };
	try {
		const raw = window.localStorage.getItem(MODEL_STORAGE_KEY);
		if (raw) {
			try {
				const parsed = JSON.parse(raw) as Partial<StoredV2>;
				if (
					parsed &&
					parsed.version === 2 &&
					typeof parsed.model === "string" &&
					isModelAllowed(parsed.model)
				) {
					return { activeModel: parsed.model };
				}
			} catch {
				// fall through to legacy
			}
		}
		for (const k of LEGACY_KEYS) {
			const legacy = window.localStorage.getItem(k);
			if (legacy && isModelAllowed(legacy)) {
				// Migrate forward, leave legacy key in place for now in case
				// the user downgrades.
				try {
					const v2: StoredV2 = { version: 2, model: legacy };
					window.localStorage.setItem(MODEL_STORAGE_KEY, JSON.stringify(v2));
				} catch {
					// best-effort
				}
				return { activeModel: legacy };
			}
		}
	} catch {
		// private browsing / restricted contexts
	}
	return { activeModel: defaultId };
}

export const modelStore = new Store<ModelState>(readInitial());

export function setModel(id: string): boolean {
	if (!isModelAllowed(id)) return false;
	modelStore.setState(() => ({ activeModel: id }));
	if (typeof window !== "undefined") {
		try {
			const v2: StoredV2 = { version: 2, model: id };
			window.localStorage.setItem(MODEL_STORAGE_KEY, JSON.stringify(v2));
		} catch {
			// best-effort persistence
		}
	}
	return true;
}

export function getModel(): string {
	return modelStore.state.activeModel;
}

/** The model list visible to this deploy. */
export function getProviderModels(): readonly LlmModel[] {
	return getAvailableModelsClient();
}
