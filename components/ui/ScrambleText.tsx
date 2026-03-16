"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type ScrambleTextProps = {
  text: string;
  className?: string;
  active?: boolean;
  replayToken?: string | number;
  startDelayMs?: number;
  settleDurationMs?: number;
  charset?: string;
};

const DEFAULT_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+?";

function randomGlyph(glyphs: string[]) {
  const randomIndex = Math.floor(Math.random() * glyphs.length);
  return glyphs[randomIndex] ?? "#";
}

export function ScrambleText({
  text,
  className,
  active = true,
  replayToken,
  startDelayMs = 180,
  settleDurationMs = 1350,
  charset = DEFAULT_CHARSET
}: ScrambleTextProps) {
  const [display, setDisplay] = useState(text);
  const [runId, setRunId] = useState(0);
  const wasActiveRef = useRef(false);

  const glyphs = useMemo(() => charset.split(""), [charset]);

  useEffect(() => {
    if (active && !wasActiveRef.current) {
      setRunId((value) => value + 1);
    }

    wasActiveRef.current = active;
  }, [active]);

  useEffect(() => {
    if (active) {
      setRunId((value) => value + 1);
    }
  }, [active, replayToken]);

  useEffect(() => {
    if (!active) {
      setDisplay(text);
      return;
    }

    let frame = 0;
    let timeout = 0;
    const startedAt = performance.now() + startDelayMs;

    const tick = (timestamp: number) => {
      if (timestamp < startedAt) {
        frame = window.requestAnimationFrame(tick);
        return;
      }

      const progress = Math.min((timestamp - startedAt) / settleDurationMs, 1);

      const next = text
        .split("")
        .map((character, index) => {
          if (character === " ") {
            return " ";
          }

          const revealPoint = index / Math.max(text.length - 1, 1);
          if (progress >= revealPoint) {
            return character;
          }

          return randomGlyph(glyphs);
        })
        .join("");

      setDisplay(next);

      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      } else {
        timeout = window.setTimeout(() => setDisplay(text), 40);
      }
    };

    setDisplay(
      text
        .split("")
        .map((character) => (character === " " ? " " : randomGlyph(glyphs)))
        .join("")
    );
    frame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [active, glyphs, runId, settleDurationMs, startDelayMs, text]);

  return <span className={className}>{display}</span>;
}
