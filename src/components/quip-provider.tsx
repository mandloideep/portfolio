import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { pickQuip } from "#/content/quips";

/**
 * Shares one quip across every consumer (hero, footer, terminal, chat) so the
 * page stays cohesive.
 *
 * The first render always uses the `seed` embedded in the HTML, so it matches
 * the server/prerendered output exactly — no hydration mismatch, no warnings.
 *
 * Whether we reroll after mount depends on `renderedAt` (the time the HTML was
 * produced, also embedded):
 *   - Per-request SSR route (/chat): `renderedAt` is ~now, so the server's
 *     quip is already fresh for this load — we keep it. No reroll, no flash.
 *   - Prerendered route (/, /terminal): `renderedAt` is frozen at build time,
 *     so it reads as stale and we reroll to a fresh client pick. This is the
 *     only way to rotate on a static page, which has no per-request server.
 * The provider mounts once at the root shell, so any reroll fires once per
 * full page load (refresh) — never on client-side navigation.
 *
 * `reroll()` is also exposed for interactive UI.
 */
// Older than this (ms) ⇒ the HTML is a prerendered static asset, not a fresh
// per-request render. SSR renders run within milliseconds of the request.
const STALE_AFTER_MS = 10_000;

interface QuipContextValue {
	quip: string;
	reroll: () => void;
}

const QuipContext = createContext<QuipContextValue | null>(null);

export function QuipProvider({
	seed,
	renderedAt,
	children,
}: {
	seed: number;
	renderedAt: number;
	children: React.ReactNode;
}) {
	const [activeSeed, setActiveSeed] = useState(seed);
	useEffect(() => {
		if (Date.now() - renderedAt > STALE_AFTER_MS) {
			setActiveSeed(Math.floor(Math.random() * 1e9));
		}
	}, [renderedAt]);
	const value = useMemo<QuipContextValue>(
		() => ({
			quip: pickQuip(activeSeed),
			reroll: () => setActiveSeed(Math.floor(Math.random() * 1e9)),
		}),
		[activeSeed],
	);
	return <QuipContext.Provider value={value}>{children}</QuipContext.Provider>;
}

export function useQuipContext(): QuipContextValue {
	// Fallback keeps standalone renders (e.g. unit tests) working without a
	// provider; it still returns a real quip from the registry.
	return useContext(QuipContext) ?? { quip: pickQuip(0), reroll: () => {} };
}
