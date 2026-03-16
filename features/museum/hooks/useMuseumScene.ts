"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { MuseumProjectBundle, ProjectDevice } from "@/types";
import {
  getMuseumAssetModelOverride,
  getMuseumDefaultSceneModelConfig,
  getMuseumSceneModelConfig,
  sortDevices
} from "@/features/museum/lib/config";
import { clamp, smoothstep } from "@/features/museum/lib/math";

export type ProgressCanvas = HTMLCanvasElement & {
  __updateProgress?: (value: number) => void;
};

export type MuseumDeviceRenderState = "loading" | "ready" | "fallback";

function setObjectOpacity(root: THREE.Object3D, opacity: number) {
  root.traverse((child: THREE.Object3D) => {
    if (!(child instanceof THREE.Mesh) || !child.material) return;

    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material: THREE.Material) => {
      if (!("opacity" in material)) return;
      material.transparent = opacity < 0.999;
      (material as THREE.Material & { opacity: number }).opacity = opacity;
      material.needsUpdate = true;
    });
  });
}

function createDeviceMesh(device: ProjectDevice, darkMode: boolean) {
  const material = new THREE.MeshStandardMaterial({
    color: darkMode ? "#8ba0bf" : "#34435a",
    roughness: 0.92,
    metalness: 0.04
  });

  return new THREE.Mesh(new THREE.SphereGeometry(0.72, 22, 22), material);
}

function createDeviceObject(device: ProjectDevice, darkMode: boolean) {
  const group = new THREE.Group();
  const mesh = createDeviceMesh(device, darkMode);
  mesh.scale.setScalar(1.22);
  group.add(mesh);
  return group;
}

function tuneModelMaterials(root: THREE.Object3D, darkMode: boolean, config?: ReturnType<typeof getMuseumSceneModelConfig>) {
  const brightness = config?.brightness ?? (darkMode ? 1.18 : 1.12);
  const roughnessScale = config?.roughnessScale ?? 0.88;
  const metalnessScale = config?.metalnessScale ?? 0.75;
  const emissiveIntensity = config?.emissiveIntensity;

  root.traverse((child: THREE.Object3D) => {
    if (!(child instanceof THREE.Mesh) || !child.material) return;

    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material: THREE.Material) => {
      const typedMaterial = material as THREE.MeshStandardMaterial;
      if (typedMaterial.color) typedMaterial.color.multiplyScalar(brightness);
      if (typeof typedMaterial.roughness === "number") {
        typedMaterial.roughness = Math.max(0.18, typedMaterial.roughness * roughnessScale);
      }
      if (typeof typedMaterial.metalness === "number") {
        typedMaterial.metalness = Math.min(0.22, typedMaterial.metalness * metalnessScale);
      }
      if (
        typeof typedMaterial.emissiveIntensity === "number" &&
        typeof emissiveIntensity === "number"
      ) {
        typedMaterial.emissiveIntensity = emissiveIntensity;
      }
      typedMaterial.needsUpdate = true;
    });
  });
}

export function useMuseumScene(
  canvasRef: RefObject<ProgressCanvas | null>,
  bundle: MuseumProjectBundle,
  progress: number,
  darkMode: boolean,
  options?: {
    heroFocusIndex?: number;
    heroSpinStrength?: number;
    heroSpinCutoff?: number;
    modelScaleMultiplier?: number;
  }
) {
  const targetProgressRef = useRef(progress);
  const [deviceRenderStates, setDeviceRenderStates] = useState<Record<string, MuseumDeviceRenderState>>({});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const devices = sortDevices(bundle);
    setDeviceRenderStates(
      Object.fromEntries(devices.map((device) => [device.id, "loading" satisfies MuseumDeviceRenderState]))
    );
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0.35, 5);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    scene.add(new THREE.AmbientLight(0xffffff, darkMode ? 0.75 : 0.9));

    const key = new THREE.DirectionalLight("#c2d9ff", 1.45);
    key.position.set(darkMode ? 2.8 : 4, darkMode ? 2.4 : 2, darkMode ? 5.8 : 3);
    key.castShadow = true;
    key.shadow.mapSize.width = 1024;
    key.shadow.mapSize.height = 1024;
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 20;
    key.shadow.camera.left = -6;
    key.shadow.camera.right = 6;
    key.shadow.camera.top = 6;
    key.shadow.camera.bottom = -6;
    key.shadow.bias = -0.0008;
    scene.add(key);

    const fill = new THREE.DirectionalLight("#ffffff", darkMode ? 0.6 : 0.42);
    fill.position.set(-5, 2, 4);
    scene.add(fill);

    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(22, 14),
      new THREE.ShadowMaterial({ color: "#94a3b8", opacity: darkMode ? 0 : 0.2 })
    );
    shadowPlane.position.set(0, 0.85, -1.8);
    shadowPlane.receiveShadow = !darkMode;
    scene.add(shadowPlane);

    const darkBackdropPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      new THREE.ShadowMaterial({ color: "#4f78c9", opacity: darkMode ? 0.22 : 0 })
    );
    darkBackdropPlane.position.set(-0.8, 0.1, -1.65);
    darkBackdropPlane.receiveShadow = darkMode;
    scene.add(darkBackdropPlane);

    const rail = new THREE.Group();
    const spacing = 4.2;
    const deviceMeshes: THREE.Group[] = [];
    const loadingPlaceholders: Array<THREE.Group | null> = [];
    const pendingModelFades: Array<THREE.Group | null> = [];
    const modelFadeProgress: number[] = [];
    const loader = new GLTFLoader();
    let isDisposed = false;

    const markDeviceState = (deviceId: string, state: MuseumDeviceRenderState) => {
      setDeviceRenderStates((current) => (current[deviceId] === state ? current : { ...current, [deviceId]: state }));
    };

    const finalizeModelLoad = (
      modelGroup: THREE.Group,
      device: ProjectDevice,
      index: number,
      config: NonNullable<ReturnType<typeof getMuseumSceneModelConfig>>,
      state: Exclude<MuseumDeviceRenderState, "loading">
    ) => {
      if (isDisposed) return;

      modelGroup.position.y = -index * spacing;
      modelGroup.position.y += config.lift;
      modelGroup.position.x += config.offsetX ?? 0;
      modelGroup.rotation.y = config.yaw ?? 0;
      modelGroup.rotation.x = config.pitch ?? 0;
      modelGroup.userData.renderKind = "gltf";
      modelGroup.userData.disableShadows = false;
      modelGroup.userData.basePosition = modelGroup.position.clone();
      modelGroup.userData.baseScale = modelGroup.scale.clone();

      setObjectOpacity(modelGroup, 0);
      rail.add(modelGroup);
      deviceMeshes[index] = modelGroup;
      pendingModelFades[index] = modelGroup;
      modelFadeProgress[index] = 0;
      markDeviceState(device.id, state);
    };

    const loadGltfModel = (
      device: ProjectDevice,
      index: number,
      config: NonNullable<ReturnType<typeof getMuseumSceneModelConfig>>,
      state: Exclude<MuseumDeviceRenderState, "loading">,
      onError?: () => void
    ) => {
      loader.load(
        config.path,
        (gltf: { scene: THREE.Group }) => {
          if (isDisposed) return;

          const modelGroup = new THREE.Group();
          const model = gltf.scene;
          const box = new THREE.Box3().setFromObject(model);
          const size = new THREE.Vector3();
          const center = new THREE.Vector3();
          box.getSize(size);
          box.getCenter(center);

          model.position.sub(center);
          tuneModelMaterials(model, darkMode, config);

          const maxDim = Math.max(size.x, size.y, size.z) || 1;
          model.scale.setScalar(config.scale / maxDim);

          const scaledBox = new THREE.Box3().setFromObject(model);
          const scaledSize = new THREE.Vector3();
          const scaledCenter = new THREE.Vector3();
          scaledBox.getSize(scaledSize);
          scaledBox.getCenter(scaledCenter);

          model.position.x -= scaledCenter.x;
          model.position.y -= scaledCenter.y - scaledSize.y * config.lift;
          model.position.z -= scaledCenter.z;
          model.position.x += config.offsetX ?? 0;
          model.rotation.y = config.yaw ?? 0;
          model.rotation.x = config.pitch ?? 0;
          model.traverse((child: THREE.Object3D) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = !darkMode;
              child.receiveShadow = !darkMode;
            }
          });

          modelGroup.add(model);
          finalizeModelLoad(modelGroup, device, index, config, state);
        },
        undefined,
        () => onError?.()
      );
    };

    devices.forEach((device, index) => {
      const placeholder = createDeviceObject(device, darkMode);
      placeholder.position.y = -index * spacing;
      placeholder.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = !darkMode;
          child.receiveShadow = !darkMode;
        }
      });
      rail.add(placeholder);
      deviceMeshes.push(placeholder);
      loadingPlaceholders.push(placeholder);
      pendingModelFades.push(null);
      modelFadeProgress.push(0);

      const config = getMuseumSceneModelConfig(device, bundle.assets);
      const assetOverride = getMuseumAssetModelOverride(device, bundle.assets);
      const fallbackConfig = getMuseumDefaultSceneModelConfig(device);
      if (!config) {
        markDeviceState(device.id, "fallback");
        return;
      }

      const loadFallback = () => {
        if (!assetOverride || !fallbackConfig || fallbackConfig.path === config.path) {
          markDeviceState(device.id, "fallback");
          return;
        }

        loadGltfModel(device, index, fallbackConfig, "fallback", () => markDeviceState(device.id, "fallback"));
      };

      loadGltfModel(device, index, config, "ready", loadFallback);
    });

    scene.add(rail);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight, false);
    };

    onResize();
    window.addEventListener("resize", onResize);

    canvas.__updateProgress = (value: number) => {
      targetProgressRef.current = value;
    };

    let raf = 0;
    let currentProgress = targetProgressRef.current;
    let velocity = 0;

    const tick = () => {
      const modelScaleMultiplier = options?.modelScaleMultiplier ?? 1;
      const delta = targetProgressRef.current - currentProgress;
      velocity = velocity * 0.8 + delta * 0.022;
      velocity = clamp(velocity, -0.08, 0.08);
      currentProgress += velocity;

      if (Math.abs(delta) < 0.0015 && Math.abs(velocity) < 0.0015) {
        currentProgress = targetProgressRef.current;
        velocity = 0;
      }

      rail.position.y = currentProgress * spacing;
      darkBackdropPlane.visible = darkMode;
      darkBackdropPlane.receiveShadow = darkMode;
      darkBackdropPlane.position.set(-0.8, 0.1, -1.65);
      (darkBackdropPlane.material as THREE.ShadowMaterial).opacity = darkMode ? 0.12 : 0;

      loadingPlaceholders.forEach((placeholder, index) => {
        if (!placeholder) return;
        const local = currentProgress - index;
        const focus = 1 - clamp(Math.abs(local), 0, 1);
        const pulse = 1 + Math.sin(performance.now() * 0.008 + index * 1.1) * 0.26;
        const settle = 0.28 + focus * 0.24;
        placeholder.scale.setScalar(1.22 * pulse * settle * modelScaleMultiplier);
      });

      pendingModelFades.forEach((modelGroup, index) => {
        if (!modelGroup) return;

        const nextOpacity = Math.min(modelFadeProgress[index] + 0.06, 1);
        modelFadeProgress[index] = nextOpacity;
        setObjectOpacity(modelGroup, nextOpacity);

        const basePosition = modelGroup.userData.basePosition as THREE.Vector3 | undefined;
        if (basePosition) {
          modelGroup.position.copy(basePosition);
        }
        modelGroup.userData.introScale = 1;

        const placeholder = loadingPlaceholders[index];
        if (placeholder) {
          setObjectOpacity(placeholder, Math.max(0, 1 - nextOpacity));
        }

        if (nextOpacity >= 1) {
          const placeholderToRemove = loadingPlaceholders[index];
          if (placeholderToRemove) {
            rail.remove(placeholderToRemove);
            loadingPlaceholders[index] = null;
          }
          pendingModelFades[index] = null;
          setObjectOpacity(modelGroup, 1);
        }
      });

      deviceMeshes.forEach((mesh, index) => {
        const local = currentProgress - index;
        const nearCenter = 1 - clamp(Math.abs(local), 0, 1);
        const shadowActive = Math.abs(local) < 0.55;
        const disableShadows = mesh.userData.disableShadows === true;
        const baseScale = mesh.userData.baseScale as THREE.Vector3 | undefined;
        const introScale = (mesh.userData.introScale as number | undefined) ?? 1;

        if (baseScale) {
          mesh.scale.copy(baseScale);
          mesh.scale.multiplyScalar(introScale * modelScaleMultiplier);
        }

        mesh.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = disableShadows ? false : shadowActive;
            child.receiveShadow = disableShadows ? false : shadowActive;
          }
        });

        if (local <= 0) {
          const align = smoothstep(0, 1, nearCenter);
          mesh.rotation.x = (Math.PI / 2) * (1 - align);
        } else {
          const back = smoothstep(0, 1, clamp(local, 0, 1));
          mesh.rotation.x = -Math.PI * 0.2 * back;
        }

        mesh.rotation.y = Math.PI * 0.06 * local;
        mesh.position.z = -Math.abs(local) * 0.25;

        if (darkMode && index === Math.round(currentProgress)) {
          darkBackdropPlane.position.x = -0.86 - Math.max(local, -0.35) * 0.24;
          darkBackdropPlane.position.y = 0.08 + nearCenter * 0.05;
          darkBackdropPlane.position.z = -1.68 - Math.min(Math.abs(local), 1) * 0.08;
          (darkBackdropPlane.material as THREE.ShadowMaterial).opacity = 0.22 * nearCenter + 0.04;
        }

        const heroFocusIndex = options?.heroFocusIndex;
        const heroSpinStrength = options?.heroSpinStrength ?? 0;
        const heroSpinCutoff = options?.heroSpinCutoff ?? 0;

        if (
          typeof heroFocusIndex === "number" &&
          index === heroFocusIndex &&
          currentProgress <= heroSpinCutoff &&
          heroSpinStrength > 0
        ) {
          mesh.rotation.y += performance.now() * heroSpinStrength;
          mesh.rotation.z = Math.sin(performance.now() * heroSpinStrength * 0.35) * 0.04;
        }
      });

      renderer.render(scene, camera);
      raf = window.requestAnimationFrame(tick);
    };

    tick();

    return () => {
      isDisposed = true;
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      canvas.__updateProgress = undefined;
      (darkBackdropPlane.material as THREE.ShadowMaterial).dispose();
      deviceMeshes.forEach((mesh) => {
        const disposeTexture = mesh.userData.disposeTexture as (() => void) | undefined;
        disposeTexture?.();
      });
      renderer.dispose();
    };
  }, [
    bundle,
    canvasRef,
    darkMode,
    options?.heroFocusIndex,
    options?.heroSpinCutoff,
    options?.heroSpinStrength,
    options?.modelScaleMultiplier
  ]);

  useEffect(() => {
    canvasRef.current?.__updateProgress?.(progress);
  }, [canvasRef, progress]);

  return {
    deviceRenderStates
  };
}
