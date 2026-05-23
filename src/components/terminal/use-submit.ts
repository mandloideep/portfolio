import { useNavigate } from "@tanstack/react-router";
import { useCallback, useRef } from "react";
import { makeBlock } from "#/lib/terminal/blocks";
import { runCommand } from "#/lib/terminal/commands";
import {
	appendBlock,
	emit,
	pushHistory,
	terminalStore,
} from "#/store/terminal";

/**
 * Submit a typed line as if the user pressed Enter at the prompt.
 *
 * Appends a `prompt` block, pushes to history, then runs the slash-command
 * registry. Non-slash lines emit a placeholder system block until Phase 6
 * wires the agent. Exposed as a hook so `/retry` can recurse via a ref.
 */
export function useSubmit() {
	const navigate = useNavigate();
	const submitRef = useRef<(raw: string) => Promise<void>>(async () => {});

	const submit = useCallback(
		async (raw: string) => {
			const text = raw.trim();
			if (!text) return;
			const mode = terminalStore.state.mode;
			appendBlock(makeBlock("prompt", { text, mode }));
			pushHistory(text);
			const handled = await runCommand(text, {
				navigate: (opts) => {
					navigate(opts as never);
				},
				submit: (line) => submitRef.current(line),
			});
			if (!handled) {
				emit(
					"system",
					"free-text routing lands in phase 6. try /help for commands.",
				);
			}
		},
		[navigate],
	);

	submitRef.current = submit;
	return submit;
}
