import { afterEach, describe, expect, it, vi } from "vitest";

const getProjectById = vi.fn();

vi.mock("@/lib/utils/project", () => ({
  getProjectById
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("app/api/projects/[projectId]/route", () => {
  it("returns the project bundle when found", async () => {
    getProjectById.mockResolvedValueOnce({ project: { id: "p1", title: "Museum" } });
    const { GET } = await import("@/app/api/projects/[projectId]/route");

    const response = await GET(new Request("http://localhost/api/projects/p1"), {
      params: Promise.resolve({ projectId: "p1" })
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      project: { id: "p1", title: "Museum" }
    });
    expect(getProjectById).toHaveBeenCalledWith("p1");
  });

  it("returns 404 when the project is missing", async () => {
    getProjectById.mockResolvedValueOnce(undefined);
    const { GET } = await import("@/app/api/projects/[projectId]/route");

    const response = await GET(new Request("http://localhost/api/projects/missing"), {
      params: Promise.resolve({ projectId: "missing" })
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Not found" });
  });
});
