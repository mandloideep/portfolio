import { createContext, useContext, useMemo, useState } from "react";
import { pickQuip } from "#/content/quips";

/**
 * Shares one quip across every consumer (hero, footer, terminal, chat) so the
 * page stays cohesive. The seed is generated per request on the server and
 * handed to the client via an inline script (see `__root.tsx`), so SSR and
 * hydration pick the same quip — but it's fresh on every full page load.
 * `reroll()` bumps to a new pick on demand for interactive UI.
 */
interface QuipContextValue {
	quip: string;
	reroll: () => void;
}

const QuipContext = createContext<QuipContextValue | null>(null);

export function QuipProvider({
	seed,
	children,
}: {
	seed: number;
	children: React.ReactNode;
}) {
	const [activeSeed, setActiveSeed] = useState(seed);
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
