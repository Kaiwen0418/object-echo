import { afterEach, describe, expect, it, vi } from "vitest";

const syncProjectAssets = vi.fn();

vi.mock("@/lib/utils/project", () => ({
  syncProjectAssets
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("app/dashboard/[projectId]/(workspace)/assets/actions", () => {
  it("saves valid assets", async () => {
    const { saveAssetsAction } = await import("@/app/dashboard/[projectId]/(workspace)/assets/actions");
    const formData = new FormData();
    formData.set(
      "assetsJson",
      JSON.stringify([
      {
        id: "asset-1",
        type: "model",
        sourceType: "upload",
        sourceUrl: "https://cdn.example.com/device.glb",
        previewImageUrl: "https://cdn.example.com/device.jpg",
        title: "Device Model"
      },
        {
          id: "asset-2",
          type: "audio",
          sourceType: "upload",
          sourceUrl: "https://cdn.example.com/song.mp3",
          title: "Song"
        }
      ])
    );

    const result = await saveAssetsAction("project-1", {}, formData);

    expect(syncProjectAssets).toHaveBeenCalledWith("project-1", [
      {
        id: "asset-1",
        type: "model",
        sourceType: "upload",
        sourceUrl: "https://cdn.example.com/device.glb",
        previewImageUrl: "https://cdn.example.com/device.jpg",
        storageKey: undefined,
        title: "Device Model",
        author: undefined,
        license: undefined,
        attribution: undefined
      },
      {
        id: "asset-2",
        type: "audio",
        sourceType: "upload",
        sourceUrl: "https://cdn.example.com/song.mp3",
        storageKey: undefined,
        title: "Song",
        author: undefined,
        license: undefined,
        attribution: undefined
      }
    ]);
    expect(result).toEqual({ success: "Assets saved." });
  });

  it("rejects invalid model file types", async () => {
    const { saveAssetsAction } = await import("@/app/dashboard/[projectId]/(workspace)/assets/actions");
    const formData = new FormData();
    formData.set(
      "assetsJson",
      JSON.stringify([
        {
          type: "model",
          sourceType: "external",
          sourceUrl: "https://cdn.example.com/device.obj"
        }
      ])
    );

    const result = await saveAssetsAction("project-1", {}, formData);

    expect(syncProjectAssets).not.toHaveBeenCalled();
    expect(result).toEqual({
      error: "Asset 1 must reference a .glb/.gltf file or a Sketchfab model URL."
    });
  });

  it("accepts sketchfab embed urls for model assets", async () => {
    const { saveAssetsAction } = await import("@/app/dashboard/[projectId]/(workspace)/assets/actions");
    const formData = new FormData();
    formData.set(
      "assetsJson",
      JSON.stringify([
        {
          type: "model",
          sourceType: "sketchfab",
          sourceUrl: "https://sketchfab.com/models/c3d445e4e77441eba265504c0391a415/embed"
        }
      ])
    );

    const result = await saveAssetsAction("project-1", {}, formData);

    expect(syncProjectAssets).toHaveBeenCalled();
    expect(result).toEqual({ success: "Assets saved." });
  });

  it("strips draft ids before save", async () => {
    const { saveAssetsAction } = await import("@/app/dashboard/[projectId]/(workspace)/assets/actions");
    const formData = new FormData();
    formData.set(
      "assetsJson",
      JSON.stringify([
        {
          id: "draft_123",
          type: "image",
          sourceType: "upload",
          sourceUrl: "https://cdn.example.com/cover.png"
        }
      ])
    );

    await saveAssetsAction("project-1", {}, formData);

    expect(syncProjectAssets).toHaveBeenCalledWith("project-1", [
      expect.objectContaining({
        id: undefined,
        type: "image",
        sourceType: "upload",
        sourceUrl: "https://cdn.example.com/cover.png"
      })
    ]);
  });
});
