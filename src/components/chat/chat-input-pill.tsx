import { ArrowUp, Square } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { useAgentSession } from "#/components/agent/agent-engine-provider";
import { BorderBeam } from "#/components/ui/border-beam";
import { IconButton } from "#/components/ui/icon-button";
import { useIsMobile } from "#/hooks/use-is-mobile";
import { cn } from "#/lib/utils";

type ChatInputPillProps = {
	/** Placeholder text. Hero state uses a wider, more inviting copy; thread
	 *  state uses the terse follow-up copy. */
	placeholder?: string;
	/** When true, render the rotating accent beam on focus-within. Used in
	 *  the hero composition; the thread variant keeps it off for calmness. */
	showBeam?: boolean;
	/** Focus the textarea on mount. Applied via useEffect (not the
	 *  autoFocus prop) so it stays a11y-friendly. */
	focusOnMount?: boolean;
	className?: string;
};

const MAX_ROWS_DESKTOP = 6;
const MAX_ROWS_MOBILE = 4;
const LINE_HEIGHT_PX = 22;

export function ChatInputPill({
	placeholder = "Ask me anything…",
	showBeam = false,
	focusOnMount,
	className,
}: ChatInputPillProps) {
	const { actions, state } = useAgentSession();
	const isMobile = useIsMobile();
	const taRef = useRef<HTMLTextAreaElement | null>(null);

	const isStreaming =
		state.status === "checking" ||
		state.status === "thinking" ||
		state.status === "answering";

	const maxRows = isMobile ? MAX_ROWS_MOBILE : MAX_ROWS_DESKTOP;
	const autosize = useCallback(
		(el: HTMLTextAreaElement) => {
			el.style.height = "auto";
			const max = LINE_HEIGHT_PX * maxRows;
			el.style.height = `${Math.min(el.scrollHeight, max)}px`;
		},
		[maxRows],
	);

	useEffect(() => {
		if (focusOnMount) taRef.current?.focus();
	}, [focusOnMount]);

	return (
		<form
			data-testid="chat-input-pill"
			className={cn(
				"group relative flex w-full items-end gap-2 rounded-card border border-border/70 bg-bg/40 px-3 py-2 transition-colors duration-base focus-within:border-accent/60",
				className,
			)}
			onSubmit={(e) => {
				e.preventDefault();
				if (isStreaming) return;
				const value = taRef.current?.value.trim() ?? "";
				if (!value) return;
				if (taRef.current) {
					taRef.current.value = "";
					autosize(taRef.current);
				}
				void actions.send(value);
			}}
		>
			{showBeam ? (
				<span className="pointer-events-none absolute inset-0 rounded-card opacity-0 transition-opacity duration-base group-focus-within:opacity-100">
					<BorderBeam duration={8} />
				</span>
			) : null}

			<textarea
				ref={taRef}
				rows={1}
				placeholder={placeholder}
				aria-label="message"
				className="relative z-10 flex-1 resize-none bg-transparent px-1 py-1.5 text-base leading-snug text-fg placeholder:text-muted/70 focus:outline-none sm:text-sm"
				onInput={(e) => autosize(e.currentTarget)}
				onKeyDown={(e) => {
					if (e.key === "Enter" && !e.shiftKey) {
						e.preventDefault();
						(e.currentTarget.form as HTMLFormElement | null)?.requestSubmit();
					}
				}}
			/>

			{isStreaming ? (
				<IconButton
					size="touch"
					shape="pill"
					tone="destructive"
					data-testid="chat-input-stop"
					aria-label="stop streaming"
					onClick={() => actions.abort()}
					className="z-10"
				>
					<Square
						className="size-4 fill-current sm:size-3.5"
						aria-hidden="true"
					/>
				</IconButton>
			) : (
				<IconButton
					size="touch"
					shape="pill"
					tone="accent"
					type="submit"
					data-testid="chat-input-send"
					aria-label="send message"
					className="z-10"
				>
					<ArrowUp className="size-5 sm:size-4" aria-hidden="true" />
				</IconButton>
			)}
		</form>
	);
}
