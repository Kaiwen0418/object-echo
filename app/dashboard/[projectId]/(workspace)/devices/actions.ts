"use server";

import { extractSketchfabUid } from "@/features/museum/lib/config";
import { MAX_DEVICES_PER_PROJECT } from "@/lib/limits";
import { replaceProjectDevices, syncProjectAssets } from "@/lib/utils/project";
import type { ProjectAsset, ProjectDevice } from "@/types";

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

type AssetPayload = {
  id?: string;
  type: ProjectAsset["type"];
  sourceType: ProjectAsset["sourceType"];
  sourceUrl?: string;
  previewImageUrl?: string;
  storageKey?: string;
  title?: string;
  author?: string;
  license?: string;
  attribution?: string;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  return fallback;
}

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

function isAllowedModelAssetSource(value: string) {
  const normalized = value.toLowerCase();
  return normalized.endsWith(".glb") || normalized.endsWith(".gltf") || Boolean(extractSketchfabUid(value));
}

function parseAssets(raw: FormDataEntryValue | null): AssetPayload[] {
  if (raw == null) {
    return [];
  }

  if (typeof raw !== "string") {
    throw new Error("Invalid asset payload.");
  }

  const parsed = JSON.parse(raw) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error("Invalid asset payload.");
  }

  return parsed.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(`Asset ${index + 1} is invalid.`);
    }

    const candidate = item as Partial<AssetPayload>;
    const type = candidate.type;
    const sourceType = candidate.sourceType;
    const sourceUrl = typeof candidate.sourceUrl === "string" ? candidate.sourceUrl.trim() : "";
    const storageKey = typeof candidate.storageKey === "string" ? candidate.storageKey.trim() : "";

    if (type !== "model" && type !== "audio" && type !== "image") {
      throw new Error(`Asset ${index + 1} has an invalid type.`);
    }

    if (sourceType !== "upload" && sourceType !== "sketchfab" && sourceType !== "external") {
      throw new Error(`Asset ${index + 1} has an invalid source type.`);
    }

    if (!sourceUrl && !storageKey) {
      throw new Error(`Asset ${index + 1} requires a source URL or storage key.`);
    }

    if (type === "model") {
      const modelSource = sourceUrl || storageKey;
      if (!modelSource || !isAllowedModelAssetSource(modelSource)) {
        throw new Error(`Asset ${index + 1} must reference a .glb/.gltf file or a Sketchfab model URL.`);
      }
    }

    return {
      id: typeof candidate.id === "string" ? candidate.id : undefined,
      type,
      sourceType,
      sourceUrl: sourceUrl || undefined,
      previewImageUrl: typeof candidate.previewImageUrl === "string" ? candidate.previewImageUrl.trim() || undefined : undefined,
      storageKey: storageKey || undefined,
      title: typeof candidate.title === "string" ? candidate.title.trim() || undefined : undefined,
      author: typeof candidate.author === "string" ? candidate.author.trim() || undefined : undefined,
      license: typeof candidate.license === "string" ? candidate.license.trim() || undefined : undefined,
      attribution: typeof candidate.attribution === "string" ? candidate.attribution.trim() || undefined : undefined
    };
  });
}

export async function saveDevicesAction(
  projectId: string,
  _prevState: SaveDevicesState,
  formData: FormData
): Promise<SaveDevicesState> {
  try {
    const assets = parseAssets(formData.get("assetsJson"));
    const devices = parseDevices(formData.get("devicesJson"));

    if (devices.length > MAX_DEVICES_PER_PROJECT) {
      throw new Error(`Each project can have up to ${MAX_DEVICES_PER_PROJECT} devices.`);
    }

    const resolvedAssetIdByDraftId = new Map<string, string>();

    if (assets.length > 0) {
      const savedAssets = await syncProjectAssets(projectId, assets);
      assets.forEach((asset, index) => {
        if (asset.id && savedAssets[index]?.id) {
          resolvedAssetIdByDraftId.set(asset.id, savedAssets[index].id);
        }
      });
    }

    const resolvedDevices = devices.map((device) => ({
      ...device,
      modelAssetId: device.modelAssetId ? resolvedAssetIdByDraftId.get(device.modelAssetId) ?? device.modelAssetId : undefined,
      musicAssetId: device.musicAssetId ? resolvedAssetIdByDraftId.get(device.musicAssetId) ?? device.musicAssetId : undefined
    }));

    await replaceProjectDevices(projectId, resolvedDevices);
    return { success: "Collection saved." };
  } catch (error) {
    return { error: getErrorMessage(error, "Failed to save devices.") };
  }
}
