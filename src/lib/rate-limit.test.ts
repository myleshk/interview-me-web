import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { rateLimit, getClientIp, getCookieValue, __store } from "./rate-limit";

beforeEach(() => {
  __store.clear();
});

describe("rateLimit", () => {
  it("allows requests within the limit", () => {
    for (let i = 0; i < 5; i++) {
      const r = rateLimit("test", 5, 60);
      expect(r.allowed).toBe(true);
      expect(r.remaining).toBe(4 - i);
    }
  });

  it("blocks requests after limit exceeded", () => {
    for (let i = 0; i < 5; i++) rateLimit("test", 5, 60);
    const r = rateLimit("test", 5, 60);
    expect(r.allowed).toBe(false);
    expect(r.remaining).toBe(0);
  });

  it("frees space after window expires (sliding window)", () => {
    vi.useFakeTimers();
    for (let i = 0; i < 5; i++) rateLimit("sliding", 5, 1);
    vi.advanceTimersByTime(1_100);
    const r = rateLimit("sliding", 5, 1);
    expect(r.allowed).toBe(true);
    vi.useRealTimers();
  });

  it("independent keys have separate buckets", () => {
    for (let i = 0; i < 5; i++) rateLimit("a", 5, 60);
    const r = rateLimit("b", 5, 60);
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(4);
  });

  it("returns correct remaining count mid-window", () => {
    const r1 = rateLimit("mid", 3, 60);
    expect(r1.remaining).toBe(2);
    const r2 = rateLimit("mid", 3, 60);
    expect(r2.remaining).toBe(1);
    const r3 = rateLimit("mid", 3, 60);
    expect(r3.remaining).toBe(0);
  });

  it("prunes stale timestamps from the current bucket", () => {
    vi.useFakeTimers();
    rateLimit("key", 5, 1); // use 1 of 5
    vi.advanceTimersByTime(1_100); // window expired
    // Same key again — stale timestamp pruned, count reset to 1
    const r = rateLimit("key", 5, 1);
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(4);
    vi.useRealTimers();
  });

  it("triggers sweep when store reaches MAX_KEYS cap", () => {
    vi.useFakeTimers();
    // Pre-fill store to just below cap so next call triggers sweep
    for (let i = 0; i < 10_000; i++) {
      __store.set(`filler-${i}`, { timestamps: [Date.now()] });
    }
    const r = rateLimit("new-key", 1, 9999);
    expect(r.allowed).toBe(true);
    vi.useRealTimers();
  });
});

describe("getClientIp", () => {
  it("returns IP from cf-connecting-ip header", () => {
    const req = new Request("http://x", {
      headers: { "cf-connecting-ip": "1.2.3.4" },
    });
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  it("returns null when header missing", () => {
    expect(getClientIp(new Request("http://x"))).toBeNull();
  });
});

describe("getCookieValue", () => {
  it("extracts interview_me cookie from multiple cookies", () => {
    const req = new Request("http://x", {
      headers: { cookie: "a=1;interview_me=abc123;b=2" },
    });
    expect(getCookieValue(req)).toBe("abc123");
  });

  it("extracts interview_me when it is the only cookie", () => {
    const req = new Request("http://x", {
      headers: { cookie: "interview_me=xyz789" },
    });
    expect(getCookieValue(req)).toBe("xyz789");
  });

  it("returns null when cookie is missing", () => {
    expect(getCookieValue(new Request("http://x"))).toBeNull();
  });
});

describe("RATE_LIMIT config", () => {
  it("uses default values", async () => {
    vi.stubEnv("RATE_LIMIT_VERIFY", "");
    vi.stubEnv("RATE_LIMIT_REQUEST", "");
    vi.stubEnv("RATE_LIMIT_CHAT", "");
    vi.resetModules();
    const { RATE_LIMIT } = await import("./rate-limit");
    expect(RATE_LIMIT.verify.limit).toBe(5);
    expect(RATE_LIMIT.request.limit).toBe(2);
    expect(RATE_LIMIT.chat.limit).toBe(20);
  });

  it("overrides from env vars", async () => {
    vi.stubEnv("RATE_LIMIT_VERIFY", "10");
    vi.stubEnv("RATE_LIMIT_CHAT", "30");
    vi.resetModules();
    const { RATE_LIMIT } = await import("./rate-limit");
    expect(RATE_LIMIT.verify.limit).toBe(10);
    expect(RATE_LIMIT.request.limit).toBe(2);  // default
    expect(RATE_LIMIT.chat.limit).toBe(30);
  });
});
