"use client";

import { useEffect, useMemo, useState } from "react";
import { MuseumTimeline } from "@/components/museum/MuseumTimeline";
import { NowPlayingCard } from "@/components/museum/NowPlayingCard";
import { SketchfabViewer } from "@/components/museum/SketchfabViewer";
import { getMuseumViewerModel, sortDevices } from "@/features/museum/lib/config";
import type { MuseumProjectBundle } from "@/types";

type MuseumExperienceProps = {
  bundle: MuseumProjectBundle;
};

export function MuseumExperience({ bundle }: MuseumExperienceProps) {
  const devices = useMemo(() => sortDevices(bundle), [bundle]);
  const [darkMode, setDarkMode] = useState(bundle.publishedPage.theme.darkModeDefault);
  const [centeredIndex, setCenteredIndex] = useState(0);

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
    return () => document.body.classList.remove("dark");
  }, [darkMode]);

  const current = devices[centeredIndex] ?? devices[0];
  const currentAudioAsset = current?.musicAssetId
    ? bundle.assets.find((asset) => asset.id === current.musicAssetId && asset.type === "audio")
    : undefined;
  const viewerModel = current ? getMuseumViewerModel(current, bundle.assets) : undefined;

  if (!current) return null;

  return (
    <div className="page museum-viewer-page">
      <div className="museum-viewer-backdrop" aria-hidden="true" />

      <button type="button" className="mode-btn overlay" onClick={() => setDarkMode((value) => !value)}>
        {darkMode ? "LIGHT" : "DARK"}
      </button>

      <header className="museum-viewer-header">
        <p className="museum-viewer-kicker">{bundle.publishedPage.theme.timelineLabel}</p>
        <h1>{bundle.publishedPage.title}</h1>
        <p>{bundle.publishedPage.description}</p>
      </header>

      <main className="museum-viewer-shell">
        <aside className="museum-device-timeline">
          <MuseumTimeline
            devices={devices}
            centeredIndex={centeredIndex}
            displayedProgress={centeredIndex}
            onJump={setCenteredIndex}
          />
        </aside>

        <section className="museum-viewer-stage">
          <div className="museum-device-backword" aria-hidden="true">
            {current.name}
          </div>

          {viewerModel ? (
            <SketchfabViewer uid={viewerModel.uid} title={viewerModel.title} className="museum-viewer-card" />
          ) : (
            <section className="museum-viewer-empty panel">
              <h2>No interactive model attached</h2>
              <p>Attach a Sketchfab embed URL to this device to render it in the museum viewer.</p>
            </section>
          )}

          {viewerModel ? (
            <section className="museum-spec-card museum-spec-card-highlight museum-viewer-meta">
              <div className="museum-spec-header">
                <div>
                  <div className="museum-spec-label">Viewer Source</div>
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
              <p className="museum-spec-description">
                {viewerModel.author ? `${viewerModel.author} · ` : ""}
                {viewerModel.license ?? "License pending"}
              </p>
              {viewerModel.attribution ? <p className="museum-spec-note">{viewerModel.attribution}</p> : null}
              {viewerModel.isFallback ? (
                <p className="museum-spec-note">The attached model is not a viewer-compatible URL. Showing the default viewer instead.</p>
              ) : null}
            </section>
          ) : null}
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

          <NowPlayingCard
            device={current}
            theme={bundle.publishedPage.theme}
            audioAsset={currentAudioAsset}
            museumOpacity={1}
            motionY={0}
            glow={1}
            cardKey={centeredIndex}
            variant="panel"
          />
        </aside>
      </main>
    </div>
  );
}
