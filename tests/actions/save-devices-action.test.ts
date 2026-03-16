import { afterEach, describe, expect, it, vi } from "vitest";

const replaceProjectDevices = vi.fn();

vi.mock("@/lib/utils/project", () => ({
  replaceProjectDevices
}));

afterEach(() => {
  vi.clearAllMocks();
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
    expect(result).toEqual({ success: "Devices saved." });
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
});
