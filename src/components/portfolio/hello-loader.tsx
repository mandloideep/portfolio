import { useEffect, useState } from "react";
import { useReducedMotion } from "#/hooks/use-reduced-motion";

const GREETINGS = [
	"hello",
	"hola",
	"bonjour",
	"こんにちは",
	"안녕",
	"привет",
	"नमस्ते",
	"olá",
	"你好",
	"ciao",
] as const;

const STORAGE_KEY = "portfolio.hello-seen";
const PER_GREETING_MS = 380;
const FADE_MS = 200;

/**
 * Apple-style multilingual boot loader. Cycles a sequence of greetings
 * with a soft fade between, then dismisses itself and remembers in
 * localStorage so repeat visitors don't see it. Suppressed under
 * `prefers-reduced-motion` — the page mounts immediately.
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
		let seen = false;
		try {
			seen = window.localStorage.getItem(STORAGE_KEY) === "1";
		} catch {
			// localStorage might throw in restricted contexts; fall through and play.
		}
		if (seen) {
			setStage("done");
			return;
		}
		setStage("visible");

		const ticks: ReturnType<typeof setTimeout>[] = [];
		for (let i = 1; i < GREETINGS.length; i++) {
			ticks.push(
				setTimeout(() => {
					setIndex(i);
				}, i * PER_GREETING_MS),
			);
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
			className="fixed inset-0 z-modal flex items-center justify-center bg-bg transition-opacity duration-300"
			style={{ opacity: stage === "fading" ? 0 : 1 }}
		>
			<div className="font-display text-[clamp(3rem,9vw,6rem)] font-medium leading-none tracking-tight text-fg">
				<span
					key={GREETINGS[index]}
					className="inline-block animate-[fade-in_var(--duration-fast)_var(--ease-out)]"
				>
					{GREETINGS[index]}.
				</span>
			</div>
		</output>
	);
}
