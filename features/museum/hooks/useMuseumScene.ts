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

function createSvgCardTexture(darkMode: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = 2200;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const base = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  base.addColorStop(0, darkMode ? "#ff6a20" : "#ff6d1f");
  base.addColorStop(0.45, darkMode ? "#ff4a16" : "#ff5620");
  base.addColorStop(1, darkMode ? "#df210f" : "#e53016");
  context.fillStyle = base;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

function createSvgBackdropGroup(darkMode: boolean) {
  const group = new THREE.Group();
  const cardTexture = createSvgCardTexture(darkMode);
  const materials: THREE.Material[] = [];
  const cardTilt = -0.24;

  const cardCore = new THREE.Mesh(
    new THREE.BoxGeometry(2.48, 2.62, 0.08),
    new THREE.MeshStandardMaterial({
      color: darkMode ? "#ff4816" : "#ff5421",
      roughness: 0.98,
      metalness: 0
    })
  );
  cardCore.rotation.z = cardTilt;
  cardCore.position.set(0, 0, -0.1);
  group.add(cardCore);
  materials.push(cardCore.material);

  if (cardTexture) {
    const cardFace = new THREE.Mesh(
      new THREE.PlaneGeometry(2.5, 3.64),
      new THREE.MeshBasicMaterial({
        map: cardTexture,
        transparent: false,
        depthWrite: false
      })
    );
    cardFace.rotation.z = cardTilt;
    cardFace.position.set(0, 0, -0.05);
    group.add(cardFace);
    materials.push(cardFace.material);
  }

  group.userData.disposeBackdrop = () => {
    cardTexture?.dispose();
    materials.forEach((material) => material.dispose());
  };
  group.traverse((child: THREE.Object3D) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = false;
      child.receiveShadow = false;
    }
  });
  return group;
}

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

function createSvgModelObject(
  device: ProjectDevice,
  path: string,
  config: NonNullable<ReturnType<typeof getMuseumSceneModelConfig>>,
  darkMode: boolean,
  onLoad: (group: THREE.Group) => void
) {
  const image = new Image();
  image.decoding = "async";
  image.src = path;

  image.onload = () => {
    const svgWidth = image.naturalWidth || 300;
    const svgHeight = image.naturalHeight || 400;
    const scaleFactor = 6;
    const canvas = document.createElement("canvas");
    canvas.width = svgWidth * scaleFactor;
    canvas.height = svgHeight * scaleFactor;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.imageSmoothingEnabled = true;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;

    const group = new THREE.Group();
    const backdrop = createSvgBackdropGroup(darkMode);
    backdrop.position.set(0, 0, -0.08);
    group.add(backdrop);

    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = canvas.width;
    shadowCanvas.height = canvas.height;
    const shadowContext = shadowCanvas.getContext("2d");
    let shadowTexture: THREE.CanvasTexture | null = null;

    if (shadowContext) {
      shadowContext.clearRect(0, 0, shadowCanvas.width, shadowCanvas.height);
      shadowContext.filter = `brightness(0) saturate(0) blur(${24 * scaleFactor}px)`;
      shadowContext.drawImage(
        image,
        shadowCanvas.width * 0.06,
        shadowCanvas.height * 0.1,
        shadowCanvas.width * 0.88,
        shadowCanvas.height * 0.88
      );
      shadowContext.filter = "none";
      shadowContext.globalCompositeOperation = "source-in";
      shadowContext.fillStyle = "#ffffff";
      shadowContext.fillRect(0, 0, shadowCanvas.width, shadowCanvas.height);
      shadowContext.globalCompositeOperation = "source-over";

      shadowTexture = new THREE.CanvasTexture(shadowCanvas);
      shadowTexture.colorSpace = THREE.NoColorSpace;
      shadowTexture.anisotropy = 8;
      shadowTexture.generateMipmaps = true;
      shadowTexture.minFilter = THREE.LinearMipmapLinearFilter;
      shadowTexture.magFilter = THREE.LinearFilter;
    }

    if (shadowTexture) {
      const shadowMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(config.planeWidth ?? 1.2, config.planeHeight ?? 2.4),
        new THREE.MeshBasicMaterial({
          map: shadowTexture,
          color: "#000000",
          transparent: true,
          depthWrite: false,
          opacity: darkMode ? 0.5 : 0.28
        })
      );
      shadowMesh.position.set(0.1, -0.18, 0.01);
      shadowMesh.rotation.z = -0.01;
      shadowMesh.renderOrder = 1;
      shadowMesh.castShadow = false;
      shadowMesh.receiveShadow = false;
      group.add(shadowMesh);
      group.userData.svgShadow = shadowMesh;
      group.userData.svgShadowBaseScale = shadowMesh.scale.clone();
    }

    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(config.planeWidth ?? 1.2, config.planeHeight ?? 2.4),
      new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.02,
        side: THREE.DoubleSide,
        roughness: 0.96,
        metalness: 0,
        emissive: new THREE.Color(darkMode ? "#0f1730" : "#111111"),
        emissiveIntensity: darkMode ? 0.08 : 0.02
      })
    );

    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.position.z = 0.04;
    mesh.renderOrder = 2;
    group.add(mesh);
    group.userData.svgPlane = mesh;
    group.userData.svgPlaneBaseScale = mesh.scale.clone();
    group.userData.svgBackdrop = backdrop;
    group.userData.svgBackdropBaseScale = backdrop.scale.clone();
    group.userData.disposeTexture = () => {
      texture.dispose();
      shadowTexture?.dispose();
      (backdrop.userData.disposeBackdrop as (() => void) | undefined)?.();
    };
    onLoad(group);
  };
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
    svgCardScaleMultiplier?: number;
  }
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

    const svgAccentLight = new THREE.PointLight(darkMode ? "#7ea2ff" : "#ffffff", 0, 10, 2);
    svgAccentLight.position.set(0, 0, 2.4);
    scene.add(svgAccentLight);

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
    const renderKinds: Array<"gltf" | "svg"> = [];
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
      loadingPlaceholders.push(placeholder);
      pendingModelFades.push(null);
      modelFadeProgress.push(0);

      const config = getMuseumSceneModelConfig(device);
      renderKinds.push(config?.kind ?? "gltf");
      if (!config) return;

      if (config.kind === "svg") {
        createSvgModelObject(device, config.path, config, darkMode, (modelGroup) => {
          if (isDisposed) return;

          modelGroup.position.y = -index * spacing;
          modelGroup.position.y += config.lift;
          modelGroup.position.x += config.offsetX ?? 0;
          modelGroup.rotation.y = config.yaw ?? 0;
          modelGroup.rotation.x = config.pitch ?? 0;
          modelGroup.userData.renderKind = "svg";
          modelGroup.userData.disableShadows = true;
          modelGroup.userData.basePosition = modelGroup.position.clone();
          modelGroup.userData.baseScale = modelGroup.scale.clone();

          setObjectOpacity(modelGroup, 0);
          rail.add(modelGroup);
          deviceMeshes[index] = modelGroup;
          pendingModelFades[index] = modelGroup;
          modelFadeProgress[index] = 0;
        });
        return;
      }

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
          modelGroup.userData.renderKind = "gltf";
          modelGroup.userData.disableShadows = false;
          modelGroup.userData.basePosition = modelGroup.position.clone();
          modelGroup.userData.baseScale = modelGroup.scale.clone();
          setObjectOpacity(modelGroup, 0);
          rail.add(modelGroup);
          deviceMeshes[index] = modelGroup;
          pendingModelFades[index] = modelGroup;
          modelFadeProgress[index] = 0;
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
      const modelScaleMultiplier = options?.modelScaleMultiplier ?? 1;
      const svgCardScaleMultiplier = options?.svgCardScaleMultiplier ?? 1;
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
      svgAccentLight.intensity = 0;

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
        const renderKind = modelGroup.userData.renderKind as "gltf" | "svg" | undefined;
        if (basePosition) {
          modelGroup.position.copy(basePosition);
          if (renderKind === "svg") {
            modelGroup.position.y = basePosition.y - (1 - nextOpacity) * 0.24;
            modelGroup.position.z = -(1 - nextOpacity) * 0.18;
          }
        }
        modelGroup.userData.introScale = renderKind === "svg" ? 0.84 + nextOpacity * 0.16 : 1;

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
        const renderKind = mesh.userData.renderKind as "gltf" | "svg" | undefined;
        const baseScale = mesh.userData.baseScale as THREE.Vector3 | undefined;
        const introScale = (mesh.userData.introScale as number | undefined) ?? 1;
        const svgPlane = mesh.userData.svgPlane as THREE.Object3D | undefined;
        const svgPlaneBaseScale = mesh.userData.svgPlaneBaseScale as THREE.Vector3 | undefined;
        const svgShadow = mesh.userData.svgShadow as THREE.Object3D | undefined;
        const svgShadowBaseScale = mesh.userData.svgShadowBaseScale as THREE.Vector3 | undefined;
        const svgBackdrop = mesh.userData.svgBackdrop as THREE.Object3D | undefined;
        const svgBackdropBaseScale = mesh.userData.svgBackdropBaseScale as THREE.Vector3 | undefined;

        if (baseScale) {
          mesh.scale.copy(baseScale);
          mesh.scale.multiplyScalar(renderKind === "svg" ? introScale : modelScaleMultiplier);
        }

        if (renderKind === "svg") {
          if (svgPlane && svgPlaneBaseScale) {
            svgPlane.scale.copy(svgPlaneBaseScale);
            svgPlane.scale.multiplyScalar(modelScaleMultiplier);
          }
          if (svgShadow && svgShadowBaseScale) {
            svgShadow.scale.copy(svgShadowBaseScale);
            svgShadow.scale.multiplyScalar(modelScaleMultiplier);
          }
          if (svgBackdrop && svgBackdropBaseScale) {
            svgBackdrop.scale.copy(svgBackdropBaseScale);
            svgBackdrop.scale.multiplyScalar(svgCardScaleMultiplier);
          }
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

        if (darkMode && index === Math.round(currentProgress) && renderKinds[index] !== "svg") {
          darkBackdropPlane.position.x = -0.86 - Math.max(local, -0.35) * 0.24;
          darkBackdropPlane.position.y = 0.08 + nearCenter * 0.05;
          darkBackdropPlane.position.z = -1.68 - Math.min(Math.abs(local), 1) * 0.08;
          (darkBackdropPlane.material as THREE.ShadowMaterial).opacity = 0.22 * nearCenter + 0.04;
        }

        if (renderKind === "svg" && index === Math.round(currentProgress)) {
          svgAccentLight.intensity = darkMode ? 0.9 * nearCenter : 0.28 * nearCenter;
          svgAccentLight.position.set(mesh.position.x + 0.9, mesh.position.y + 0.25, 2.2);
          if (darkMode) {
            darkBackdropPlane.visible = false;
            (darkBackdropPlane.material as THREE.ShadowMaterial).opacity = 0;
          }
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
    options?.modelScaleMultiplier,
    options?.svgCardScaleMultiplier
  ]);

  useEffect(() => {
    canvasRef.current?.__updateProgress?.(progress);
  }, [canvasRef, progress]);
}
