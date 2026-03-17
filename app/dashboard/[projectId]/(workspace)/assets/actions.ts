"use server";

import { extractSketchfabUid } from "@/features/museum/lib/config";
import { syncProjectAssets } from "@/lib/utils/project";
import type { ProjectAsset } from "@/types";

export type SaveAssetsState = {
  error?: string;
  success?: string;
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

function isAllowedModelAssetSource(value: string) {
  const normalized = value.toLowerCase();
  return normalized.endsWith(".glb") || normalized.endsWith(".gltf") || Boolean(extractSketchfabUid(value));
}

function parseAssets(raw: FormDataEntryValue | null): AssetPayload[] {
  if (typeof raw !== "string") {
    throw new Error("Missing asset payload.");
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
      id: typeof candidate.id === "string" && !candidate.id.startsWith("draft_") ? candidate.id : undefined,
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

export async function saveAssetsAction(
  projectId: string,
  _prevState: SaveAssetsState,
  formData: FormData
): Promise<SaveAssetsState> {
  try {
    const assets = parseAssets(formData.get("assetsJson"));
    await syncProjectAssets(projectId, assets);
    return { success: "Assets saved." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save assets.";
    return { error: message };
  }
}
