"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MuseumHero } from "@/components/museum/MuseumHero";
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

type MuseumExperienceProps = {
  bundle: MuseumProjectBundle;
};

export function MuseumExperience({ bundle }: MuseumExperienceProps) {
  const devices = useMemo(() => sortDevices(bundle), [bundle]);
  const [darkMode, setDarkMode] = useState(bundle.publishedPage.theme.darkModeDefault);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [museumReveal, setMuseumReveal] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [centeredIndex, setCenteredIndex] = useState(0);
  const [isScrollInteracting, setIsScrollInteracting] = useState(false);
  const [displayedProgress, setDisplayedProgress] = useState(0);
  const [cardAnimKey, setCardAnimKey] = useState(0);
  const [modelScale, setModelScale] = useState(1);
  const [cardScale, setCardScale] = useState(1);
  const canvasRef = useRef<ProgressCanvas | null>(null);
  const scrollIdleTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setViewportHeight(window.innerHeight);
    document.body.classList.toggle("dark", darkMode);
    return () => document.body.classList.remove("dark");
  }, [darkMode]);

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
    if (isInSnapZone) setCenteredIndex(nearestIndex);
  }, [isInSnapZone, nearestIndex]);

  const current = devices[centeredIndex] ?? devices[0];
  const isSvgDevice = current ? getMuseumSceneModelConfig(current)?.kind === "svg" : false;

  useEffect(() => {
    setCardAnimKey((value) => value + 1);
  }, [centeredIndex]);

  const phase = scrollProgress - centeredIndex;
  const previewPhase = clamp((phase / SNAP_THRESHOLD) * PREVIEW_RANGE, -PREVIEW_RANGE, PREVIEW_RANGE);
  const targetVisualProgress = isScrollInteracting
    ? centeredIndex + previewPhase
    : isInSnapZone
      ? centeredIndex
      : scrollProgress;

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
  const summary = current
    ? `${current.year} · ${current.era} · ${current.specs.map((item) => `${item.label} ${item.value}`).join(" / ")}`
    : "";
  const museumOpacity = smoothstep(0.18, 0.88, museumReveal);
  const heroOpacity = 1 - smoothstep(0.08, 0.72, museumReveal);

  useMuseumScene(canvasRef, bundle, displayedProgress, darkMode, {
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
    <div className="page">
      <canvas ref={canvasRef} className="bg-canvas" style={{ opacity: museumOpacity }} />
      <div className="museum-device-accent-layer" style={{ opacity: museumOpacity }} aria-hidden="true" />

      <MuseumHero
        opacity={heroOpacity}
        title={bundle.publishedPage.title.toUpperCase()}
        description={bundle.publishedPage.description}
        onEnter={enterMuseum}
      />

      <button
        className="mode-btn overlay"
        style={{ opacity: museumOpacity, pointerEvents: museumOpacity > 0.4 ? "auto" : "none" }}
        onClick={() => setDarkMode((value) => !value)}
      >
        {darkMode ? "LIGHT" : "DARK"}
      </button>

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
            style={{ transform: `translateY(${leftMotionY}px)`, opacity: leftMotionGlow }}
          >
            <p className="small-caption museum-device-kicker">{bundle.publishedPage.theme.timelineLabel}</p>
            <h1 key={`title-${cardAnimKey}`} className="museum-device-title fade-card">
              <ScrambleText active={museumOpacity > 0.4} replayToken={cardAnimKey} text={current.name} settleDurationMs={720} />
            </h1>
            <p className="museum-device-era fade-card">{current.era}</p>
            <p key={`summary-${cardAnimKey}`} className="museum-device-summary fade-card">
              <ScrambleText
                active={museumOpacity > 0.4}
                replayToken={`summary-${cardAnimKey}`}
                text={summary}
                startDelayMs={80}
                settleDurationMs={980}
              />
            </p>
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
