/**
 * Cheap pre-LLM guards. Pure functions, deliberately small. Each rejects
 * obvious abuse before paying for a model call; the heavier on-topic
 * classifier sits behind these.
 */

const PII_PATTERNS: Array<{ name: string; re: RegExp }> = [
	// US SSN (lazy heuristic — accepts 9 digits with optional dashes).
	{ name: "ssn", re: /\b\d{3}-?\d{2}-?\d{4}\b/ },
	// 13–19-digit credit-card-ish runs with optional separators.
	{ name: "credit_card", re: /\b(?:\d[ -]?){13,19}\b/ },
];

// Keep the slur list intentionally short and obvious. Anything broader needs
// a real moderation tool — a regex pretending to be one causes more pain than
// it solves.
const SLUR_PATTERNS: Array<{ name: string; re: RegExp }> = [
	{
		name: "slur",
		re: /\b(?:n[i1]gg(?:er|a)|f[a@]gg[o0]t|k[i1]ke|sp[i1]ck|ch[i1]nk)\b/i,
	},
];

const BROWSER_UA_RE =
	/\b(?:mozilla|webkit|chrome|safari|firefox|edge|opera|trident|gecko)\b/i;

const SCRIPT_UA_HINTS = [
	"curl/",
	"wget/",
	"python-requests",
	"python-urllib",
	"node-fetch",
	"axios/",
	"go-http-client",
	"java/",
	"okhttp",
	"libwww-perl",
	"httpie",
	"insomnia",
	"postmanruntime",
];

/** Count non-empty whitespace-separated words. Trim first to avoid leading/
 *  trailing empty chunks. */
export function wordCount(input: string): number {
	const trimmed = input.trim();
	if (trimmed.length === 0) return 0;
	return trimmed.split(/\s+/u).filter(Boolean).length;
}

/** Returns the matching rule name if the prompt contains PII or slurs, else null. */
export function hasDisallowedContent(input: string): string | null {
	for (const p of PII_PATTERNS) {
		if (p.re.test(input)) return p.name;
	}
	for (const p of SLUR_PATTERNS) {
		if (p.re.test(input)) return p.name;
	}
	return null;
}

/**
 * True if the User-Agent looks like a real browser. We use an allowlist
 * (Mozilla/WebKit/Chrome/etc.) and an explicit denylist of common scripting
 * clients. This is a soft defense — easy to spoof — but it catches the lazy
 * majority of scripted abuse for ~zero cost.
 */
export function isBrowserUserAgent(ua: string): boolean {
	if (!ua) return false;
	const lower = ua.toLowerCase();
	if (SCRIPT_UA_HINTS.some((hint) => lower.includes(hint))) return false;
	return BROWSER_UA_RE.test(ua);
}
