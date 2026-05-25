import { useNavigate } from "@tanstack/react-router";
import { Github, Linkedin, Mail, Terminal } from "lucide-react";
import { useEffect } from "react";
import { siteMeta } from "#/content/site";
import { Badge } from "../ui/badge";

interface ContactRowProps {
	icon: React.ReactNode;
	label: string;
	value: string;
	href: string;
	external?: boolean;
	trailing?: React.ReactNode;
	testId: string;
}

function ContactRow({
	icon,
	label,
	value,
	href,
	external,
	trailing,
	testId,
}: ContactRowProps) {
	const externalAttrs = external
		? { target: "_blank", rel: "noreferrer" }
		: undefined;
	return (
		<li className="group flex items-center gap-3 border-b border-border/60 py-3 last:border-b-0">
			<span aria-hidden="true" className="shrink-0 select-none text-accent">
				▸
			</span>
			<span className="shrink-0 text-muted">{icon}</span>
			<span className="w-24 shrink-0 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
				{label}
			</span>
			<a
				data-testid={testId}
				href={href}
				{...externalAttrs}
				className="truncate text-[0.95rem] text-fg/90 transition-colors hover:text-accent focus-visible:outline-none focus-visible:underline"
			>
				{value}
			</a>
			{trailing ? <span className="ml-auto">{trailing}</span> : null}
		</li>
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

	return (
		<div
			data-testid="contact-card"
			className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-md border border-border/70 bg-bg-elev/60 px-5 py-2"
		>
			<ul className="flex flex-col">
				<ContactRow
					icon={<Mail className="size-4" aria-hidden="true" />}
					label="email"
					value={siteMeta.email}
					href={`mailto:${siteMeta.email}`}
					testId="contact-email"
				/>
				<ContactRow
					icon={<Github className="size-4" aria-hidden="true" />}
					label="github"
					value={siteMeta.links.github.replace(/^https?:\/\//, "")}
					href={siteMeta.links.github}
					external
					testId="contact-github"
				/>
				<ContactRow
					icon={<Linkedin className="size-4" aria-hidden="true" />}
					label="linkedin"
					value={siteMeta.links.linkedin.replace(/^https?:\/\//, "")}
					href={siteMeta.links.linkedin}
					external
					testId="contact-linkedin"
				/>
				<li className="flex items-center gap-3 py-3">
					<span aria-hidden="true" className="shrink-0 select-none text-accent">
						▸
					</span>
					<span className="shrink-0 text-muted">
						<Terminal className="size-4" aria-hidden="true" />
					</span>
					<span className="w-24 shrink-0 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
						terminal
					</span>
					<button
						type="button"
						data-testid="contact-terminal"
						onClick={() => navigate({ to: "/terminal" })}
						className="truncate text-[0.95rem] text-fg/90 transition-colors hover:text-accent focus-visible:outline-none focus-visible:underline"
					>
						open the agentic terminal
					</button>
					<span className="ml-auto">
						<Badge
							variant="outline"
							className="border-border/70 bg-bg/60 font-mono text-[10px] uppercase tracking-[0.14em] text-muted"
						>
							press t
						</Badge>
					</span>
				</li>
			</ul>
		</div>
	);
}
