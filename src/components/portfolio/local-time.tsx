import { useEffect, useState } from "react";
import { cn } from "#/lib/utils";

const PLACEHOLDER = "--:--:--";

const FORMATTER = new Intl.DateTimeFormat("en-US", {
	hour12: false,
	hour: "2-digit",
	minute: "2-digit",
	second: "2-digit",
});

function formatNow(): string {
	return FORMATTER.format(new Date()).replace(/^24:/, "00:");
}

export interface LocalTimeProps {
	className?: string;
}

// TODO(phase-6.1): pair with a "last commit" pill once /api/github-graph lands.
export function LocalTime({ className }: LocalTimeProps) {
	const [time, setTime] = useState<string>(PLACEHOLDER);

	useEffect(() => {
		setTime(formatNow());
		const id = window.setInterval(() => setTime(formatNow()), 1000);
		return () => window.clearInterval(id);
	}, []);

	return (
		<span
			data-testid="local-time"
			className={cn(
				"inline-flex items-center gap-2 font-mono text-xs text-muted",
				className,
			)}
		>
			<span className="text-accent">⏱</span>
			<span suppressHydrationWarning>{time}</span>
		</span>
	);
}
