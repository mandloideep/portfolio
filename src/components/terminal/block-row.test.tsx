import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { makeBlock } from "#/lib/terminal/blocks";
import { BlockRow } from "./block-row";

describe("BlockRow", () => {
	it("renders prompt block with agent prefix", () => {
		const block = makeBlock("prompt", { text: "/help", mode: "agent" });
		const { container } = render(<BlockRow block={block} />);
		expect(container.textContent).toMatch(/deep@portfolio.*❯/);
		expect(container.textContent).toMatch(/\/help/);
	});

	it("renders prompt block with shell prefix", () => {
		const block = makeBlock("prompt", { text: "ls", mode: "shell" });
		const { container } = render(<BlockRow block={block} />);
		expect(container.textContent).toMatch(/deep@portfolio.*\$/);
	});

	it("renders each non-prompt kind", () => {
		const kinds = [
			"output",
			"markdown",
			"error",
			"system",
			"activity",
		] as const;
		for (const kind of kinds) {
			const { container, unmount } = render(
				<BlockRow block={makeBlock(kind, { text: `${kind}-text` })} />,
			);
			expect(container.querySelector(`[data-block="${kind}"]`)).not.toBeNull();
			expect(container.textContent).toMatch(new RegExp(`${kind}-text`));
			unmount();
		}
	});
});
