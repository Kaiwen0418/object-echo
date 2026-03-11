"use client";

import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { MuseumProjectBundle, ProjectDevice } from "@/types";
import { getMuseumSceneModelConfig, sortDevices } from "@/features/museum/lib/config";
import { clamp, smoothstep } from "@/features/museum/lib/math";

export type ProgressCanvas = HTMLCanvasElement & {
  __updateProgress?: (value: number) => void;
};

function createDeviceMesh(device: ProjectDevice, darkMode: boolean) {
  const material = new THREE.MeshStandardMaterial({
    color: darkMode ? "#8ba0bf" : "#34435a",
    roughness: 0.42,
    metalness: 0.24
  });

  if (device.name.includes("NOKIA")) return new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.5, 0.28), material);
  if (device.name.includes("WALKMAN")) return new THREE.Mesh(new THREE.BoxGeometry(1.95, 1.25, 0.55), material);
  if (device.name.includes("IPOD")) return new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 0.3), material);
  if (device.name.includes("CASIO")) return new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.16, 24, 80), material);
  if (device.name.includes("GALAXY")) return new THREE.Mesh(new THREE.BoxGeometry(1.25, 2.2, 0.28), material);
  return new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.5, 0.1), material);
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
  darkMode: boolean
) {
  const targetProgressRef = useRef(progress);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const devices = sortDevices(bundle);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0.35, 5);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !darkMode;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    scene.add(new THREE.AmbientLight(0xffffff, darkMode ? 0.75 : 0.9));

    const key = new THREE.DirectionalLight("#c2d9ff", 1.45);
    key.position.set(4, 2, 3);
    key.castShadow = !darkMode;
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

    const rail = new THREE.Group();
    const spacing = 4.2;
    const deviceMeshes: THREE.Group[] = [];
    const loader = new GLTFLoader();
    let isDisposed = false;

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

      const config = getMuseumSceneModelConfig(device);
      if (!config) return;

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
          modelGroup.position.y = -index * spacing;
          rail.remove(placeholder);
          rail.add(modelGroup);
          deviceMeshes[index] = modelGroup;
        },
        undefined,
        () => undefined
      );
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
      const delta = targetProgressRef.current - currentProgress;
      velocity = velocity * 0.8 + delta * 0.022;
      velocity = clamp(velocity, -0.08, 0.08);
      currentProgress += velocity;

      if (Math.abs(delta) < 0.0015 && Math.abs(velocity) < 0.0015) {
        currentProgress = targetProgressRef.current;
        velocity = 0;
      }

      rail.position.y = currentProgress * spacing;

      deviceMeshes.forEach((mesh, index) => {
        const local = currentProgress - index;
        const nearCenter = 1 - clamp(Math.abs(local), 0, 1);
        const shadowActive = !darkMode && Math.abs(local) < 0.55;

        mesh.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = shadowActive;
            child.receiveShadow = shadowActive;
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
      renderer.dispose();
    };
  }, [bundle, canvasRef, darkMode]);

  useEffect(() => {
    canvasRef.current?.__updateProgress?.(progress);
  }, [canvasRef, progress]);
}
