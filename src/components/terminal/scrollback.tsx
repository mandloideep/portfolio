import { useStore } from "@tanstack/react-store";
import { useEffect, useRef, useState } from "react";
import { terminalStore } from "#/store/terminal";
import { BlockRow } from "./block-row";

/**
 * Auto-scrolls to the bottom when new blocks arrive, unless the user has
 * scrolled up. A small tolerance (16px) accounts for sub-pixel rounding.
 */
export function Scrollback() {
	const blocks = useStore(terminalStore, (s) => s.blocks);
	const containerRef = useRef<HTMLDivElement>(null);
	const [pinned, setPinned] = useState(true);

	function onScroll() {
		const el = containerRef.current;
		if (!el) return;
		const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
		setPinned(distanceFromBottom < 16);
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: `blocks` is what we want to trigger on; pinned is the gate.
	useEffect(() => {
		if (!pinned) return;
		const el = containerRef.current;
		if (!el) return;
		el.scrollTop = el.scrollHeight;
	}, [blocks, pinned]);

	return (
		<div
			ref={containerRef}
			onScroll={onScroll}
			data-testid="scrollback"
			role="log"
			aria-live="polite"
			aria-label="terminal scrollback"
			className="h-[60vh] overflow-y-auto px-4 py-3 text-[13px] sm:text-sm leading-relaxed font-mono"
		>
			{blocks.map((b) => (
				<BlockRow key={b.id} block={b} />
			))}
		</div>
	);
}
