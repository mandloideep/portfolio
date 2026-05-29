import { describe, expect, it } from "vitest";
import { getClientIp, hashIp } from "./rate-limit";

function makeRequest(headers: Record<string, string>): Request {
	return new Request("http://test/x", { headers });
}

describe("getClientIp", () => {
	it("prefers cf-connecting-ip", () => {
		expect(
			getClientIp(
				makeRequest({
					"cf-connecting-ip": "1.1.1.1",
					"x-forwarded-for": "2.2.2.2",
				}),
			),
		).toBe("1.1.1.1");
	});

	it("falls back to first hop of x-forwarded-for", () => {
		expect(
			getClientIp(
				makeRequest({ "x-forwarded-for": "3.3.3.3, 10.0.0.1, 10.0.0.2" }),
			),
		).toBe("3.3.3.3");
	});

	it("falls back to x-real-ip", () => {
		expect(getClientIp(makeRequest({ "x-real-ip": "4.4.4.4" }))).toBe(
			"4.4.4.4",
		);
	});

	it("returns unknown when no header is present", () => {
		expect(getClientIp(makeRequest({}))).toBe("unknown");
	});
});

describe("hashIp", () => {
	it("is deterministic per (ip, salt)", () => {
		expect(hashIp("1.2.3.4", "salt")).toBe(hashIp("1.2.3.4", "salt"));
	});

	it("changes with the salt", () => {
		expect(hashIp("1.2.3.4", "a")).not.toBe(hashIp("1.2.3.4", "b"));
	});

	it("changes with the ip", () => {
		expect(hashIp("1.2.3.4", "salt")).not.toBe(hashIp("1.2.3.5", "salt"));
	});

	it("produces base64url-safe output", () => {
		const hash = hashIp("1.2.3.4", "salt");
		expect(hash).toMatch(/^[A-Za-z0-9_-]+$/);
	});
});
