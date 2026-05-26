import type { PrivacyVerdict } from "#/lib/rate-limit";

/**
 * Minimal IPInfo client. Only called once per new IP (the rate-limit helper
 * skips it on repeat visits) so the volume sits well inside the free tier.
 *
 * The privacy block is on IPInfo's paid plans; on the free tier we fall back
 * to the `org` string and a tiny heuristic for the most obvious cases
 * (`hosting`-style ASNs like AWS / GCP / DigitalOcean). It's not perfect —
 * the cheap defense layer that backs it up is the per-IP message cap.
 */

type IpInfoResponse = {
	ip?: string;
	city?: string;
	country?: string;
	org?: string;
	asn?: { asn?: string; name?: string };
	privacy?: {
		vpn?: boolean;
		proxy?: boolean;
		tor?: boolean;
		relay?: boolean;
		hosting?: boolean;
	};
};

const cache = new Map<string, PrivacyVerdict>();

export async function lookupIp(
	ip: string,
	token: string,
	options: { signal?: AbortSignal; fetchImpl?: typeof fetch } = {},
): Promise<PrivacyVerdict> {
	const fetchImpl = options.fetchImpl ?? fetch;
	const cached = cache.get(ip);
	if (cached) return cached;
	if (ip === "unknown" || !token) {
		const v: PrivacyVerdict = { blocked: false };
		cache.set(ip, v);
		return v;
	}

	// Send the token via Authorization header rather than ?token= so it
	// doesn't leak into Traefik / CDN access logs or referrer headers.
	const url = `https://ipinfo.io/${encodeURIComponent(ip)}/json`;
	let data: IpInfoResponse = {};
	try {
		const res = await fetchImpl(url, {
			signal: options.signal,
			headers: { Authorization: `Bearer ${token}` },
		});
		if (res.ok) {
			data = (await res.json()) as IpInfoResponse;
		}
	} catch {
		// Network error → don't block.
	}

	const verdict = toVerdict(data);
	cache.set(ip, verdict);
	return verdict;
}

export function _clearIpInfoCacheForTests(): void {
	cache.clear();
}

function toVerdict(data: IpInfoResponse): PrivacyVerdict {
	const privacy = data.privacy;
	if (privacy) {
		if (privacy.vpn)
			return {
				country: data.country,
				blocked: true,
				reason: "vpn",
				asn: data.asn?.asn,
			};
		if (privacy.proxy)
			return {
				country: data.country,
				blocked: true,
				reason: "proxy",
				asn: data.asn?.asn,
			};
		if (privacy.tor)
			return {
				country: data.country,
				blocked: true,
				reason: "tor",
				asn: data.asn?.asn,
			};
		if (privacy.hosting)
			return {
				country: data.country,
				blocked: true,
				reason: "hosting",
				asn: data.asn?.asn,
			};
		return { country: data.country, asn: data.asn?.asn, blocked: false };
	}

	// Free-tier fallback: scan the `org` string for known datacenter ASNs.
	const org = (data.org ?? "").toLowerCase();
	const hostingHints = [
		"amazon",
		"aws",
		"google llc",
		"google cloud",
		"microsoft",
		"azure",
		"digitalocean",
		"linode",
		"hetzner",
		"ovh",
		"vultr",
		"oracle cloud",
		"alibaba",
		"tencent",
		"cloudflare",
		"fastly",
	];
	const isHosting = hostingHints.some((h) => org.includes(h));
	return {
		country: data.country,
		asn: data.org,
		blocked: isHosting,
		reason: isHosting ? "hosting" : undefined,
	};
}
