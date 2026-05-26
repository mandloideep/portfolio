import { beforeEach, describe, expect, it, vi } from "vitest";
import { _clearIpInfoCacheForTests, lookupIp } from "./ipinfo";

beforeEach(() => {
	_clearIpInfoCacheForTests();
});

function mockFetch(payload: unknown): typeof fetch {
	return vi.fn(
		async () => new Response(JSON.stringify(payload), { status: 200 }),
	) as unknown as typeof fetch;
}

describe("lookupIp", () => {
	it("returns blocked=false when ip or token is missing", async () => {
		expect(await lookupIp("unknown", "")).toEqual({ blocked: false });
		expect(await lookupIp("unknown", "token")).toEqual({ blocked: false });
	});

	it("blocks on paid-tier privacy.vpn", async () => {
		const v = await lookupIp("1.2.3.4", "tok", {
			fetchImpl: mockFetch({
				country: "US",
				asn: { asn: "AS15169" },
				privacy: { vpn: true, proxy: false, tor: false, hosting: false },
			}),
		});
		expect(v.blocked).toBe(true);
		expect(v.reason).toBe("vpn");
		expect(v.country).toBe("US");
	});

	it("blocks on paid-tier privacy.hosting", async () => {
		const v = await lookupIp("5.6.7.8", "tok", {
			fetchImpl: mockFetch({
				country: "DE",
				privacy: { hosting: true },
			}),
		});
		expect(v.blocked).toBe(true);
		expect(v.reason).toBe("hosting");
	});

	it("blocks on free-tier org-string hosting heuristic", async () => {
		const v = await lookupIp("9.10.11.12", "tok", {
			fetchImpl: mockFetch({
				country: "US",
				org: "AS15169 Google LLC",
			}),
		});
		expect(v.blocked).toBe(true);
		expect(v.reason).toBe("hosting");
	});

	it("returns blocked=false for residential ASNs without privacy block", async () => {
		const v = await lookupIp("4.5.6.7", "tok", {
			fetchImpl: mockFetch({
				country: "US",
				org: "AS7922 Comcast Cable Communications",
			}),
		});
		expect(v.blocked).toBe(false);
	});

	it("caches results per ip", async () => {
		const fetchImpl = mockFetch({ country: "US", privacy: { vpn: true } });
		const first = await lookupIp("1.1.1.1", "tok", { fetchImpl });
		const second = await lookupIp("1.1.1.1", "tok", { fetchImpl });
		expect(first).toEqual(second);
		expect(
			(fetchImpl as unknown as { mock: { calls: unknown[] } }).mock.calls,
		).toHaveLength(1);
	});

	it("treats fetch errors as not-blocked (fail-open)", async () => {
		const fetchImpl = (async () => {
			throw new Error("network down");
		}) as unknown as typeof fetch;
		const v = await lookupIp("8.8.8.8", "tok", { fetchImpl });
		expect(v.blocked).toBe(false);
	});
});
