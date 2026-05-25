import { experience } from "#/content/site";
import { cn } from "#/lib/utils";
import { ExperienceCard } from "./experience-card";

export function ExperienceTimeline({ className }: { className?: string }) {
	return (
		<ol
			data-testid="experience-timeline"
			className={cn(
				"relative ml-1 flex flex-col border-l border-border pl-1",
				className,
			)}
		>
			{experience.map((entry, i) => (
				<ExperienceCard
					key={`${entry.company}-${entry.start}`}
					entry={entry}
					index={i}
				/>
			))}
		</ol>
	);
}
