"use server";

import { replaceProjectDevices } from "@/lib/utils/project";
import type { ProjectDevice } from "@/types";

export type SaveDevicesState = {
  error?: string;
  success?: string;
};

type DevicePayload = {
  id?: string;
  name: string;
  year: number;
  era: string;
  specs: ProjectDevice["specs"];
  modelAssetId?: string;
  musicAssetId?: string;
  sortOrder: number;
};

function parseDevices(raw: FormDataEntryValue | null): DevicePayload[] {
  if (typeof raw !== "string") {
    throw new Error("Missing device payload.");
  }

  const parsed = JSON.parse(raw) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error("Invalid device payload.");
  }

  return parsed.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(`Device ${index + 1} is invalid.`);
    }

    const candidate = item as Partial<DevicePayload>;
    const name = typeof candidate.name === "string" ? candidate.name.trim() : "";
    const year = Number(candidate.year);

    if (!name) {
      throw new Error(`Device ${index + 1} requires a name.`);
    }

    if (!Number.isInteger(year) || year < 1900 || year > new Date().getFullYear() + 1) {
      throw new Error(`Device ${index + 1} has an invalid year.`);
    }

    return {
      id: typeof candidate.id === "string" ? candidate.id : undefined,
      name,
      year,
      era: typeof candidate.era === "string" ? candidate.era : "",
      specs: Array.isArray(candidate.specs) ? candidate.specs : [],
      modelAssetId: typeof candidate.modelAssetId === "string" ? candidate.modelAssetId : undefined,
      musicAssetId: typeof candidate.musicAssetId === "string" ? candidate.musicAssetId : undefined,
      sortOrder: typeof candidate.sortOrder === "number" && Number.isInteger(candidate.sortOrder) ? candidate.sortOrder : index
    };
  });
}

export async function saveDevicesAction(
  projectId: string,
  _prevState: SaveDevicesState,
  formData: FormData
): Promise<SaveDevicesState> {
  try {
    const devices = parseDevices(formData.get("devicesJson"));
    await replaceProjectDevices(projectId, devices);
    return { success: "Devices saved." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save devices.";
    return { error: message };
  }
}
