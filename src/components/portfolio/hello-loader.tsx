import { useEffect, useState } from "react";
import { useReducedMotion } from "#/hooks/use-reduced-motion";

const GREETINGS = [
	"hello",
	"hola",
	"bonjour",
	"こんにちは",
	"안녕",
	"नमस्ते",
	"привет",
	"olá",
	"你好",
	"ciao",
] as const;

const STORAGE_KEY = "portfolio.hello-seen";
const PER_GREETING_MS = 480; // 10 × 480 ≈ 4.8s reveal, plus a 300ms fade
const FADE_MS = 320;

function shouldForce(): boolean {
	if (typeof window === "undefined") return false;
	try {
		return new URLSearchParams(window.location.search).get("hello") === "1";
	} catch {
		return false;
	}
}

/**
 * Apple-style multilingual boot loader. Cycles 10 greetings in different
 * scripts over ~5 seconds with a soft fade, then dismisses itself and
 * persists `localStorage["portfolio.hello-seen"] = "1"` so repeat
 * visitors land straight on the portfolio.
 *
 * Force-play with `?hello=1` (handy for demos and screenshots).
 * Suppressed under `prefers-reduced-motion`.
 */
export function HelloLoader() {
	const reduced = useReducedMotion();
	const [stage, setStage] = useState<"idle" | "visible" | "fading" | "done">(
		"idle",
	);
	const [index, setIndex] = useState(0);

	useEffect(() => {
		if (typeof window === "undefined") return;
		if (reduced) {
			setStage("done");
			return;
		}
		const forced = shouldForce();
		let seen = false;
		try {
			seen = window.localStorage.getItem(STORAGE_KEY) === "1";
		} catch {
			// localStorage might throw in restricted contexts; fall through and play.
		}
		if (seen && !forced) {
			setStage("done");
			return;
		}
		setStage("visible");

		const ticks: ReturnType<typeof setTimeout>[] = [];
		for (let i = 1; i < GREETINGS.length; i++) {
			ticks.push(setTimeout(() => setIndex(i), i * PER_GREETING_MS));
		}
		const fadeAt = setTimeout(
			() => setStage("fading"),
			GREETINGS.length * PER_GREETING_MS,
		);
		const doneAt = setTimeout(
			() => {
				setStage("done");
				try {
					window.localStorage.setItem(STORAGE_KEY, "1");
				} catch {
					// best-effort
				}
			},
			GREETINGS.length * PER_GREETING_MS + FADE_MS,
		);
		ticks.push(fadeAt, doneAt);
		return () => {
			for (const t of ticks) clearTimeout(t);
		};
	}, [reduced]);

	if (stage === "done") return null;

	return (
		<output
			aria-label="Welcome"
			data-testid="hello-loader"
			data-stage={stage}
			className="fixed inset-0 z-modal flex items-center justify-center bg-bg transition-opacity duration-slow"
			style={{ opacity: stage === "fading" ? 0 : 1 }}
		>
			<div className="font-display text-[clamp(3rem,9vw,6rem)] font-medium leading-none tracking-tight text-fg">
				<span
					key={`${GREETINGS[index]}-${index}`}
					className="inline-block animate-[fade-in_300ms_var(--ease-out)]"
				>
					{GREETINGS[index]}.
				</span>
			</div>
		</output>
	);
}
