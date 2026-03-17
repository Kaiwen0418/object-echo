"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MuseumTimeline } from "@/components/museum/MuseumTimeline";
import { NowPlayingCard } from "@/components/museum/NowPlayingCard";
import { SketchfabViewer } from "@/components/museum/SketchfabViewer";
import { buildSketchfabThumbnailProxyUrl, getMuseumViewerModel, sortDevices } from "@/features/museum/lib/config";
import { clamp } from "@/features/museum/lib/math";
import type { MuseumProjectBundle } from "@/types";

type MuseumExperienceProps = {
  bundle: MuseumProjectBundle;
};

export function MuseumExperience({ bundle }: MuseumExperienceProps) {
  const devices = useMemo(() => sortDevices(bundle), [bundle]);
  const [darkMode, setDarkMode] = useState(bundle.publishedPage.theme.darkModeDefault);
  const [centeredIndex, setCenteredIndex] = useState(0);
  const [displayedProgress, setDisplayedProgress] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrollInteracting, setIsScrollInteracting] = useState(false);
  const scrollIdleTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
    return () => document.body.classList.remove("dark");
  }, [darkMode]);

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
        const sections = Math.max(devices.length - 1, 1);
        const viewportHeight = window.innerHeight || 1;
        const ratio = clamp(window.scrollY / Math.max(viewportHeight * sections, 1), 0, 1);
        setScrollProgress(ratio * Math.max(devices.length - 1, 0));
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
  }, [devices.length]);

  useEffect(() => {
    setCenteredIndex(clamp(Math.round(scrollProgress), 0, Math.max(devices.length - 1, 0)));
  }, [devices.length, scrollProgress]);

  useEffect(() => {
    let raf = 0;

    const tick = () => {
      setDisplayedProgress((currentValue) => {
        const targetValue = isScrollInteracting ? scrollProgress : centeredIndex;
        const nextValue = currentValue + (targetValue - currentValue) * 0.16;
        return Math.abs(targetValue - nextValue) < 0.0015 ? targetValue : nextValue;
      });
      raf = window.requestAnimationFrame(tick);
    };

    tick();
    return () => window.cancelAnimationFrame(raf);
  }, [centeredIndex, isScrollInteracting, scrollProgress]);

  const current = devices[centeredIndex] ?? devices[0];
  const currentAudioAsset = current?.musicAssetId
    ? bundle.assets.find((asset) => asset.id === current.musicAssetId && asset.type === "audio")
    : undefined;
  const viewerModel = current ? getMuseumViewerModel(current, bundle.assets) : undefined;
  const viewerBackdrop = buildSketchfabThumbnailProxyUrl(viewerModel?.previewImageUrl);
  const displayPhase = displayedProgress - centeredIndex;
  const playerMotionY = -displayPhase * 36;
  const playerMotionGlow = 1 - Math.min(Math.abs(displayPhase) / 0.86, 1) * 0.55;

  const jumpToDevice = (index: number) => {
    document.getElementById(`scene-${index}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  if (!current) return null;

  return (
    <div className="page museum-viewer-page">
      <div className="museum-viewer-backdrop" aria-hidden="true" />

      <button type="button" className="mode-btn overlay" onClick={() => setDarkMode((value) => !value)}>
        {darkMode ? "LIGHT" : "DARK"}
      </button>

      <main className="museum-device-shell overlay">
        <aside className="museum-device-timeline">
          <MuseumTimeline
            devices={devices}
            centeredIndex={centeredIndex}
            displayedProgress={displayedProgress}
            onJump={jumpToDevice}
          />
        </aside>

        <section className="museum-device-stage">
          {viewerBackdrop ? (
            <div className="museum-viewer-stage-poster" aria-hidden="true">
              <img src={viewerBackdrop} alt="" />
            </div>
          ) : null}
          <div className="museum-device-backword" aria-hidden="true">
            {current.name}
          </div>

          {viewerModel ? (
            <SketchfabViewer
              key={viewerModel.uid}
              uid={viewerModel.uid}
              title={viewerModel.title}
              subtitle={`${current.year} · ${current.era || "Archive"}`}
              previewImageUrl={viewerModel.previewImageUrl}
              className="museum-viewer-card"
            />
          ) : (
            <section className="museum-viewer-empty panel">
              <h2>No interactive model attached</h2>
              <p>Attach a Sketchfab embed URL to this device to render it in the museum viewer.</p>
            </section>
          )}

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
                <div className="museum-spec-label">Specifications</div>
                <div className="museum-spec-value">Archive Notes</div>
              </div>
            </div>
            <div className="museum-spec-list">
              {current.specs.map((spec) => (
                <div key={`${current.id}-${spec.label}`} className="museum-spec-row">
                  <span className="museum-spec-item-label">{spec.label}</span>
                  <span className="museum-spec-item-value">{spec.value}</span>
                </div>
              ))}
            </div>
          </section>

          {viewerModel ? (
            <section className="museum-spec-card museum-spec-card-highlight museum-viewer-meta">
              <div className="museum-spec-header">
                <div>
                  <div className="museum-spec-label">Model Source</div>
                  <div className="museum-spec-value">{viewerModel.title}</div>
                </div>
                <a
                  className="museum-spec-badge museum-spec-badge-highlight"
                  href={viewerModel.viewerUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Sketchfab
                </a>
              </div>
              <div className="museum-spec-list">
                <div className="museum-spec-row">
                  <span className="museum-spec-item-label">Author</span>
                  <span className="museum-spec-item-value">{viewerModel.author ?? "Unknown"}</span>
                </div>
                <div className="museum-spec-row">
                  <span className="museum-spec-item-label">License</span>
                  <span className="museum-spec-item-value">{viewerModel.license ?? "Pending"}</span>
                </div>
              </div>
              {viewerModel.attribution ? <p className="museum-spec-note">{viewerModel.attribution}</p> : null}
              {viewerModel.isFallback ? (
                <p className="museum-spec-note">The attached model is not viewer-compatible. Showing the default viewer model instead.</p>
              ) : null}
            </section>
          ) : null}

          <NowPlayingCard
            device={current}
            theme={bundle.publishedPage.theme}
            audioAsset={currentAudioAsset}
            museumOpacity={1}
            motionY={playerMotionY}
            glow={playerMotionGlow}
            cardKey={centeredIndex}
            variant="panel"
          />
        </aside>
      </main>

      <section className="scroll-track">
        {devices.map((device, index) => (
          <section key={device.id} id={`scene-${index}`} className="scroll-section" aria-hidden="true" />
        ))}
      </section>
    </div>
  );
}
