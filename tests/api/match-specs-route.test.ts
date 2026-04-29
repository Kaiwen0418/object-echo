import { afterEach, describe, expect, it, vi } from "vitest";

const matchDeviceSpecs = vi.fn();

vi.mock("@/lib/utils/device-matcher", () => ({
  matchDeviceSpecs
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("app/api/devices/match-specs/route", () => {
  it("passes name and year to matchDeviceSpecs", async () => {
    matchDeviceSpecs.mockReturnValueOnce({
      era: "2008",
      specs: [{ label: "Display", value: "LCD" }],
      candidateModels: []
    });
    const { POST } = await import("@/app/api/devices/match-specs/route");

    const response = await POST(
      new Request("http://localhost/api/devices/match-specs", {
        method: "POST",
        body: JSON.stringify({ name: "Casio", year: 2008 })
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      era: "2008",
      specs: [{ label: "Display", value: "LCD" }],
      candidateModels: []
    });
    expect(matchDeviceSpecs).toHaveBeenCalledWith("Casio", 2008);
  });

  it("falls back to current year when year is omitted", async () => {
    matchDeviceSpecs.mockReturnValueOnce({
      era: "current",
      specs: [],
      candidateModels: []
    });
    const { POST } = await import("@/app/api/devices/match-specs/route");

    const response = await POST(
      new Request("http://localhost/api/devices/match-specs", {
        method: "POST",
        body: JSON.stringify({ name: "Unknown" })
      })
    );

    expect(response.status).toBe(200);
    expect(matchDeviceSpecs).toHaveBeenCalledWith("Unknown", new Date().getFullYear());
    await expect(response.json()).resolves.toEqual({
      era: "current",
      specs: [],
      candidateModels: []
    });
  });
});
