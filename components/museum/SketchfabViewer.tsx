"use client";

import { useEffect, useRef, useState } from "react";
import { buildSketchfabThumbnailProxyUrl } from "@/features/museum/lib/config";

declare global {
  interface Window {
    Sketchfab?: new (version: string, iframe: HTMLIFrameElement) => {
      init: (
        uid: string,
        options: {
          success?: (api: {
            start: (callback?: () => void) => void;
            stop: () => void;
            addEventListener: (event: string, callback: (index?: number) => void) => void;
            hideAnnotation: (index: number, callback?: (error: unknown, hiddenIndex?: number) => void) => void;
            hideAnnotationTooltips: (callback?: (error: unknown) => void) => void;
            getAnnotationList: (callback: (error: unknown, annotations?: Array<{ id?: number }>) => void) => void;
            unselectAnnotation: (callback?: (error: unknown) => void) => void;
            gotoAnnotation: (
              index: number,
              options: {
                preventCameraAnimation?: boolean;
                preventCameraMove?: boolean;
              },
              callback?: (error: unknown, selectedIndex?: number) => void
            ) => void;
          }) => void;
          error?: () => void;
          autostart?: 0 | 1;
          preload?: 0 | 1;
          ui_controls?: 0 | 1;
          ui_infos?: 0 | 1;
          ui_stop?: 0 | 1;
          ui_watermark?: 0 | 1;
          transparent?: 0 | 1;
          annotation?: number;
          annotations_visible?: 0 | 1;
          autospin?: number;
          camera?: 0 | 1;
          cardboard?: 0 | 1;
          ui_animations?: 0 | 1;
          ui_annotations?: 0 | 1;
          ui_fullscreen?: 0 | 1;
          ui_general_controls?: 0 | 1;
          ui_help?: 0 | 1;
          ui_hint?: 0 | 1;
          ui_inspector?: 0 | 1;
          ui_settings?: 0 | 1;
          ui_vr?: 0 | 1;
          ui_ar?: 0 | 1;
          ui_watermark_link?: 0 | 1;
          ui_color?: string;
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
  subtitle?: string;
  previewImageUrl?: string;
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

function suppressAnnotations(api: {
  hideAnnotation: (index: number, callback?: (error: unknown, hiddenIndex?: number) => void) => void;
  hideAnnotationTooltips: (callback?: (error: unknown) => void) => void;
  getAnnotationList: (callback: (error: unknown, annotations?: Array<{ id?: number }>) => void) => void;
  unselectAnnotation: (callback?: (error: unknown) => void) => void;
  gotoAnnotation: (
    index: number,
    options: {
      preventCameraAnimation?: boolean;
      preventCameraMove?: boolean;
    },
    callback?: (error: unknown, selectedIndex?: number) => void
  ) => void;
}) {
  api.hideAnnotationTooltips();
  api.unselectAnnotation();
  api.gotoAnnotation(-1, { preventCameraAnimation: true, preventCameraMove: true });
  api.getAnnotationList((error, annotations) => {
    if (error || !annotations?.length) {
      return;
    }

    annotations.forEach((_, index) => {
      api.hideAnnotation(index);
    });
  });
}

export function SketchfabViewer({ uid, title, subtitle, previewImageUrl, className }: SketchfabViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const apiRef = useRef<{ start: () => void } | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const previewProxyUrl = buildSketchfabThumbnailProxyUrl(previewImageUrl);

  useEffect(() => {
    let cancelled = false;
    const iframe = iframeRef.current;

    if (!iframe) return;

    setStatus("loading");
    apiRef.current = null;
    iframe.src = "about:blank";

    void ensureViewerScript()
      .then(() => {
        if (cancelled || !window.Sketchfab || !iframe) return;

        const client = new window.Sketchfab(VIEWER_VERSION, iframe);
        client.init(uid, {
          annotation: 0,
          annotations_visible: 0,
          autostart: 1,
          autospin: 0,
          camera: 0,
          cardboard: 0,
          preload: 1,
          ui_animations: 0,
          ui_annotations: 0,
          ui_controls: 0,
          ui_fullscreen: 0,
          ui_general_controls: 0,
          ui_help: 0,
          ui_hint: 0,
          ui_infos: 0,
          ui_inspector: 0,
          ui_settings: 0,
          ui_stop: 0,
          ui_vr: 0,
          ui_ar: 0,
          ui_watermark: 0,
          ui_watermark_link: 0,
          ui_color: "000000",
          transparent: 1,
          success: (api) => {
            if (cancelled) return;

            apiRef.current = {
              start: () => api.start()
            };

            api.addEventListener("viewerready", () => {
              if (!cancelled) {
                suppressAnnotations(api);
                setStatus("ready");
              }
            });

            api.addEventListener("annotationSelect", () => {
              if (!cancelled) {
                suppressAnnotations(api);
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
      iframe.src = "about:blank";
    };
  }, [uid]);

  return (
    <section className={className ? `sketchfab-viewer ${className}` : "sketchfab-viewer"}>
      <div className="sketchfab-viewer-frame">
        {previewProxyUrl ? (
          <div className="sketchfab-viewer-poster" aria-hidden="true">
            <img src={previewProxyUrl} alt="" />
          </div>
        ) : null}
        <div className="sketchfab-viewer-sheen" aria-hidden="true" />
        <div className="sketchfab-viewer-headline">
          <span className="sketchfab-viewer-label">Interactive Model</span>
          <strong>{title}</strong>
          {subtitle ? <span>{subtitle}</span> : null}
        </div>
        <iframe ref={iframeRef} title={title} allow="autoplay; fullscreen; xr-spatial-tracking" />
      </div>
      <div className="sketchfab-viewer-toolbar">
        <span className={`sketchfab-viewer-status is-${status}`}>
          {status === "ready" ? "Viewer Ready" : status === "error" ? "Viewer Error" : "Loading Viewer"}
        </span>
        <button type="button" className="ghost-button sketchfab-viewer-reload" onClick={() => apiRef.current?.start()} disabled={!apiRef.current}>
          Reload
        </button>
      </div>
    </section>
  );
}
