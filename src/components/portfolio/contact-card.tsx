import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Pill } from "#/components/ui/pill";
import { siteMeta } from "#/content/site";
import { cn } from "#/lib/utils";

type RowProps = {
	label: string;
	href?: string;
	external?: boolean;
	onClick?: () => void;
	value: React.ReactNode;
	testId: string;
};

function ContactRow({
	label,
	href,
	external,
	onClick,
	value,
	testId,
}: RowProps) {
	const externalAttrs = external
		? { target: "_blank" as const, rel: "noreferrer" }
		: undefined;
	const rowClass =
		"flex items-center gap-6 rounded-md border border-border/70 bg-bg-elev/60 px-5 py-4 transition-[colors,box-shadow] duration-base hover:border-accent/60 hover:shadow-glow focus-visible:outline-none focus-visible:border-accent/70 focus-visible:shadow-glow-strong";

	const labelEl = (
		<span className="w-24 shrink-0 font-mono text-base text-muted">
			{label}
		</span>
	);
	const arrowEl = (
		<span aria-hidden="true" className="font-mono text-base text-muted">
			→
		</span>
	);
	const valueEl = (
		<span className="flex-1 font-mono text-base text-link">{value}</span>
	);

	if (href) {
		return (
			<a
				data-testid={testId}
				href={href}
				{...externalAttrs}
				className={rowClass}
			>
				{labelEl}
				{arrowEl}
				{valueEl}
			</a>
		);
	}
	if (onClick) {
		return (
			<button
				type="button"
				data-testid={testId}
				onClick={onClick}
				className={cn(rowClass, "text-left")}
			>
				{labelEl}
				{arrowEl}
				{valueEl}
			</button>
		);
	}
	return (
		<div className={rowClass} data-testid={testId}>
			{labelEl}
			{arrowEl}
			{valueEl}
		</div>
	);
}

function isEditableTarget(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) return false;
	if (target instanceof HTMLInputElement) return true;
	if (target instanceof HTMLTextAreaElement) return true;
	return target.isContentEditable;
}

function dialogIsOpen(): boolean {
	if (typeof document === "undefined") return false;
	return document.querySelector('[role="dialog"][data-state="open"]') !== null;
}

export function ContactCard() {
	const navigate = useNavigate();

	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (e.key.toLowerCase() !== "t") return;
			if (e.ctrlKey || e.metaKey || e.altKey) return;
			if (e.repeat) return;
			if (isEditableTarget(e.target)) return;
			if (dialogIsOpen()) return;
			e.preventDefault();
			navigate({ to: "/terminal" });
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [navigate]);

	const github = siteMeta.links.github.replace(/^https?:\/\//, "");
	const linkedin = siteMeta.links.linkedin.replace(/^https?:\/\//, "");

	return (
		<div
			data-testid="contact-card"
			className="flex flex-col gap-3 rounded-card border border-border/70 bg-bg-elev/40 p-3 sm:p-5"
		>
			<ContactRow
				testId="contact-github"
				label="github"
				href={siteMeta.links.github}
				external
				value={github.replace(/^github\.com\//, "")}
			/>
			<ContactRow
				testId="contact-linkedin"
				label="linkedin"
				href={siteMeta.links.linkedin}
				external
				value={linkedin.replace(/^(?:www\.)?linkedin\.com\/in\//, "")}
			/>
			<ContactRow
				testId="contact-email"
				label="email"
				href={`mailto:${siteMeta.email}`}
				value={siteMeta.email}
			/>
			<ContactRow
				testId="contact-resume"
				label="resume"
				href={siteMeta.links.resume}
				external
				value="view resume"
			/>
			<ContactRow
				testId="contact-terminal"
				label="terminal"
				onClick={() => navigate({ to: "/terminal" })}
				value={
					<span className="inline-flex items-center gap-2.5">
						open the agentic terminal
						<Pill size="xs" tone="muted">
							press t
						</Pill>
					</span>
				}
			/>
		</div>
	);
}
