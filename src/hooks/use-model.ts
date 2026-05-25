import { useStore } from "@tanstack/react-store";
import { OPENROUTER_MODELS } from "#/lib/openrouter";
import { modelStore, setModel } from "#/store/model";

/**
 * Read + change the active OpenRouter model. Mirrors `useTheme()`.
 */
export function useModel() {
	const activeModel = useStore(modelStore, (s) => s.activeModel);
	return {
		activeModel,
		setModel,
		models: OPENROUTER_MODELS,
	};
}
