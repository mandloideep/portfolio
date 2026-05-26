/**
 * Quips emitted while `/stats` is fetching. Picked at random so repeat
 * runs feel fresh; the goal is just to convey "agent is doing something".
 */
export const FETCH_QUIPS = [
	"counting green squares…",
	"summoning the octocat…",
	"polling the graph…",
	"shuffling commits…",
	"interrogating GraphQL…",
	"tallying yaks shaved…",
	"asking nicely…",
	"counting stars…",
	"reading the changelog…",
] as const;

/**
 * System prompt for the snark-commentary call. Kept short so Gemma's
 * reasoning budget doesn't eat the response.
 */
export const COMMENTARY_PROMPT = `You are a wry, observant narrator of someone's GitHub activity.
Given the JSON of their stats, write ONE deadpan, honest sentence (max 25 words) that captures what the numbers say about how they code.
Do not praise. Do not be mean. Be observant.
Avoid quoting raw numbers; describe patterns instead.
Output just the sentence — no preamble, no markdown.`;

export function pickQuip(): string {
	const i = Math.floor(Math.random() * FETCH_QUIPS.length);
	return FETCH_QUIPS[i] ?? "loading…";
}
