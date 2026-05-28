import { useQuipContext } from "#/components/quip-provider";

export function useQuip(): string {
	return useQuipContext().quip;
}
