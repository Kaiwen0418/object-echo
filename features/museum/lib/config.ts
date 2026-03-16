import type { MuseumProjectBundle, MuseumSceneModelConfig, ProjectAsset, ProjectDevice } from "@/types";

export const TIMELINE_DETAIL_TICKS = [-0.8, -0.45, -0.2, 0.35, 0.7, 1.35, 1.7, 2.35, 2.7, 3.2, 3.5, 3.8];
export const SNAP_THRESHOLD = 1.92;
export const PREVIEW_RANGE = 0.86;
export const SNAP_CAPTURE_RADIUS = 0.54;

const MODEL_CONFIGS: Record<string, MuseumSceneModelConfig> = {
  "CASIO F-91W": {
    path: "/demo/models/casio_f-91w/scene.gltf",
    scale: 2.8,
    lift: 0.06,
    yaw: Math.PI * 0.24,
    pitch: Math.PI * 0.02
  },
  "NOKIA 3310": { path: "/demo/models/nokia_3310/scene.gltf", scale: 2.55, lift: 0.04, yaw: Math.PI * 0.14 },
  "SONY WALKMAN": {
    path: "/demo/models/sony_walkman_professional_wm-d6c/scene.gltf",
    scale: 3.2,
    lift: 0.02,
    yaw: Math.PI * 0.52,
    offsetX: -0.98
  },
  "IPOD NANO": {
    path: "/demo/models/ipod/scene.gltf",
    scale: 2.85,
    lift: 0.02,
    yaw: Math.PI * 0.42,
    pitch: Math.PI * 0.5
  },
  "SAMSUNG GALAXY MINI II": {
    path: "/demo/models/samsung_galaxy_s4/scene.gltf",
    scale: 3.25,
    lift: 0.03,
    yaw: Math.PI * 0.28
  },
  "WACOM TABLET": {
    path: "/demo/models/wacom_intuos_ctl-4100k-n/scene.gltf",
    scale: 3.9,
    lift: 0.02,
    yaw: Math.PI * 0.44
  },
  "MACBOOK M4": {
    path: "/demo/models/macbook_m4/scene.gltf",
    scale: 3.5,
    lift: 0.2,
    yaw: Math.PI * 0.8,
    pitch: Math.PI * 0.2
  }
};

export const DEFAULT_SKETCHFAB_MODELS: Record<
  string,
  {
    uid: string;
    title: string;
    author?: string;
    license?: string;
    attribution?: string;
  }
> = {
  "CASIO F-91W": {
    uid: "c3d445e4e77441eba265504c0391a415",
    title: "Casio F-91W",
    author: "Ahmad Riazi",
    license: "CC-BY-4.0",
    attribution: "Based on Sketchfab model by Ahmad Riazi"
  },
  "SONY WALKMAN": {
    uid: "fa57b1cf2cf34746baecc3fe1736b704",
    title: "Sony Walkman Professional WM-D6C",
    author: "Nedotyopa",
    license: "CC-BY-4.0",
    attribution: "Based on Sketchfab model by Nedotyopa"
  },
  "NOKIA 3310": {
    uid: "ff7c87c59f10466abe76b481ad03b418",
    title: "Nokia 3310",
    author: "SPD_3D",
    license: "CC-BY-4.0",
    attribution: "Based on Sketchfab model by SPD_3D"
  },
  "IPOD NANO": {
    uid: "ee9c5397f56049dca7cc123576ee3395",
    title: "Peach MP3 Player",
    author: "RealgrumpyKitten1",
    license: "CC-BY-4.0",
    attribution: "Based on Sketchfab model by RealgrumpyKitten1"
  },
  "SAMSUNG GALAXY MINI II": {
    uid: "2c66457dbce140439cdd361fef80c684",
    title: "Samsung Galaxy S4",
    author: "bhk",
    license: "CC-BY-4.0",
    attribution: "Based on Sketchfab model by bhk"
  },
  "WACOM TABLET": {
    uid: "3d91dc9bcf0a4ed0a78fae0507937f6c",
    title: "Graphic Tablet | Wacom Intuos CTL-4100K-N",
    author: "Astrien",
    license: "CC-BY-NC-4.0",
    attribution: "Based on Sketchfab model by Astrien"
  },
  "MACBOOK M4": {
    uid: "652a992f4f244122ae251f9cbb81da1e",
    title: "MacBook Pro 14 inch M5",
    author: "Apple User",
    license: "Sketchfab Standard",
    attribution: "Based on Sketchfab model by Apple User"
  }
};

export function buildSketchfabEmbedUrl(uid: string) {
  return `https://sketchfab.com/models/${uid}/embed`;
}

export function buildSketchfabViewerUrl(uid: string) {
  return `https://sketchfab.com/3d-models/${uid}`;
}

export function extractSketchfabUid(value?: string) {
  if (!value) return undefined;

  const trimmed = value.trim();
  const embedMatch = trimmed.match(/models\/([a-z0-9]{32})\/embed/i);
  if (embedMatch?.[1]) return embedMatch[1];

  const viewerMatch = trimmed.match(/3d-models\/.*-([a-z0-9]{32})(?:[/?#].*)?$/i);
  if (viewerMatch?.[1]) return viewerMatch[1];

  const rawMatch = trimmed.match(/\b([a-z0-9]{32})\b/i);
  return rawMatch?.[1];
}

export function getMuseumDefaultSceneModelConfig(device: ProjectDevice) {
  return MODEL_CONFIGS[device.name];
}

export function getMuseumAssetModelOverride(device: ProjectDevice, assets?: ProjectAsset[]) {
  if (!device.modelAssetId || !assets?.length) {
    return undefined;
  }

  const asset = assets.find((candidate) => candidate.id === device.modelAssetId && candidate.type === "model");
  const path = asset?.sourceUrl?.trim();

  if (!asset || !path) {
    return undefined;
  }

  return {
    asset,
    path
  };
}

export function getMuseumSceneModelConfig(device: ProjectDevice, assets?: ProjectAsset[]) {
  const fallback = getMuseumDefaultSceneModelConfig(device);
  const assetOverride = getMuseumAssetModelOverride(device, assets);

  if (!assetOverride) {
    return fallback;
  }

  return {
    ...(fallback ?? {
      scale: 2.8,
      lift: 0.04,
      yaw: Math.PI * 0.2,
      pitch: 0
    }),
    kind: "gltf",
    path: assetOverride.path
  };
}

export function getMuseumViewerModel(device: ProjectDevice, assets?: ProjectAsset[]) {
  const asset = device.modelAssetId
    ? assets?.find((candidate) => candidate.id === device.modelAssetId && candidate.type === "model")
    : undefined;
  const assetUid = extractSketchfabUid(asset?.sourceUrl);

  if (asset && assetUid) {
    return {
      uid: assetUid,
      title: asset.title ?? device.name,
      embedUrl: buildSketchfabEmbedUrl(assetUid),
      viewerUrl: buildSketchfabViewerUrl(assetUid),
      author: asset.author,
      license: asset.license,
      attribution: asset.attribution,
      isFallback: false
    };
  }

  const fallback = DEFAULT_SKETCHFAB_MODELS[device.name];
  if (!fallback) return undefined;

  return {
    uid: fallback.uid,
    title: fallback.title,
    embedUrl: buildSketchfabEmbedUrl(fallback.uid),
    viewerUrl: buildSketchfabViewerUrl(fallback.uid),
    author: fallback.author,
    license: fallback.license,
    attribution: fallback.attribution,
    isFallback: Boolean(asset)
  };
}

export function sortDevices(bundle: MuseumProjectBundle) {
  return [...bundle.devices].sort((a, b) => a.sortOrder - b.sortOrder);
}
