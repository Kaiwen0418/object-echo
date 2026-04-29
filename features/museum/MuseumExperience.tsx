"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MuseumTimeline } from "@/components/museum/MuseumTimeline";
import { MobileDeviceTabs } from "@/components/museum/MobileDeviceTabs";
import { NowPlayingCard } from "@/components/museum/NowPlayingCard";
import { SketchfabViewer } from "@/components/museum/SketchfabViewer";
import { buildSketchfabThumbnailProxyUrl, getMuseumViewerModel, sortDevices } from "@/features/museum/lib/config";
import { clamp } from "@/features/museum/lib/math";
import type { MuseumProjectBundle } from "@/types";

type MuseumExperienceProps = {
  bundle: MuseumProjectBundle;
};

type ViewerModel = NonNullable<ReturnType<typeof getMuseumViewerModel>>;

export function MuseumExperience({ bundle }: MuseumExperienceProps) {
  const devices = useMemo(() => sortDevices(bundle), [bundle]);
  const [darkMode, setDarkMode] = useState(bundle.publishedPage.theme.darkModeDefault);
  const [centeredIndex, setCenteredIndex] = useState(0);
  const [displayedProgress, setDisplayedProgress] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrollInteracting, setIsScrollInteracting] = useState(false);
  const [cachedViewerModels, setCachedViewerModels] = useState<ViewerModel[]>([]);
  const scrollIdleTimeoutRef = useRef<number | null>(null);
  const viewerModelsByIndex = useMemo(
    () => devices.map((device) => getMuseumViewerModel(device, bundle.assets)),
    [bundle.assets, devices]
  );

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

  useEffect(() => {
    const candidates = [centeredIndex - 1, centeredIndex, centeredIndex + 1]
      .map((index) => viewerModelsByIndex[index])
      .filter((model): model is ViewerModel => Boolean(model));

    if (!candidates.length) {
      return;
    }

    setCachedViewerModels((currentModels) => {
      const nextModels = [...currentModels];

      for (const candidate of candidates) {
        const existingIndex = nextModels.findIndex((model) => model.uid === candidate.uid);
        if (existingIndex >= 0) {
          nextModels.splice(existingIndex, 1);
        }
        nextModels.push(candidate);
      }

      return nextModels.slice(-4);
    });
  }, [centeredIndex, viewerModelsByIndex]);

  const current = devices[centeredIndex] ?? devices[0];
  const currentAudioAsset = current?.musicAssetId
    ? bundle.assets.find((asset) => asset.id === current.musicAssetId && asset.type === "audio")
    : undefined;
  const viewerModel = viewerModelsByIndex[centeredIndex];
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

      <main className="museum-device-shell overlay">
        <aside className="museum-device-timeline">
          <MuseumTimeline
            devices={devices}
            centeredIndex={centeredIndex}
            displayedProgress={displayedProgress}
            onJump={jumpToDevice}
          />
        </aside>

        <MobileDeviceTabs devices={devices} centeredIndex={centeredIndex} onJump={jumpToDevice} />

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
            <div className="museum-viewer-stack">
              {cachedViewerModels.map((cachedViewerModel) => (
                <SketchfabViewer
                  key={cachedViewerModel.uid}
                  uid={cachedViewerModel.uid}
                  title={cachedViewerModel.title}
                  subtitle={`${current.year} · ${current.era || "Archive"}`}
                  previewImageUrl={cachedViewerModel.previewImageUrl}
                  className="museum-viewer-card"
                  active={cachedViewerModel.uid === viewerModel.uid}
                />
              ))}
            </div>
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

          <details className="museum-disclosure museum-disclosure-specs" open>
            <summary className="museum-disclosure-summary">
              <span className="museum-spec-label">Specifications</span>
              <span className="museum-disclosure-title">Archive Notes</span>
            </summary>
            <section className="museum-spec-card museum-disclosure-card">
              <div className="museum-spec-list">
                {current.specs.map((spec) => (
                  <div key={`${current.id}-${spec.label}`} className="museum-spec-row">
                    <span className="museum-spec-item-label">{spec.label}</span>
                    <span className="museum-spec-item-value">{spec.value}</span>
                  </div>
                ))}
              </div>
            </section>
          </details>

          {viewerModel ? (
            <details className="museum-disclosure museum-disclosure-model" open>
              <summary className="museum-disclosure-summary museum-disclosure-summary-highlight">
                <span className="museum-spec-label">Model Source</span>
                <span className="museum-disclosure-title">{viewerModel.title}</span>
              </summary>
              <section className="museum-spec-card museum-spec-card-highlight museum-viewer-meta museum-disclosure-card">
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
            </details>
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
