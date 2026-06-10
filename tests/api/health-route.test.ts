import { afterEach, describe, expect, it, vi } from "vitest";

const recordHeartbeat = vi.fn();

vi.mock("@/lib/health/heartbeat", () => ({
  recordHeartbeat
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("app/api/health/route", () => {
  it("rejects requests without the cron secret", async () => {
    vi.stubEnv("CRON_SECRET", "test-secret");
    const { GET } = await import("@/app/api/health/route");

    const response = await GET(new Request("http://localhost/api/health"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ status: "unauthorized" });
    expect(recordHeartbeat).not.toHaveBeenCalled();
  });

  it("writes and returns a healthy heartbeat", async () => {
    vi.stubEnv("CRON_SECRET", "test-secret");
    recordHeartbeat.mockResolvedValueOnce({
      status: "healthy",
      checkedAt: "2026-06-10T12:00:00.000Z",
      latencyMs: 24
    });
    const { GET } = await import("@/app/api/health/route");

    const response = await GET(
      new Request("http://localhost/api/health", {
        headers: { Authorization: "Bearer test-secret" }
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      status: "healthy",
      checkedAt: "2026-06-10T12:00:00.000Z",
      latencyMs: 24
    });
  });

  it("returns 503 without leaking database errors", async () => {
    vi.stubEnv("CRON_SECRET", "test-secret");
    recordHeartbeat.mockRejectedValueOnce(new Error("database secret detail"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { GET } = await import("@/app/api/health/route");

    const response = await GET(
      new Request("http://localhost/api/health", {
        headers: { Authorization: "Bearer test-secret" }
      })
    );

    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.status).toBe("unhealthy");
    expect(JSON.stringify(body)).not.toContain("database secret detail");
  });
});
