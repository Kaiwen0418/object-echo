"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { HomeHero } from "@/components/marketing/HomeHero";
import { MuseumTimeline } from "@/components/museum/MuseumTimeline";
import { NowPlayingCard } from "@/components/museum/NowPlayingCard";
import { PREVIEW_RANGE, SNAP_CAPTURE_RADIUS, SNAP_THRESHOLD, sortDevices } from "@/features/museum/lib/config";
import { useMuseumScene, type ProgressCanvas } from "@/features/museum/hooks/useMuseumScene";
import { clamp, smoothstep } from "@/features/museum/lib/math";
import type { MuseumProjectBundle } from "@/types";

type HomeMuseumShowcaseProps = {
  bundle: MuseumProjectBundle;
};

const HERO_DEVICE_INDEX = 1;

export function HomeMuseumShowcase({ bundle }: HomeMuseumShowcaseProps) {
  const devices = useMemo(() => sortDevices(bundle), [bundle]);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [museumReveal, setMuseumReveal] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [centeredIndex, setCenteredIndex] = useState(HERO_DEVICE_INDEX);
  const [isScrollInteracting, setIsScrollInteracting] = useState(false);
  const [displayedProgress, setDisplayedProgress] = useState(HERO_DEVICE_INDEX);
  const [cardAnimKey, setCardAnimKey] = useState(0);
  const canvasRef = useRef<ProgressCanvas | null>(null);
  const scrollIdleTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setViewportHeight(window.innerHeight);
    document.body.classList.remove("dark");
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
  const summary = current
    ? `${current.year} · ${current.era} · ${current.specs.map((item) => `${item.label} ${item.value}`).join(" / ")}`
    : "";
  const museumOpacity = smoothstep(0.16, 0.88, museumReveal);
  const heroOpacity = 1 - smoothstep(0.06, 0.78, museumReveal);

  useMuseumScene(canvasRef, bundle, displayedProgress, false, {
    heroFocusIndex: HERO_DEVICE_INDEX,
    heroSpinStrength: 0.00022,
    heroSpinCutoff: HERO_DEVICE_INDEX + 0.2
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
      <canvas ref={canvasRef} className="bg-canvas home-bg-canvas" />

      <HomeHero opacity={heroOpacity} onEnter={enterMuseum} />

      <main
        className="layout overlay"
        style={{ opacity: museumOpacity, pointerEvents: museumOpacity > 0.4 ? "auto" : "none" }}
      >
        <section className="left-rail">
          <section className="spec-left" style={{ transform: `translateY(${leftMotionY}px)`, opacity: leftMotionGlow }}>
            <p className="small-caption">{bundle.publishedPage.theme.timelineLabel}</p>
            <h1 key={`title-${cardAnimKey}`} className="model-title fade-card">
              {current.name}
            </h1>
            <p key={`summary-${cardAnimKey}`} className="model-summary fade-card">
              {summary}
            </p>
          </section>

          <MuseumTimeline
            devices={devices}
            centeredIndex={centeredIndex}
            displayedProgress={displayedProgress}
            onJump={jumpToDevice}
          />
        </section>
      </main>

      <NowPlayingCard
        device={current}
        theme={bundle.publishedPage.theme}
        museumOpacity={museumOpacity}
        motionY={playerMotionY}
        glow={playerMotionGlow}
        cardKey={cardAnimKey}
      />

      <section className="scroll-track">
        <section className="hero-spacer" aria-hidden="true" />
        {devices.map((device, index) => (
          <section key={device.id} id={`scene-${index}`} className="scroll-section" aria-hidden="true" />
        ))}
      </section>
    </div>
  );
}
