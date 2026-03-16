"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    Sketchfab?: new (version: string, iframe: HTMLIFrameElement) => {
      init: (
        uid: string,
        options: {
          success?: (api: {
            start: (callback?: () => void) => void;
            stop: () => void;
            addEventListener: (event: string, callback: () => void) => void;
          }) => void;
          error?: () => void;
          autostart?: 0 | 1;
          preload?: 0 | 1;
          ui_controls?: 0 | 1;
          ui_infos?: 0 | 1;
          ui_stop?: 0 | 1;
          ui_watermark?: 0 | 1;
        }
      ) => void;
    };
  }
}

const VIEWER_SCRIPT_URL = "https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js";
const VIEWER_VERSION = "1.12.1";

type SketchfabViewerProps = {
  uid: string;
  title: string;
  className?: string;
};

let scriptLoadPromise: Promise<void> | undefined;

function ensureViewerScript() {
  if (typeof window === "undefined" || window.Sketchfab) {
    return Promise.resolve();
  }

  if (!scriptLoadPromise) {
    scriptLoadPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(`script[src="${VIEWER_SCRIPT_URL}"]`);
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("Failed to load Sketchfab Viewer API.")), {
          once: true
        });
        return;
      }

      const script = document.createElement("script");
      script.src = VIEWER_SCRIPT_URL;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Sketchfab Viewer API."));
      document.head.appendChild(script);
    });
  }

  return scriptLoadPromise;
}

export function SketchfabViewer({ uid, title, className }: SketchfabViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const apiRef = useRef<{ start: () => void; stop: () => void } | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    const iframe = iframeRef.current;

    if (!iframe) return;

    setStatus("loading");
    apiRef.current = null;

    void ensureViewerScript()
      .then(() => {
        if (cancelled || !window.Sketchfab || !iframe) return;

        const client = new window.Sketchfab(VIEWER_VERSION, iframe);
        client.init(uid, {
          autostart: 1,
          preload: 1,
          ui_controls: 1,
          ui_infos: 0,
          ui_stop: 0,
          ui_watermark: 1,
          success: (api) => {
            if (cancelled) return;

            apiRef.current = {
              start: () => api.start(),
              stop: () => api.stop()
            };

            api.addEventListener("viewerready", () => {
              if (!cancelled) {
                setStatus("ready");
              }
            });

            api.start();
          },
          error: () => {
            if (!cancelled) {
              setStatus("error");
            }
          }
        });
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
      apiRef.current = null;
    };
  }, [uid]);

  return (
    <section className={className ? `sketchfab-viewer ${className}` : "sketchfab-viewer"}>
      <div className="sketchfab-viewer-frame">
        <iframe ref={iframeRef} title={title} allow="autoplay; fullscreen; xr-spatial-tracking" />
      </div>
      <div className="sketchfab-viewer-toolbar">
        <span className={`sketchfab-viewer-status is-${status}`}>
          {status === "ready" ? "Viewer Ready" : status === "error" ? "Viewer Error" : "Loading Viewer"}
        </span>
        <div className="sketchfab-viewer-actions">
          <button type="button" className="ghost-button" onClick={() => apiRef.current?.start()} disabled={!apiRef.current}>
            Start
          </button>
          <button type="button" className="ghost-button" onClick={() => apiRef.current?.stop()} disabled={!apiRef.current}>
            Stop
          </button>
        </div>
      </div>
    </section>
  );
}
