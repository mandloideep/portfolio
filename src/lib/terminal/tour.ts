import type { StreamHandle } from "#/components/terminal/use-agent-stream";
import { abortAgentStream } from "#/components/terminal/use-agent-stream";
import { emit } from "#/store/terminal";

type Beat = {
	header: string;
	prompt: string;
};

const BEATS: readonly Beat[] = [
	{
		header: "→ welcome",
		prompt:
			"Say hi to the visitor in one short paragraph. Tell them you'll walk them through Deep's site.",
	},
	{
		header: "→ about deep",
		prompt: "Who is Deep? Keep it to 2–3 sentences.",
	},
	{
		header: "→ projects",
		prompt:
			"What are Deep's most interesting projects? Pick the top two and describe them in 3–4 sentences total.",
	},
	{
		header: "→ experience",
		prompt: "Summarize Deep's most recent role in 2–3 sentences.",
	},
	{
		header: "→ skills",
		prompt: "What's Deep's strongest technical stack? One line.",
	},
	{
		header: "→ contact",
		prompt: "How can someone reach Deep? One line, include the email.",
	},
	{
		header: "→ closing",
		prompt:
			"Wrap up: tell the visitor they can type any question or hit Ctrl+C to stop.",
	},
];

const PAUSE_MS = 1200;

let activeController: AbortController | null = null;

export function isTourRunning(): boolean {
	return activeController !== null;
}

/**
 * Cancel any in-flight tour. Cascades into the agent stream so the active
 * section's stream stops too. Returns true if a tour was running.
 */
export function abortTour(): boolean {
	if (!activeController) return false;
	activeController.abort();
	activeController = null;
	abortAgentStream();
	return true;
}

function prefersReducedMotion(): boolean {
	if (typeof window === "undefined" || !window.matchMedia) return false;
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function abortableSleep(ms: number, signal: AbortSignal): Promise<void> {
	if (ms <= 0 || signal.aborted) return Promise.resolve();
	return new Promise((resolve) => {
		const onAbort = () => {
			clearTimeout(timer);
			resolve();
		};
		const timer = setTimeout(() => {
			signal.removeEventListener("abort", onAbort);
			resolve();
		}, ms);
		signal.addEventListener("abort", onAbort, { once: true });
	});
}

/**
 * Run the scripted `/presentation` tour: emit a header system block per
 * beat, stream a response from `/api/agent`, pause briefly, repeat.
 * Cancels cleanly via `abortTour()`; reduced motion collapses the pause.
 *
 * Rejects (silently) if a tour is already running; callers should check
 * `isTourRunning()` first to emit a friendly error.
 */
export async function runPresentation(deps: {
	agentStream: StreamHandle;
}): Promise<void> {
	if (activeController) return;
	const controller = new AbortController();
	activeController = controller;
	const signal = controller.signal;
	const pauseMs = prefersReducedMotion() ? 0 : PAUSE_MS;

	try {
		for (let i = 0; i < BEATS.length; i += 1) {
			if (signal.aborted) return;
			const beat = BEATS[i];
			if (!beat) continue;
			emit("system", beat.header);
			await deps.agentStream.start(beat.prompt);
			if (signal.aborted) return;
			if (i < BEATS.length - 1) {
				await abortableSleep(pauseMs, signal);
			}
		}
	} finally {
		if (activeController === controller) activeController = null;
	}
}

export const _BEATS_FOR_TESTS = BEATS;
