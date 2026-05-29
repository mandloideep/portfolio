/**
 * <RateLimitNotice> — formatted explanation for any `rate_limited` reason
 * the server might emit. Both surfaces render this when the session's
 * error matches a known rate-limit reason; everything else falls through
 * to a generic error block.
 *
 * Explicit variants per `/vercel-composition-patterns` —
 * `architecture-avoid-boolean-props`. The internal `pickVariant` helper
 * maps reason codes to variants so callers don't need to know.
 */

import { cn } from "#/lib/utils";

export type RateLimitReason =
	| "cooldown"
	| "daily_budget"
	| "vpn"
	| "proxy"
	| "tor"
	| "hosting"
	| "ip_token_budget"
	| "premium_exhausted"
	| "limit_reached"
	| "model_rpm"
	| "model_rpd"
	| string;

export function RateLimitNotice({
	reason,
	resetsAt,
	className,
}: {
	reason: RateLimitReason;
	resetsAt?: string | null;
	className?: string;
}) {
	const variant = pickVariant(reason);
	const inText = resetsAt ? ` (resets ${humanizeReset(resetsAt)})` : "";
	let body = "";
	switch (variant) {
		case "cooldown":
			body = "easy there — wait a moment before sending the next message";
			break;
		case "shared_rpm":
			body = `the active model hit its shared per-minute cap — retry${inText} or switch model in the chip below`;
			break;
		case "shared_rpd":
			body = `the active model hit its shared per-day cap${inText} — switch model or come back tomorrow (UTC midnight)`;
			break;
		case "premium":
			body = `out of premium messages today${inText}. switch back to a free Gemma to keep chatting.`;
			break;
		case "ip_token_budget":
			body = `you've used your daily token budget${inText}. switch to the visual portfolio with /ui or come back tomorrow.`;
			break;
		case "site_budget":
			body = `the agent's daily budget is spent for everyone today${inText}. switch to the visual portfolio with /ui`;
			break;
		case "privacy":
			body =
				"the agent is disabled for VPN/datacenter IPs. switch to the visual portfolio with /ui";
			break;
		case "limit":
			body = `you've used your free messages for the day${inText}. switch to the visual portfolio with /ui`;
			break;
		default:
			body = `the agent is rate-limited${inText}.`;
	}
	return (
		<output
			data-testid="rate-limit-notice"
			data-variant={variant}
			className={cn(
				"block rounded-card border border-error/40 bg-error/5 px-3 py-2 text-meta uppercase tracking-tab text-fg/90",
				className,
			)}
		>
			{body}
		</output>
	);
}

export function pickVariant(reason: RateLimitReason): string {
	switch (reason) {
		case "cooldown":
			return "cooldown";
		case "model_rpm":
			return "shared_rpm";
		case "model_rpd":
			return "shared_rpd";
		case "premium_exhausted":
			return "premium";
		case "ip_token_budget":
			return "ip_token_budget";
		case "daily_budget":
			return "site_budget";
		case "vpn":
		case "proxy":
		case "tor":
		case "hosting":
			return "privacy";
		case "limit_reached":
			return "limit";
		default:
			return "generic";
	}
}

function humanizeReset(iso: string): string {
	const ms = new Date(iso).getTime() - Date.now();
	if (!Number.isFinite(ms) || ms <= 0) return "soon";
	const hours = Math.floor(ms / 3_600_000);
	const minutes = Math.floor((ms % 3_600_000) / 60_000);
	if (hours >= 1) return `in ~${hours}h ${minutes}m`;
	return `in ~${minutes}m`;
}
