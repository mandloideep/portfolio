import { useNavigate } from "@tanstack/react-router";
import { useCallback, useRef } from "react";
import { makeBlock } from "#/lib/terminal/blocks";
import { runCommand } from "#/lib/terminal/commands";
import { runShellCommand } from "#/lib/terminal/shell";
import {
	appendBlock,
	emit,
	pushHistory,
	setMode,
	terminalStore,
} from "#/store/terminal";
import { useAgentStream } from "./use-agent-stream";

/**
 * Submit a typed line as if the user pressed Enter at the prompt.
 *
 * Appends a `prompt` block, pushes to history, then routes to the right
 * registry based on `mode`. Shell-mode re-entry shortcuts (`deep`, `claude`,
 * `open ui`) are handled here because they cross the mode/route boundary.
 * Non-slash agent-mode lines stream a response from `/api/agent`.
 * Exposed as a hook so `/retry` can recurse via a ref.
 */
export function useSubmit() {
	const navigate = useNavigate();
	const submitRef = useRef<(raw: string) => Promise<void>>(async () => {});
	const agentStream = useAgentStream();

	const submit = useCallback(
		async (raw: string) => {
			const text = raw.trim();
			if (!text) return;
			const mode = terminalStore.state.mode;
			appendBlock(makeBlock("prompt", { text, mode }));
			pushHistory(text);

			const navigateAdapter = (opts: { to: string }) => {
				navigate(opts as never);
			};

			if (mode === "shell") {
				const head = text.split(/\s+/)[0] ?? "";
				if (head === "deep" || head === "claude") {
					setMode("agent");
					emit("system", "back in agent mode. try /help.");
					return;
				}
				if (text === "open ui") {
					emit("system", "opening /ui…");
					navigateAdapter({ to: "/" });
					return;
				}
				runShellCommand(text, { navigate: navigateAdapter });
				return;
			}

			const handled = await runCommand(text, {
				navigate: navigateAdapter,
				submit: (line) => submitRef.current(line),
			});
			if (!handled) {
				await agentStream.start(text);
			}
		},
		[navigate, agentStream],
	);

	submitRef.current = submit;
	return submit;
}
