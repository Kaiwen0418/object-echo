import { afterEach, describe, expect, it, vi } from "vitest";

const createProject = vi.fn();

vi.mock("@/lib/utils/project", () => ({
  createProject
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("app/dashboard/new/actions", () => {
  it("returns a title field error when title is missing", async () => {
    const { createProjectAction } = await import("@/app/dashboard/new/actions");
    const formData = new FormData();
    formData.set("title", "");
    formData.set("description", "desc");

    const result = await createProjectAction({}, formData);

    expect(result).toEqual({
      fieldErrors: { title: "Project title is required." }
    });
    expect(createProject).not.toHaveBeenCalled();
  });

  it("slugifies the title when slug is blank", async () => {
    createProject.mockResolvedValueOnce({ id: "p1" });
    const { createProjectAction } = await import("@/app/dashboard/new/actions");
    const formData = new FormData();
    formData.set("title", "My New Museum");
    formData.set("description", "desc");

    const result = await createProjectAction({}, formData);

    expect(createProject).toHaveBeenCalledWith({
      title: "My New Museum",
      slug: "my-new-museum",
      description: "desc"
    });
    expect(result).toEqual({
      success: "Project created.",
      projectId: "p1"
    });
  });

  it("maps duplicate slug errors to title field errors", async () => {
    createProject.mockRejectedValueOnce(new Error('duplicate key value violates unique constraint "projects_slug_key"'));
    const { createProjectAction } = await import("@/app/dashboard/new/actions");
    const formData = new FormData();
    formData.set("title", "Museum");
    formData.set("description", "");

    const result = await createProjectAction({}, formData);

    expect(result).toEqual({
      fieldErrors: { title: "A project with this name already exists." }
    });
  });

  it("returns generic action errors", async () => {
    createProject.mockRejectedValueOnce(new Error("Network failed"));
    const { createProjectAction } = await import("@/app/dashboard/new/actions");
    const formData = new FormData();
    formData.set("title", "Museum");
    formData.set("description", "");

    const result = await createProjectAction({}, formData);

    expect(result).toEqual({
      error: "Network failed"
    });
  });
});
