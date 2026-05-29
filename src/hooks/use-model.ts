import { useStore } from "@tanstack/react-store";
import { getProviderModels, modelStore, setModel } from "#/store/model";

/**
 * Read + change the active LLM model for the currently configured provider.
 * The model list comes from the active provider (OpenRouter or Gemini)
 * via `VITE_LLM_PROVIDER`. Mirrors `useTheme()`.
 */
export function useModel() {
	const activeModel = useStore(modelStore, (s) => s.activeModel);
	return {
		activeModel,
		setModel,
		models: getProviderModels(),
	};
}
