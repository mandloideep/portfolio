/**
 * Scrollback block model for the terminal route.
 *
 * Discriminated union forces the renderer (`block-row.tsx`) to handle every
 * kind via an exhaustive switch. Adding a new kind without updating the
 * renderer is a TypeScript error.
 */

export type PromptMode = "agent" | "shell";

export type Block =
	| { id: string; kind: "prompt"; text: string; mode: PromptMode; ts: number }
	| { id: string; kind: "output"; text: string; ts: number }
	| { id: string; kind: "markdown"; text: string; ts: number }
	| { id: string; kind: "error"; text: string; ts: number }
	| { id: string; kind: "system"; text: string; ts: number }
	| { id: string; kind: "activity"; text: string; ts: number };

export type BlockKind = Block["kind"];

let counter = 0;

export function newId(): string {
	if (
		typeof crypto !== "undefined" &&
		typeof crypto.randomUUID === "function"
	) {
		return crypto.randomUUID();
	}
	counter += 1;
	return `b-${Date.now().toString(36)}-${counter.toString(36)}`;
}

export function makeBlock<K extends BlockKind>(
	kind: K,
	rest: Omit<Extract<Block, { kind: K }>, "id" | "kind" | "ts">,
): Extract<Block, { kind: K }> {
	return {
		id: newId(),
		kind,
		ts: Date.now(),
		...rest,
	} as Extract<Block, { kind: K }>;
}
