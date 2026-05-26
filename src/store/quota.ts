import { Store } from "@tanstack/react-store";

/**
 * Per-IP agent quota — mirrored from the server's `quota` SSE event and the
 * standalone `GET /api/agent/quota` endpoint. `remaining: null` means
 * "unknown" (haven't talked to the server yet); the footer treats that as a
 * neutral state instead of showing a misleading number.
 */

export type QuotaState = {
	remaining: number | null;
	limit: number;
	resetsAt: string | null;
};

export const quotaStore = new Store<QuotaState>({
	remaining: null,
	limit: 5,
	resetsAt: null,
});

export function setQuota(next: Partial<QuotaState>): void {
	quotaStore.setState((s) => ({ ...s, ...next }));
}

export function decrementQuotaOptimistically(): void {
	quotaStore.setState((s) => ({
		...s,
		remaining: s.remaining === null ? null : Math.max(0, s.remaining - 1),
	}));
}
