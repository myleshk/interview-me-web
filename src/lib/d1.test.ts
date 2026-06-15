import { describe, it, expect, vi, beforeEach } from "vitest";

// d1.ts reads env vars at import time — must stub BEFORE import
beforeEach(async () => {
  vi.stubEnv("CF_ACCOUNT_ID", "test-account");
  vi.stubEnv("CF_D1_DATABASE_ID", "test-db");
  vi.stubEnv("CF_API_TOKEN", "test-token");
  await vi.resetModules();
});

describe("D1Error", () => {
  it("has correct name and message prefix", async () => {
    const { D1Error } = await import("./d1");
    const err = new D1Error("something went wrong");
    expect(err.name).toBe("D1Error");
    expect(err.message).toBe("D1: something went wrong");
    expect(err).toBeInstanceOf(Error);
  });
});

describe("d1Query", () => {
  it("throws D1Error when env vars are missing", async () => {
    vi.unstubAllEnvs();
    vi.resetModules();
    const { d1Query, D1Error } = await import("./d1");
    await expect(d1Query("SELECT 1")).rejects.toThrow(D1Error);
    await expect(d1Query("SELECT 1")).rejects.toThrow("missing CF_ACCOUNT_ID");
  });

  it("throws D1Error on network failure", async () => {
    vi.stubGlobal("fetch", () => {
      throw new Error("network down");
    });
    const { d1Query } = await import("./d1");
    await expect(d1Query("SELECT 1")).rejects.toThrow(
      "D1: network error: network down"
    );
  });

  it("throws D1Error on HTTP error", async () => {
    vi.stubGlobal("fetch", () =>
      Promise.resolve({ ok: false, status: 403 })
    );
    const { d1Query } = await import("./d1");
    await expect(d1Query("SELECT 1")).rejects.toThrow("D1: HTTP 403");
  });

  it("throws D1Error on API error response", async () => {
    vi.stubGlobal("fetch", () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: false,
          errors: [{ message: "bad query" }],
        }),
      })
    );
    const { d1Query } = await import("./d1");
    await expect(d1Query("BAD SQL")).rejects.toThrow("D1: bad query");
  });

  it("returns rows for SELECT queries", async () => {
    vi.stubGlobal("fetch", () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          result: [{ results: [{ id: 1, name: "test" }] }],
        }),
      })
    );
    const { d1Query } = await import("./d1");
    const rows = await d1Query<{ id: number; name: string }>("SELECT 1");
    expect(rows).toEqual([{ id: 1, name: "test" }]);
  });

  it("returns empty array for INSERT/UPDATE (null results)", async () => {
    vi.stubGlobal("fetch", () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, result: [null] }),
      })
    );
    const { d1Query } = await import("./d1");
    const rows = await d1Query("INSERT INTO t VALUES (1)");
    expect(rows).toEqual([]);
  });
});
