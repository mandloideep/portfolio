import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Experience } from "#/content/site";
import { ExperienceCard } from "./experience-card";

const sample: Experience = {
	company: "Test Co",
	role: "Test Role",
	start: "2024-08",
	end: "present",
	bullets: ["bullet one", "bullet two"],
	tags: ["TypeScript", "React"],
};

describe("ExperienceCard", () => {
	it("renders role, company, and every bullet when expanded", () => {
		const { getByText, container } = render(
			<ExperienceCard entry={sample} index={0} defaultExpanded />,
		);
		expect(container.textContent).toContain("Test Role");
		expect(container.textContent).toContain("Test Co");
		expect(getByText("bullet one")).toBeInTheDocument();
		expect(getByText("bullet two")).toBeInTheDocument();
	});

	it("formats an open-ended range as 'Aug 2024 – Present'", () => {
		const { getByTestId } = render(<ExperienceCard entry={sample} index={0} />);
		expect(getByTestId("experience-dates-0").textContent).toBe(
			"Aug 2024 – Present",
		);
	});

	it("formats a closed range with month + year on both ends", () => {
		const { getByTestId } = render(
			<ExperienceCard
				entry={{ ...sample, start: "2023-06", end: "2023-12" }}
				index={0}
			/>,
		);
		expect(getByTestId("experience-dates-0").textContent).toBe(
			"Jun 2023 – Dec 2023",
		);
	});

	it("renders one chip per tag", () => {
		const { getByText } = render(
			<ExperienceCard entry={sample} index={0} defaultExpanded />,
		);
		expect(getByText("TypeScript")).toBeInTheDocument();
		expect(getByText("React")).toBeInTheDocument();
	});
});
