import type { MuseumProjectBundle, MuseumSceneModelConfig, ProjectDevice } from "@/types";
import { getMuseumSvgMarkup } from "@/features/museum/lib/svg-renderers";

export const TIMELINE_DETAIL_TICKS = [-0.8, -0.45, -0.2, 0.35, 0.7, 1.35, 1.7, 2.35, 2.7, 3.2, 3.5, 3.8];
export const SNAP_THRESHOLD = 1.92;
export const PREVIEW_RANGE = 0.86;
export const SNAP_CAPTURE_RADIUS = 0.54;

const MODEL_CONFIGS: Record<string, MuseumSceneModelConfig> = {
  "CASIO F-91W": {
    kind: "svg",
    path: `data:image/svg+xml;utf8,${encodeURIComponent(getMuseumSvgMarkup("CASIO F-91W") ?? "")}`,
    scale: 2.18,
    lift: 0.34,
    yaw: Math.PI * 1.22,
    pitch: Math.PI * 0.5,
    planeWidth: 1.72,
    planeHeight: 2.28
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

export function getMuseumSceneModelConfig(device: ProjectDevice) {
  return MODEL_CONFIGS[device.name];
}

export function sortDevices(bundle: MuseumProjectBundle) {
  return [...bundle.devices].sort((a, b) => a.sortOrder - b.sortOrder);
}
