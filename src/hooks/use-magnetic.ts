import { useCallback, useEffect, useRef } from "react";
import { useReducedMotion } from "#/hooks/use-reduced-motion";

const MAX_OFFSET = 8;
const PULL_RATIO = 0.3;
const TRANSITION = "transform 200ms ease-out";

/**
 * Attach a subtle magnetic-hover effect to any element. Returns a ref
 * callback to spread onto the target. The element translates toward the
 * pointer along both axes, capped at ±8px, then eases back to origin on
 * pointer leave.
 *
 * Returns a no-op ref when the user prefers reduced motion; the element
 * gets `data-magnetic="off"` so tests and styling can branch.
 */
export function useMagnetic<T extends HTMLElement>() {
	const reduced = useReducedMotion();
	const elRef = useRef<T | null>(null);

	const setRef = useCallback(
		(node: T | null) => {
			elRef.current = node;
			if (!node) return;
			if (reduced) {
				node.dataset.magnetic = "off";
				node.style.transform = "";
				node.style.transition = "";
				return;
			}
			node.dataset.magnetic = "on";
			node.style.transition = TRANSITION;
		},
		[reduced],
	);

	useEffect(() => {
		if (reduced) return;
		const node = elRef.current;
		if (!node) return;

		function clamp(n: number): number {
			if (n > MAX_OFFSET) return MAX_OFFSET;
			if (n < -MAX_OFFSET) return -MAX_OFFSET;
			return n;
		}

		const onMove = (e: PointerEvent) => {
			const el = elRef.current;
			if (!el) return;
			const rect = el.getBoundingClientRect();
			const cx = rect.left + rect.width / 2;
			const cy = rect.top + rect.height / 2;
			const dx = clamp((e.clientX - cx) * PULL_RATIO);
			const dy = clamp((e.clientY - cy) * PULL_RATIO);
			el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
		};

		const onLeave = () => {
			const el = elRef.current;
			if (!el) return;
			el.style.transform = "translate3d(0, 0, 0)";
		};

		node.addEventListener("pointermove", onMove);
		node.addEventListener("pointerleave", onLeave);
		return () => {
			node.removeEventListener("pointermove", onMove);
			node.removeEventListener("pointerleave", onLeave);
		};
	}, [reduced]);

	return setRef;
}
