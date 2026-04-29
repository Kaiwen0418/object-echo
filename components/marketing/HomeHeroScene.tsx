"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

function readIsDark() {
  if (typeof document === "undefined") return false;
  return document.body.classList.contains("dark");
}

export function HomeHeroScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const compactLayoutRef = useRef({
    cameraBaseY: 5,
    cameraBaseZ: 40,
    artifactBaseX: 12,
    artifactBaseY: 5,
    artifactScale: 1
  });
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const syncTheme = () => setIsDark(readIsDark());

    syncTheme();
    window.addEventListener("storage", syncTheme);
    window.addEventListener("object-echo-themechange", syncTheme as EventListener);

    return () => {
      window.removeEventListener("storage", syncTheme);
      window.removeEventListener("object-echo-themechange", syncTheme as EventListener);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(isDark ? 0x000000 : 0xf4f4f4, 0.001);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(0, 5, 40);

    scene.add(new THREE.AmbientLight(0xffffff, isDark ? 1 : 0.95));

    const keyLight = new THREE.DirectionalLight(isDark ? 0x00ff41 : 0xffffff, isDark ? 0.95 : 1.1);
    keyLight.position.set(8, 12, 14);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(isDark ? 0xff00aa : 0x888888, isDark ? 0.45 : 0.35);
    fillLight.position.set(-10, 6, 10);
    scene.add(fillLight);

    const planetGeo = new THREE.SphereGeometry(150, 64, 64);
    const planetMat = new THREE.MeshBasicMaterial({
      color: isDark ? 0x00ff41 : 0xdddddd,
      transparent: true,
      opacity: isDark ? 0.56 : 0.8
    });
    const planet = new THREE.Mesh(planetGeo, planetMat);
    planet.position.set(50, -120, -200);
    scene.add(planet);

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(155, 64, 64),
      new THREE.MeshBasicMaterial({
        color: isDark ? 0x00ff41 : 0x000000,
        transparent: true,
        opacity: isDark ? 0.1 : 0.05,
        side: THREE.BackSide
      })
    );
    atmosphere.position.copy(planet.position);
    scene.add(atmosphere);

    const starsGeo = new THREE.BufferGeometry();
    const starsCount = isDark ? 2800 : 1500;
    const positions = new Float32Array(starsCount * 3);
    const colors = new Float32Array(starsCount * 3);
    const lightPalette = [new THREE.Color(0x888888), new THREE.Color(0x000000)];
    const darkPalette = [new THREE.Color(0xffffff), new THREE.Color(0x00ff41), new THREE.Color(0xff00aa)];

    for (let i = 0; i < starsCount; i += 1) {
      const index = i * 3;
      positions[index] = (Math.random() - 0.5) * 800;
      positions[index + 1] = (Math.random() - 0.2) * 500;
      positions[index + 2] = (Math.random() - 1) * 500;

      const palette = isDark ? darkPalette : lightPalette;
      const color = palette[Math.floor(Math.random() * palette.length)] ?? palette[0];
      colors[index] = color.r;
      colors[index + 1] = color.g;
      colors[index + 2] = color.b;
    }

    starsGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    starsGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const stars = new THREE.Points(
      starsGeo,
      new THREE.PointsMaterial({
        size: isDark ? 0.8 : 0.6,
        vertexColors: true,
        transparent: true,
        opacity: 0.82
      })
    );
    scene.add(stars);

    const artifactGroup = new THREE.Group();
    const lineMaterial = new THREE.LineBasicMaterial({
      color: isDark ? 0x00ff41 : 0x000000,
      transparent: true,
      opacity: isDark ? 0.5 : 0.4
    });
    const solidMaterial = new THREE.MeshBasicMaterial({
      color: isDark ? 0x000000 : 0xeeeeee,
      transparent: true,
      opacity: isDark ? 0.95 : 0.9,
      depthWrite: true
    });

    const monitorGeo = new THREE.BoxGeometry(8, 6, 7);
    const monitorSolid = new THREE.Mesh(monitorGeo, solidMaterial);
    const monitorWire = new THREE.LineSegments(new THREE.EdgesGeometry(monitorGeo), lineMaterial);
    artifactGroup.add(monitorSolid);
    artifactGroup.add(monitorWire);

    const screenMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 4),
      new THREE.MeshBasicMaterial({
        color: isDark ? 0x00ff41 : 0xcccccc,
        transparent: true,
        opacity: isDark ? 0.15 : 0.4,
        side: THREE.DoubleSide
      })
    );
    screenMesh.position.set(0, 0, 3.51);
    artifactGroup.add(screenMesh);

    const gridHelper = new THREE.GridHelper(6, 12, isDark ? 0x00ff41 : 0x000000, isDark ? 0x00ff41 : 0x000000);
    gridHelper.rotation.x = Math.PI / 2;
    gridHelper.position.set(0, 0, 3.52);
    const gridMaterial = gridHelper.material as THREE.Material | THREE.Material[];
    const materials = Array.isArray(gridMaterial) ? gridMaterial : [gridMaterial];
    materials.forEach((material) => {
      material.transparent = true;
      material.opacity = isDark ? 0.4 : 0.2;
    });
    artifactGroup.add(gridHelper);

    const baseGeo = new THREE.BoxGeometry(9, 1, 5);
    const baseSolid = new THREE.Mesh(baseGeo, solidMaterial);
    const baseWire = new THREE.LineSegments(new THREE.EdgesGeometry(baseGeo), lineMaterial);
    baseSolid.position.set(0, -4.5, 3);
    baseWire.position.set(0, -4.5, 3);
    baseSolid.rotation.x = 0.2;
    baseWire.rotation.x = 0.2;
    artifactGroup.add(baseSolid);
    artifactGroup.add(baseWire);

    artifactGroup.position.set(12, 5, 0);
    artifactGroup.rotation.y = -Math.PI / 6;
    artifactGroup.rotation.x = 0.1;
    scene.add(artifactGroup);

    const streaksGroup = new THREE.Group();
    const streaks: Array<{ mesh: THREE.Mesh; speed: number; resetY: number }> = [];
    const streakGeo = new THREE.CylinderGeometry(isDark ? 0.05 : 0.04, isDark ? 0.05 : 0.04, isDark ? 20 : 25, 4);
    const streakMat = new THREE.MeshBasicMaterial({
      color: isDark ? 0xff00aa : 0x000000,
      transparent: true,
      opacity: isDark ? 1 : 0.2
    });

    for (let index = 0; index < (isDark ? 5 : 8); index += 1) {
      const streak = new THREE.Mesh(streakGeo, streakMat);
      streak.position.x = (Math.random() - 0.5) * 60;
      streak.position.y = 20 + Math.random() * 30;
      streak.position.z = -10 - Math.random() * 40;
      streak.rotation.z = Math.PI / 4 + (isDark ? Math.random() * 0.1 : 0);
      streaksGroup.add(streak);
      streaks.push({ mesh: streak, speed: 0.2 + Math.random() * (isDark ? 0.5 : 0.4), resetY: 50 });
    }
    scene.add(streaksGroup);

    const mouse = { x: 0, y: 0 };

    const onMouseMove = (event: MouseEvent) => {
      mouse.x = (event.clientX - window.innerWidth / 2) * 0.02;
      mouse.y = (event.clientY - window.innerHeight / 2) * 0.02;
    };

    const onResize = () => {
      const heroWidth = canvas.clientWidth || window.innerWidth;
      const heroHeight = canvas.clientHeight || window.innerHeight;
      camera.aspect = heroWidth / heroHeight;
      const isCompact = heroWidth <= 560;
      compactLayoutRef.current = isCompact
        ? {
            cameraBaseY: 4.2,
            cameraBaseZ: 48,
            artifactBaseX: 4.9,
            artifactBaseY: 3.2,
            artifactScale: 0.72
          }
        : {
            cameraBaseY: 5,
            cameraBaseZ: 40,
            artifactBaseX: 12,
            artifactBaseY: 5,
            artifactScale: 1
          };
      camera.position.set(0, compactLayoutRef.current.cameraBaseY, compactLayoutRef.current.cameraBaseZ);
      artifactGroup.position.set(compactLayoutRef.current.artifactBaseX, compactLayoutRef.current.artifactBaseY, 0);
      artifactGroup.scale.setScalar(compactLayoutRef.current.artifactScale);
      camera.updateProjectionMatrix();
      renderer.setSize(heroWidth, heroHeight, false);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("resize", onResize);
    onResize();

    const clock = new THREE.Clock();
    let raf = 0;

    const tick = () => {
      const elapsedTime = clock.getElapsedTime();
      const {
        cameraBaseY,
        artifactBaseX,
        artifactBaseY,
        artifactScale
      } = compactLayoutRef.current;

      planet.rotation.y = elapsedTime * (isDark ? 0.02 : 0.01);
      stars.rotation.y = elapsedTime * (isDark ? 0.005 : 0.002);
      stars.rotation.z = elapsedTime * (isDark ? 0.002 : 0);
      artifactGroup.position.x = artifactBaseX;
      artifactGroup.position.y =
        artifactBaseY + Math.sin(elapsedTime * (isDark ? 0.5 : 0.4)) * (isDark ? 1.5 : 0.8) * artifactScale;
      artifactGroup.rotation.y = -Math.PI / 6 + Math.sin(elapsedTime * 0.2) * (isDark ? 0.1 : 0.03);
      artifactGroup.scale.setScalar(artifactScale);

      streaks.forEach((item) => {
        item.mesh.position.y -= item.speed;
        item.mesh.position.x -= item.speed;
        if (item.mesh.position.y < -20) {
          item.mesh.position.y = item.resetY + (isDark ? Math.random() * 20 : 0);
          item.mesh.position.x = (Math.random() - 0.5) * 80;
        }
      });

      camera.position.x += (mouse.x - camera.position.x) * 0.02;
      camera.position.y += (-mouse.y - camera.position.y + cameraBaseY) * 0.02;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
      raf = window.requestAnimationFrame(tick);
    };

    tick();

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      starsGeo.dispose();
      renderer.dispose();
    };
  }, [isDark]);

  return (
    <div className="hero-scene" aria-hidden="true">
      <div className="hero-orbit" />
      <div className="hero-dot-grid" />
      <div className="hero-motion-lines">
        <span className="hero-motion-line hero-motion-line-a" />
        <span className="hero-motion-line hero-motion-line-b" />
        <span className="hero-motion-line hero-motion-line-c" />
      </div>
      <div className="hero-floating-dots">
        <span className="hero-float-dot hero-float-dot-a" />
        <span className="hero-float-dot hero-float-dot-b" />
        <span className="hero-float-dot hero-float-dot-c" />
        <span className="hero-float-dot hero-float-dot-d" />
      </div>
      <canvas ref={canvasRef} className="hero-scene-canvas" />
    </div>
  );
}
