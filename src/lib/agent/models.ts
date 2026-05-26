/**
 * Unified model catalog. Each entry carries its own `provider` so a single
 * deploy can ship models from both OpenRouter and Gemini direct — the
 * per-request API handler resolves the provider via `getProviderForModel`.
 *
 * `tier` drives the rate-limit branch (free → only Google's shared
 * RPM/RPD apply; premium → per-IP `PREMIUM_LIMIT` cap from env). `thinking`
 * is the signal that the server should emit `thinking` SSE events for this
 * model and that the UI should render a thinking peek.
 */

export const PROVIDERS = ["openrouter", "gemini"] as const;
export type Provider = (typeof PROVIDERS)[number];

export function isProvider(value: unknown): value is Provider {
	return (
		typeof value === "string" &&
		(PROVIDERS as readonly string[]).includes(value)
	);
}

export type LlmModel = {
	id: string;
	provider: Provider;
	label: string;
	blurb: string;
	tier: "free" | "premium";
	thinking: boolean;
	/**
	 * OpenRouter-only: comma-list of additional model ids to fall back to
	 * when the primary returns an error (notably 429 from the free pool).
	 * OpenRouter walks the list in order on the same request — billed only
	 * for whichever model actually served the response. We use this to
	 * upgrade the free Gemma slug to the paid Cloudflare-backed one when
	 * the free pool is throttled.
	 */
	fallbacks?: readonly string[];
};

/**
 * The three slots the terminal/chat UI lets visitors pick between. Order
 * matters — `getDefaultModel` returns the first entry whose provider key is
 * configured, so the "fast" free model wins by default when OpenRouter is
 * set up.
 *
 * Slug verification: `google/gemma-4-26b-a4b-it:free` is the slug the user
 * provided. Confirm against the live OpenRouter catalog before merging:
 *   curl -s https://openrouter.ai/api/v1/models \
 *     | jq '.data[] | select(.id|test("gemma";"i")) | {id,pricing}'
 */
export const MODELS: readonly LlmModel[] = [
	{
		id: "google/gemma-4-26b-a4b-it:free",
		provider: "openrouter",
		label: "Gemma 4 26B · fast",
		blurb: "no reasoning · fastest first token",
		tier: "free",
		thinking: false,
		// Free slug runs only through Google AI Studio upstream; when it
		// 429s (shared pool), OpenRouter auto-retries the paid slug —
		// constrained to Cloudflare via the deploy's allowed-providers
		// guardrails. ~$0.0007 per ~500-token reply.
		fallbacks: ["google/gemma-4-26b-a4b-it"],
	},
	{
		id: "gemma-4-31b-it",
		provider: "gemini",
		label: "Gemma 4 31B · thinking",
		blurb: "shows reasoning · slower but deeper",
		tier: "free",
		thinking: true,
	},
	{
		id: "gemini-2.5-flash-lite",
		provider: "gemini",
		label: "Gemini 2.5 Flash Lite",
		blurb: "premium · capped per visitor",
		tier: "premium",
		thinking: false,
	},
] as const;

export function getModel(id: string): LlmModel | undefined {
	return MODELS.find((m) => m.id === id);
}

export function isModelAllowed(id: string): boolean {
	return MODELS.some((m) => m.id === id);
}

export function isPremiumModel(id: string): boolean {
	return getModel(id)?.tier === "premium";
}

export function isThinkingModel(id: string): boolean {
	return getModel(id)?.thinking === true;
}

export function getProviderForModel(id: string): Provider | undefined {
	return getModel(id)?.provider;
}

/**
 * Filter the catalog to the subset of models whose provider key is set in
 * the given env. Used both server-side (admission gate) and client-side
 * (catalog the model switcher shows). A dev with only `GEMINI_API_KEY` set
 * still gets a working subset rather than an empty list.
 */
export type EnvKeys = {
	OPENROUTER_API_KEY?: string | undefined;
	GEMINI_API_KEY?: string | undefined;
};

export function getAvailableModels(env: EnvKeys): readonly LlmModel[] {
	return MODELS.filter((m) => providerHasKey(m.provider, env));
}

export function providerHasKey(p: Provider, env: EnvKeys): boolean {
	if (p === "openrouter") return Boolean(env.OPENROUTER_API_KEY);
	return Boolean(env.GEMINI_API_KEY);
}

/**
 * Default model = first available free model. Falls back to the first
 * available model of any tier if no free model has a configured key.
 * Returns the static first entry as a last resort so callers always get
 * something hashable; the api route validates allowlist before use.
 */
export function getDefaultModel(env: EnvKeys): LlmModel {
	const available = getAvailableModels(env);
	const firstFree = available.find((m) => m.tier === "free");
	if (firstFree) return firstFree;
	if (available[0]) return available[0];
	// Catalog is empty for this env — caller should have validated keys
	// before relying on a real provider. Fall back to the first declared
	// entry; downstream calls will fail explicitly if the key truly isn't
	// there.
	const fallback = MODELS[0];
	if (!fallback) throw new Error("model catalog is empty");
	return fallback;
}

/** Client-side: read `import.meta.env.VITE_AGENT_MODELS` (a JSON blob
 *  populated at build time from `getAvailableModels(env)`). Falls back to
 *  the full catalog when missing — useful in unit tests + dev. */
export function getAvailableModelsClient(): readonly LlmModel[] {
	const raw = (
		import.meta as unknown as {
			env?: Record<string, string | undefined>;
		}
	).env?.VITE_AGENT_MODELS;
	if (!raw) return MODELS;
	try {
		const parsed = JSON.parse(raw) as Array<{ id: string }>;
		const allowedIds = new Set(parsed.map((m) => m.id));
		const filtered = MODELS.filter((m) => allowedIds.has(m.id));
		return filtered.length > 0 ? filtered : MODELS;
	} catch {
		return MODELS;
	}
}

export function getDefaultModelClient(): LlmModel {
	const available = getAvailableModelsClient();
	const firstFree = available.find((m) => m.tier === "free");
	const chosen = firstFree ?? available[0];
	if (!chosen) {
		const fallback = MODELS[0];
		if (!fallback) throw new Error("model catalog is empty");
		return fallback;
	}
	return chosen;
}
