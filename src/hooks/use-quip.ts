import { useStore } from "@tanstack/react-store";
import { quipStore } from "#/store/quip";

export function useQuip(): string {
	return useStore(quipStore, (s) => s.current);
}
