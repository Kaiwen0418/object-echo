import { afterEach, describe, expect, it, vi } from "vitest";

const replaceProjectDevices = vi.fn();
const syncProjectAssets = vi.fn();

vi.mock("@/lib/utils/project", () => ({
  replaceProjectDevices,
  syncProjectAssets
}));

afterEach(() => {
  vi.clearAllMocks();
  replaceProjectDevices.mockReset();
  syncProjectAssets.mockReset();
});

describe("app/dashboard/[projectId]/(workspace)/devices/actions", () => {
  it("saves valid devices including linked assets", async () => {
    const { saveDevicesAction } = await import("@/app/dashboard/[projectId]/(workspace)/devices/actions");
    const formData = new FormData();
    formData.set(
      "devicesJson",
      JSON.stringify([
        {
          id: "device-1",
          name: "Casio",
          year: 2008,
          era: "Digital",
          specs: [{ label: "Display", value: "LCD" }],
          modelAssetId: "model-1",
          musicAssetId: "audio-1",
          sortOrder: 0
        }
      ])
    );

    const result = await saveDevicesAction("project-1", {}, formData);

    expect(syncProjectAssets).not.toHaveBeenCalled();
    expect(replaceProjectDevices).toHaveBeenCalledWith("project-1", [
      {
        id: "device-1",
        name: "Casio",
        year: 2008,
        era: "Digital",
        specs: [{ label: "Display", value: "LCD" }],
        modelAssetId: "model-1",
        musicAssetId: "audio-1",
        sortOrder: 0
      }
    ]);
    expect(result).toEqual({ success: "Collection saved." });
  });

  it("rejects missing names", async () => {
    const { saveDevicesAction } = await import("@/app/dashboard/[projectId]/(workspace)/devices/actions");
    const formData = new FormData();
    formData.set(
      "devicesJson",
      JSON.stringify([
        {
          name: "",
          year: 2008,
          sortOrder: 0
        }
      ])
    );

    const result = await saveDevicesAction("project-1", {}, formData);

    expect(replaceProjectDevices).not.toHaveBeenCalled();
    expect(result).toEqual({
      error: "Device 1 requires a name."
    });
  });

  it("rejects invalid years", async () => {
    const { saveDevicesAction } = await import("@/app/dashboard/[projectId]/(workspace)/devices/actions");
    const formData = new FormData();
    formData.set(
      "devicesJson",
      JSON.stringify([
        {
          name: "Future Device",
          year: 1800,
          sortOrder: 0
        }
      ])
    );

    const result = await saveDevicesAction("project-1", {}, formData);

    expect(replaceProjectDevices).not.toHaveBeenCalled();
    expect(result).toEqual({
      error: "Device 1 has an invalid year."
    });
  });

  it("saves assets before replacing devices when assetsJson is present", async () => {
    syncProjectAssets.mockResolvedValueOnce([
      {
        id: "persisted-model-1",
        projectId: "project-1",
        type: "model",
        sourceType: "sketchfab",
        sourceUrl: "https://sketchfab.com/models/c3d445e4e77441eba265504c0391a415/embed",
        previewImageUrl: "https://media.sketchfab.com/example.jpg",
        title: "Casio F-91W"
      }
    ]);
    const { saveDevicesAction } = await import("@/app/dashboard/[projectId]/(workspace)/devices/actions");
    const formData = new FormData();
    formData.set(
      "assetsJson",
      JSON.stringify([
        {
          id: "draft_1",
          type: "model",
          sourceType: "sketchfab",
          sourceUrl: "https://sketchfab.com/models/c3d445e4e77441eba265504c0391a415/embed",
          previewImageUrl: "https://media.sketchfab.com/example.jpg",
          title: "Casio F-91W"
        }
      ])
    );
    formData.set(
      "devicesJson",
      JSON.stringify([
        {
          name: "Casio",
          year: 2008,
          modelAssetId: "draft_1",
          sortOrder: 0
        }
      ])
    );

    await saveDevicesAction("project-1", {}, formData);

    expect(syncProjectAssets).toHaveBeenCalledWith("project-1", [
      {
        id: "draft_1",
        type: "model",
        sourceType: "sketchfab",
        sourceUrl: "https://sketchfab.com/models/c3d445e4e77441eba265504c0391a415/embed",
        previewImageUrl: "https://media.sketchfab.com/example.jpg",
        storageKey: undefined,
        title: "Casio F-91W",
        author: undefined,
        license: undefined,
        attribution: undefined
      }
    ]);
    expect(replaceProjectDevices).toHaveBeenCalledWith("project-1", [
      {
        id: undefined,
        name: "Casio",
        year: 2008,
        era: "",
        specs: [],
        modelAssetId: "persisted-model-1",
        musicAssetId: undefined,
        sortOrder: 0
      }
    ]);
  });

  it("surfaces non-Error messages from downstream failures", async () => {
    syncProjectAssets.mockRejectedValueOnce({ message: 'column "preview_image_url" of relation "project_assets" does not exist' });
    const { saveDevicesAction } = await import("@/app/dashboard/[projectId]/(workspace)/devices/actions");
    const formData = new FormData();
    formData.set(
      "assetsJson",
      JSON.stringify([
        {
          id: "draft_1",
          type: "model",
          sourceType: "sketchfab",
          sourceUrl: "https://sketchfab.com/models/c3d445e4e77441eba265504c0391a415/embed",
          previewImageUrl: "https://media.sketchfab.com/example.jpg",
          title: "Casio F-91W"
        }
      ])
    );
    formData.set(
      "devicesJson",
      JSON.stringify([
        {
          name: "Casio",
          year: 2008,
          modelAssetId: "draft_1",
          sortOrder: 0
        }
      ])
    );

    const result = await saveDevicesAction("project-1", {}, formData);

    expect(result).toEqual({
      error: 'column "preview_image_url" of relation "project_assets" does not exist'
    });
  });
});
