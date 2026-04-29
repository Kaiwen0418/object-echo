import { afterEach, describe, expect, it, vi } from "vitest";

const searchModels = vi.fn();

vi.mock("@/lib/sketchfab/client", () => ({
  searchModels
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("app/api/devices/search-models/route", () => {
  it("passes the query string through to searchModels", async () => {
    searchModels.mockResolvedValueOnce([{ id: "m1", name: "Walkman Model" }]);
    const { GET } = await import("@/app/api/devices/search-models/route");

    const response = await GET(new Request("http://localhost/api/devices/search-models?query=walkman"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      results: [{ id: "m1", name: "Walkman Model" }]
    });
    expect(searchModels).toHaveBeenCalledWith("walkman");
  });

  it("uses an empty string when query is missing", async () => {
    searchModels.mockResolvedValueOnce([]);
    const { GET } = await import("@/app/api/devices/search-models/route");

    const response = await GET(new Request("http://localhost/api/devices/search-models"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ results: [] });
    expect(searchModels).toHaveBeenCalledWith("");
  });
});
