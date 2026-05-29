import { experience } from "#/content/site";
import { cn } from "#/lib/utils";
import { ExperienceCard } from "./experience-card";

export function ExperienceTimeline({ className }: { className?: string }) {
	return (
		<ol
			data-testid="experience-timeline"
			className={cn("flex flex-col gap-3", className)}
		>
			{experience.map((entry, i) => (
				<ExperienceCard
					key={`${entry.company}-${entry.start}`}
					entry={entry}
					index={i}
					defaultExpanded={i === 0 || entry.end === "present"}
				/>
			))}
		</ol>
	);
}
