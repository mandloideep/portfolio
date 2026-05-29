import { Store } from "@tanstack/react-store";

/**
 * Per-IP agent quota — mirrored from the server's `quota` SSE event and the
 * standalone `GET /api/agent/quota` endpoint.
 *
 * Shape:
 *   • `tier` mirrors the tier of the active model. Free models with
 *     `FREE_MODEL_PER_IP_LIMIT=0` have `unlimited: true` and `remaining: null`.
 *   • Premium models report a numeric `remaining` against `limit`.
 *   • `remaining: null` + `unlimited: false` means "unknown" (haven't talked
 *     to the server yet) — surfaces render this as a neutral state.
 */

export type QuotaState = {
	remaining: number | null;
	limit: number;
	unlimited: boolean;
	tier: "free" | "premium" | null;
	resetsAt: string | null;
};

export const quotaStore = new Store<QuotaState>({
	remaining: null,
	limit: 0,
	unlimited: false,
	tier: null,
	resetsAt: null,
});

export function setQuota(next: Partial<QuotaState>): void {
	quotaStore.setState((s) => ({ ...s, ...next }));
}

export function decrementQuotaOptimistically(): void {
	quotaStore.setState((s) => ({
		...s,
		remaining:
			s.unlimited || s.remaining === null
				? s.remaining
				: Math.max(0, s.remaining - 1),
	}));
}
