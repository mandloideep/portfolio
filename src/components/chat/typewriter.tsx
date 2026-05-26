import { useEffect, useRef, useState } from "react";
import { cn } from "#/lib/utils";

type TypewriterProps = {
	/** Words to cycle through. Must be non-empty. */
	words: ReadonlyArray<string>;
	/** ms per character while typing. */
	typeMs?: number;
	/** ms per character while deleting. */
	deleteMs?: number;
	/** ms to hold a fully-typed word before deleting. */
	holdMs?: number;
	className?: string;
};

/**
 * Cycles through `words` with a typewriter effect. Pure CSS for the caret
 * (`caret-block` utility). Respects `prefers-reduced-motion` by snapping
 * straight to the longest word.
 */
export function Typewriter({
	words,
	typeMs = 65,
	deleteMs = 35,
	holdMs = 1400,
	className,
}: TypewriterProps) {
	const [wordIdx, setWordIdx] = useState(0);
	const [text, setText] = useState("");
	const [phase, setPhase] = useState<"typing" | "holding" | "deleting">(
		"typing",
	);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (typeof window === "undefined") return;
		const prefersReduced = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;
		if (prefersReduced) {
			// Snap to the longest word and stop animating.
			const longest = words.reduce(
				(a, b) => (b.length > a.length ? b : a),
				words[0] ?? "",
			);
			setText(longest);
			setPhase("holding");
			return;
		}

		const current = words[wordIdx] ?? "";
		const clearTimer = () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
				timerRef.current = null;
			}
		};

		if (phase === "typing") {
			if (text === current) {
				timerRef.current = setTimeout(() => setPhase("deleting"), holdMs);
			} else {
				timerRef.current = setTimeout(
					() => setText(current.slice(0, text.length + 1)),
					typeMs,
				);
			}
		} else if (phase === "deleting") {
			if (text.length === 0) {
				setWordIdx((i) => (i + 1) % words.length);
				setPhase("typing");
			} else {
				timerRef.current = setTimeout(
					() => setText((t) => t.slice(0, t.length - 1)),
					deleteMs,
				);
			}
		}

		return clearTimer;
	}, [text, phase, wordIdx, words, typeMs, deleteMs, holdMs]);

	return (
		<span className={cn("inline-flex items-baseline", className)}>
			<span>{text}</span>
			<span className="caret-block ml-1" aria-hidden="true" />
		</span>
	);
}
