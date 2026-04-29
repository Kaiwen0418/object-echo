import { afterEach, describe, expect, it, vi } from "vitest";

const listProjects = vi.fn();
const createProject = vi.fn();

vi.mock("@/lib/utils/project", () => ({
  listProjects,
  createProject
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("app/api/projects/route", () => {
  it("returns projects from GET", async () => {
    listProjects.mockResolvedValueOnce([{ id: "p1", title: "Test Project" }]);
    const { GET } = await import("@/app/api/projects/route");

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      projects: [{ id: "p1", title: "Test Project" }]
    });
    expect(listProjects).toHaveBeenCalledOnce();
  });

  it("creates a project from POST", async () => {
    createProject.mockResolvedValueOnce({ id: "p2", title: "Created Project" });
    const { POST } = await import("@/app/api/projects/route");

    const response = await POST(
      new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({
          title: "Created Project",
          slug: "created-project",
          description: "Desc"
        })
      })
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      project: { id: "p2", title: "Created Project" }
    });
    expect(createProject).toHaveBeenCalledWith({
      title: "Created Project",
      slug: "created-project",
      description: "Desc"
    });
  });

  it("returns 400 when createProject throws", async () => {
    createProject.mockRejectedValueOnce(new Error("Failed to create project."));
    const { POST } = await import("@/app/api/projects/route");

    const response = await POST(
      new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({
          title: "Broken",
          slug: "broken",
          description: ""
        })
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Failed to create project."
    });
  });
});
