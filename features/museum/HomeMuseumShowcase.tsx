"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { HomeHero } from "@/components/marketing/HomeHero";
import { MuseumTimeline } from "@/components/museum/MuseumTimeline";
import { NowPlayingCard } from "@/components/museum/NowPlayingCard";
import { ScrambleText } from "@/components/ui/ScrambleText";
import {
  PREVIEW_RANGE,
  SNAP_CAPTURE_RADIUS,
  SNAP_THRESHOLD,
  getMuseumSceneModelConfig,
  sortDevices
} from "@/features/museum/lib/config";
import { useMuseumScene, type ProgressCanvas } from "@/features/museum/hooks/useMuseumScene";
import { clamp, smoothstep } from "@/features/museum/lib/math";
import type { MuseumProjectBundle } from "@/types";

type HomeMuseumShowcaseProps = {
  bundle: MuseumProjectBundle;
};

const HERO_DEVICE_INDEX = 1;
const THEME_STORAGE_KEY = "object-echo-theme";

export function HomeMuseumShowcase({ bundle }: HomeMuseumShowcaseProps) {
  const devices = useMemo(() => sortDevices(bundle), [bundle]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [museumReveal, setMuseumReveal] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [centeredIndex, setCenteredIndex] = useState(HERO_DEVICE_INDEX);
  const [isScrollInteracting, setIsScrollInteracting] = useState(false);
  const [displayedProgress, setDisplayedProgress] = useState(HERO_DEVICE_INDEX);
  const [cardAnimKey, setCardAnimKey] = useState(0);
  const [modelScale, setModelScale] = useState(1);
  const [cardScale, setCardScale] = useState(1);
  const canvasRef = useRef<ProgressCanvas | null>(null);
  const scrollIdleTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setViewportHeight(window.innerHeight);
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    const wantsDark = savedTheme ? savedTheme === "dark" : bundle.publishedPage.theme.darkModeDefault;

    document.body.classList.toggle("dark", wantsDark);
    setIsDarkMode(wantsDark);
    window.dispatchEvent(new Event("object-echo-themechange"));
  }, []);

  useEffect(() => {
    const syncTheme = () => setIsDarkMode(document.body.classList.contains("dark"));

    syncTheme();
    window.addEventListener("storage", syncTheme);
    window.addEventListener("object-echo-themechange", syncTheme as EventListener);

    return () => {
      window.removeEventListener("storage", syncTheme);
      window.removeEventListener("object-echo-themechange", syncTheme as EventListener);
    };
  }, []);

  useEffect(() => {
    const onResize = () => setViewportHeight(window.innerHeight);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      setIsScrollInteracting(true);
      if (scrollIdleTimeoutRef.current !== null) {
        window.clearTimeout(scrollIdleTimeoutRef.current);
      }
      scrollIdleTimeoutRef.current = window.setTimeout(() => {
        setIsScrollInteracting(false);
        scrollIdleTimeoutRef.current = null;
      }, 140);

      if (ticking) return;
      ticking = true;

      window.requestAnimationFrame(() => {
        const heroHeight = viewportHeight || window.innerHeight;
        const reveal = clamp(window.scrollY / (heroHeight * 0.92), 0, 1);
        const museumScroll = Math.max(window.scrollY - heroHeight, 0);
        const museumMax = Math.max(document.documentElement.scrollHeight - window.innerHeight - heroHeight, 1);
        const ratio = museumMax > 0 ? museumScroll / museumMax : 0;

        setMuseumReveal(reveal);
        setScrollProgress(clamp(ratio, 0, 1) * Math.max(devices.length - 1, 0));
        ticking = false;
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (scrollIdleTimeoutRef.current !== null) {
        window.clearTimeout(scrollIdleTimeoutRef.current);
      }
    };
  }, [devices.length, viewportHeight]);

  const nearestIndex = clamp(Math.round(scrollProgress), 0, Math.max(devices.length - 1, 0));
  const isInSnapZone = Math.abs(scrollProgress - nearestIndex) <= SNAP_CAPTURE_RADIUS;

  useEffect(() => {
    if (museumReveal < 0.12) {
      setCenteredIndex(HERO_DEVICE_INDEX);
      return;
    }

    if (isInSnapZone) setCenteredIndex(nearestIndex);
  }, [isInSnapZone, museumReveal, nearestIndex]);

  const current = devices[centeredIndex] ?? devices[HERO_DEVICE_INDEX] ?? devices[0];
  const isSvgDevice = current ? getMuseumSceneModelConfig(current)?.kind === "svg" : false;

  useEffect(() => {
    setCardAnimKey((value) => value + 1);
  }, [centeredIndex]);

  const phase = scrollProgress - centeredIndex;
  const previewPhase = clamp((phase / SNAP_THRESHOLD) * PREVIEW_RANGE, -PREVIEW_RANGE, PREVIEW_RANGE);
  const museumTargetProgress = isScrollInteracting
    ? centeredIndex + previewPhase
    : isInSnapZone
      ? centeredIndex
      : scrollProgress;
  const targetVisualProgress =
    museumReveal < 0.18
      ? HERO_DEVICE_INDEX
      : HERO_DEVICE_INDEX + (museumTargetProgress - HERO_DEVICE_INDEX) * smoothstep(0.18, 0.42, museumReveal);

  useEffect(() => {
    let raf = 0;

    const tick = () => {
      setDisplayedProgress((currentValue) => {
        const nextValue = currentValue + (targetVisualProgress - currentValue) * 0.16;
        return Math.abs(targetVisualProgress - nextValue) < 0.0015 ? targetVisualProgress : nextValue;
      });
      raf = window.requestAnimationFrame(tick);
    };

    tick();
    return () => window.cancelAnimationFrame(raf);
  }, [targetVisualProgress]);

  const displayPhase = displayedProgress - centeredIndex;
  const leftMotionY = -displayPhase * 36;
  const leftMotionGlow = 1 - Math.min(Math.abs(displayPhase) / PREVIEW_RANGE, 1) * 0.55;
  const playerMotionY = -displayPhase * 36;
  const playerMotionGlow = 1 - Math.min(Math.abs(displayPhase) / PREVIEW_RANGE, 1) * 0.55;
  const museumOpacity = smoothstep(0.16, 0.88, museumReveal);
  const heroOpacity = 1 - smoothstep(0.06, 0.78, museumReveal);
  const heroIsActive = heroOpacity > 0.66;

  useMuseumScene(canvasRef, bundle, displayedProgress, isDarkMode, {
    heroFocusIndex: HERO_DEVICE_INDEX,
    heroSpinStrength: 0,
    heroSpinCutoff: HERO_DEVICE_INDEX + 0.2,
    modelScaleMultiplier: modelScale,
    svgCardScaleMultiplier: cardScale
  });

  const jumpToDevice = (index: number) => {
    document.getElementById(`scene-${index}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const enterMuseum = () => {
    window.scrollTo({ top: viewportHeight || window.innerHeight, behavior: "smooth" });
  };

  if (!current) return null;

  return (
    <div className="page home-showcase">
      <canvas ref={canvasRef} className="bg-canvas home-bg-canvas" style={{ opacity: museumOpacity }} />
      <div className="museum-device-accent-layer" style={{ opacity: museumOpacity }} aria-hidden="true" />

      <HomeHero opacity={heroOpacity} isActive={heroIsActive} onEnter={enterMuseum} />

      <main
        className={`museum-device-shell overlay${isSvgDevice ? " museum-device-shell-svg" : ""}`}
        style={{ opacity: museumOpacity, pointerEvents: museumOpacity > 0.4 ? "auto" : "none" }}
      >
        <aside className="museum-device-timeline">
          <MuseumTimeline
            devices={devices}
            centeredIndex={centeredIndex}
            displayedProgress={displayedProgress}
            onJump={jumpToDevice}
          />
        </aside>

        <section className={`museum-device-stage${isSvgDevice ? " museum-device-stage-svg" : ""}`}>
          <div className="museum-device-backword" aria-hidden="true">
            {current.name}
          </div>
          <div
            className={`museum-device-copy${isSvgDevice ? " museum-device-copy-svg" : ""}`}
            style={isSvgDevice ? { opacity: leftMotionGlow } : { transform: `translateY(${leftMotionY}px)`, opacity: leftMotionGlow }}
          >
            <h1 key={`title-${cardAnimKey}`} className="museum-device-title fade-card">
              <ScrambleText active={museumOpacity > 0.4} replayToken={cardAnimKey} text="CASIO" settleDurationMs={720} />
            </h1>
            <p className="museum-device-summary fade-card">PERSONAL DEVICE MUSEUM</p>
          </div>
        </section>

        <aside className="museum-device-panel">
          <section className="museum-spec-card museum-spec-card-highlight">
            <div className="museum-spec-header">
              <div>
                <div className="museum-spec-label">Device</div>
                <div className="museum-spec-value">{current.name}</div>
              </div>
              <div className="museum-spec-badge museum-spec-badge-highlight">{current.year}</div>
            </div>
            <p className="museum-spec-description">{current.era}</p>
          </section>

          <section className="museum-spec-card">
            <div className="museum-spec-header">
              <div>
                <div className="museum-spec-label">Scene Controls</div>
                <div className="museum-spec-value">Scale Tuning</div>
              </div>
            </div>
            <div className="museum-control-list">
              <label className="museum-control">
                <div className="museum-control-row">
                  <span className="museum-spec-item-label">Model Size</span>
                  <span className="museum-spec-item-value">{modelScale.toFixed(2)}x</span>
                </div>
                <input
                  className="museum-control-slider"
                  type="range"
                  min="0.7"
                  max="1.45"
                  step="0.01"
                  value={modelScale}
                  onChange={(event) => setModelScale(Number(event.target.value))}
                />
              </label>
              {isSvgDevice ? (
                <label className="museum-control">
                  <div className="museum-control-row">
                    <span className="museum-spec-item-label">Card Size</span>
                    <span className="museum-spec-item-value">{cardScale.toFixed(2)}x</span>
                  </div>
                  <input
                    className="museum-control-slider"
                    type="range"
                    min="0.7"
                    max="1.55"
                    step="0.01"
                    value={cardScale}
                    onChange={(event) => setCardScale(Number(event.target.value))}
                  />
                </label>
              ) : null}
            </div>
          </section>

          <NowPlayingCard
            device={current}
            theme={bundle.publishedPage.theme}
            museumOpacity={museumOpacity}
            motionY={playerMotionY}
            glow={playerMotionGlow}
            cardKey={cardAnimKey}
            variant="panel"
          />
        </aside>
      </main>

      <section className="scroll-track">
        <section className="hero-spacer" aria-hidden="true" />
        {devices.map((device, index) => (
          <section key={device.id} id={`scene-${index}`} className="scroll-section" aria-hidden="true" />
        ))}
      </section>
    </div>
  );
}
