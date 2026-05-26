import { useCallback } from "react";
import { makeBlock } from "#/lib/terminal/blocks";
import { modelStore } from "#/store/model";
import { setQuota } from "#/store/quota";
import {
	appendBlock,
	emit,
	terminalStore,
	updateBlock,
} from "#/store/terminal";

/**
 * Client-side consumer of `POST /api/agent`. Parses the SSE stream and
 * folds tokens into a single growing `markdown` block, with `activity`
 * lines for the reading/calling steps and an optional trailing system
 * line for usage.
 *
 * Active stream lives in a module-scoped ref so `Ctrl+C` in the prompt
 * can find and abort it without prop-drilling.
 */

let activeController: AbortController | null = null;

export function isAgentStreaming(): boolean {
	return activeController !== null;
}

export function abortAgentStream(): boolean {
	if (!activeController) return false;
	activeController.abort();
	activeController = null;
	return true;
}

export type StreamHandle = {
	start: (message: string) => Promise<void>;
	abort: () => boolean;
};

export function useAgentStream(): StreamHandle {
	const start = useCallback(async (message: string) => {
		if (activeController) {
			// One stream at a time. Cancel the outgoing one so the new prompt
			// supersedes it cleanly.
			activeController.abort();
			activeController = null;
		}
		const controller = new AbortController();
		activeController = controller;

		const history = recentHistoryFromBlocks();
		const body = JSON.stringify({
			message,
			history,
			model: modelStore.state.activeModel,
		});

		try {
			let res: Response;
			try {
				res = await fetch("/api/agent", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body,
					signal: controller.signal,
				});
			} catch (err) {
				if (!isAbortError(err) && !controller.signal.aborted) {
					emit("error", `network: ${errorMessage(err)}`);
				}
				return;
			}

			if (!res.ok || !res.body) {
				emit("error", `agent: ${res.status} ${res.statusText}`);
				return;
			}

			try {
				await consumeStream(res.body, controller.signal);
			} catch (err) {
				if (!isAbortError(err) && !controller.signal.aborted) {
					emit("error", `agent: ${errorMessage(err)}`);
				}
			}
		} finally {
			if (controller.signal.aborted) {
				emit("system", "^C aborted");
			}
			if (activeController === controller) activeController = null;
		}
	}, []);

	return { start, abort: abortAgentStream };
}

async function consumeStream(
	body: ReadableStream<Uint8Array>,
	signal: AbortSignal,
): Promise<void> {
	const reader = body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";
	let streamingId: string | null = null;
	let streamingText = "";

	const onAbort = () => {
		reader.cancel().catch(() => {});
	};
	signal.addEventListener("abort", onAbort);

	try {
		while (true) {
			const { value, done } = await reader.read();
			if (done) break;
			buffer += decoder.decode(value, { stream: true });
			let boundary = buffer.indexOf("\n\n");
			while (boundary !== -1) {
				const frame = buffer.slice(0, boundary);
				buffer = buffer.slice(boundary + 2);
				const parsed = parseFrame(frame);
				if (!parsed) continue;
				const { event, data } = parsed;
				if (event === "activity") {
					emit("activity", formatActivity(data));
				} else if (event === "token") {
					if (typeof data !== "string") continue;
					if (!streamingId) {
						const block = makeBlock("markdown", { text: data });
						streamingId = block.id;
						streamingText = data;
						appendBlock(block);
					} else {
						streamingText += data;
						updateBlock(streamingId, { text: streamingText });
					}
				} else if (event === "done") {
					const tokens = (data as { tokens?: number } | undefined)?.tokens;
					if (typeof tokens === "number" && tokens > 0) {
						emit("system", `(${tokens} tokens)`);
					}
				} else if (event === "quota") {
					const q = data as
						| { remaining?: number; resetsAt?: string }
						| undefined;
					if (q && typeof q.remaining === "number") {
						setQuota({
							remaining: q.remaining,
							resetsAt: q.resetsAt ?? null,
						});
					}
				} else if (event === "rate_limited") {
					const q = data as
						| {
								remaining?: number;
								resetsAt?: string;
								reason?: string;
						  }
						| undefined;
					setQuota({
						remaining: 0,
						resetsAt: q?.resetsAt ?? null,
					});
					emit("error", `agent: ${formatRateLimited(q?.reason, q?.resetsAt)}`);
				} else if (event === "error") {
					const data2 = data as
						| { message?: string; cap?: number; reason?: string }
						| undefined;
					const message = data2?.message ?? "stream_failed";
					emit("error", `agent: ${formatError(message, data2)}`);
				}
				boundary = buffer.indexOf("\n\n");
			}
		}
	} finally {
		signal.removeEventListener("abort", onAbort);
		reader.releaseLock();
	}
}

function parseFrame(frame: string): { event: string; data: unknown } | null {
	let event = "message";
	let dataLine = "";
	for (const line of frame.split("\n")) {
		if (line.startsWith("event:")) event = line.slice(6).trim();
		else if (line.startsWith("data:")) dataLine = line.slice(5).trim();
	}
	if (!dataLine) return null;
	try {
		return { event, data: JSON.parse(dataLine) };
	} catch {
		return { event, data: dataLine };
	}
}

function formatActivity(data: unknown): string {
	const obj = (data ?? {}) as {
		step?: string;
		files?: string[];
		model?: string;
	};
	if (obj.step === "reading") {
		const files = obj.files ?? [];
		return files.length > 0
			? `· reading ${files.join(", ")}`
			: "· reading context";
	}
	if (obj.step === "calling") {
		return obj.model ? `· calling ${obj.model}` : "· calling model";
	}
	return `· ${JSON.stringify(data)}`;
}

function recentHistoryFromBlocks(): Array<{
	role: "user" | "assistant";
	content: string;
}> {
	const blocks = terminalStore.state.blocks;
	const out: Array<{ role: "user" | "assistant"; content: string }> = [];
	for (const b of blocks) {
		if (b.kind === "prompt" && b.mode === "agent") {
			out.push({ role: "user", content: b.text });
		} else if (b.kind === "markdown" && b.text.length > 0) {
			// Heuristic: markdown blocks in agent mode are assistant responses.
			// Content commands (/me, /experience...) also emit markdown but the
			// agent treats them as harmless extra context.
			out.push({ role: "assistant", content: b.text });
		}
	}
	// Drop the just-appended prompt for the current submission (added by
	// `useSubmit` before this hook runs) and cap to the last 10 turns.
	if (out[out.length - 1]?.role === "user") out.pop();
	return out.slice(-10);
}

function isAbortError(err: unknown): boolean {
	return err instanceof Error && err.name === "AbortError";
}

function errorMessage(err: unknown): string {
	return err instanceof Error ? err.message : "unknown";
}

function formatError(
	code: string,
	data?: { cap?: number; reason?: string },
): string {
	switch (code) {
		case "prompt_too_long":
			return `prompts are capped at ${data?.cap ?? 30} words — try a shorter question`;
		case "off_topic":
			return "I only chat about Deep's portfolio. try /help or /projects";
		case "rejected":
			return data?.reason ? `rejected (${data.reason})` : "rejected";
		case "agent_unavailable":
			return "agent is unavailable right now — try the visual portfolio (/ui)";
		default:
			return code;
	}
}

function formatRateLimited(
	reason: string | undefined,
	resetsAt?: string,
): string {
	const inText = resetsAt ? ` (resets ${humanizeReset(resetsAt)})` : "";
	switch (reason) {
		case "cooldown":
			return "easy there — wait a moment before sending the next message";
		case "daily_budget":
			return `the agent's daily budget is spent for everyone today${inText}. switch to the visual portfolio with /ui`;
		case "vpn":
		case "proxy":
		case "tor":
		case "hosting":
			return "the agent is disabled for VPN/datacenter IPs. switch to the visual portfolio with /ui";
		case "ip_token_budget":
			return `you've used your token budget for today${inText}. switch to the visual portfolio with /ui`;
		case "premium_exhausted":
			return `out of premium messages (Gemini 2.5 Flash Lite is capped at 5/day per visitor${inText}). switch with \`/model gemma-4-31b-it\` to keep chatting.`;
		case "model_rpm":
			return `model is throttled at provider — retrying${inText} (per-minute cap).`;
		case "model_rpd":
			return `model hit its daily provider cap${inText}. try a different model with \`/model\` or come back tomorrow.`;
		default:
			return `you've used your free messages for the day${inText}. the visual portfolio has the same content with no rate limit — try /ui`;
	}
}

function humanizeReset(iso: string): string {
	const ms = new Date(iso).getTime() - Date.now();
	if (!Number.isFinite(ms) || ms <= 0) return "soon";
	const hours = Math.floor(ms / 3_600_000);
	const minutes = Math.floor((ms % 3_600_000) / 60_000);
	if (hours >= 1) return `in ~${hours}h ${minutes}m`;
	return `in ~${minutes}m`;
}
