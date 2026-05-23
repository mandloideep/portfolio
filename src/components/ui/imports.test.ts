import { describe, expect, it } from "vitest";

/**
 * Smoke-test that every installed UI component imports without throwing. If
 * an `add` regresses (missing dep, broken registry entry), this fails fast.
 */
describe("ui components import smoke test", () => {
	const cases: Array<[string, () => Promise<unknown>]> = [
		["badge", () => import("./badge")],
		["card", () => import("./card")],
		["dialog", () => import("./dialog")],
		["tabs", () => import("./tabs")],
		["tooltip", () => import("./tooltip")],
		["sheet", () => import("./sheet")],
		["button", () => import("./button")],
		["animated-grid-pattern", () => import("./animated-grid-pattern")],
		["animated-shiny-text", () => import("./animated-shiny-text")],
		["magic-card", () => import("./magic-card")],
		["bento-grid", () => import("./bento-grid")],
		["number-ticker", () => import("./number-ticker")],
		["meteors", () => import("./meteors")],
		["dock", () => import("./dock")],
		["marquee", () => import("./marquee")],
	];

	for (const [name, load] of cases) {
		it(`${name} loads`, async () => {
			const mod = await load();
			expect(mod).toBeTruthy();
			expect(Object.keys(mod as Record<string, unknown>).length).toBeGreaterThan(0);
		});
	}
});
