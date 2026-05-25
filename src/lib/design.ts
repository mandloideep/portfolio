/**
 * JS-side mirrors of the @theme inline tokens defined in `src/styles.css`.
 *
 * Most of the time you don't need these — Tailwind utilities (`text-base`,
 * `shadow-frame`, etc.) cover styling. Use these constants when you need
 * a value at runtime: framer-motion timings, IntersectionObserver options,
 * canvas drawing, etc.
 *
 * Keep this in sync with `@theme inline` in styles.css. If a token only
 * needs to exist for Tailwind, put it there. If it ALSO needs to be
 * reachable from JS, mirror it here.
 */

export const DURATION = {
	fast: 150,
	base: 250,
	slow: 450,
} as const;

export const EASE = {
	out: [0.16, 1, 0.3, 1] as const,
	outBack: [0.18, 0.89, 0.32, 1.28] as const,
} as const;

export const Z = {
	base: 0,
	overlay: 10,
	nav: 30,
	modal: 50,
	toast: 70,
} as const;

/**
 * The four density steps wired to <html data-density="..."> via
 * src/store/density.ts. Mirrors the data-density rules in styles.css.
 */
export const DENSITY_SCALE = {
	compact: 0.92,
	cozy: 1,
	comfy: 1.08,
	roomy: 1.16,
} as const;
