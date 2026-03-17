import { useEffect, useMemo, useRef, useState } from "react";
import { AudioEraArtwork } from "@/components/museum/AudioEraArtwork";
import type { ProjectAsset, ProjectDevice, ThemeConfig } from "@/types";

type NowPlayingCardProps = {
  device: ProjectDevice;
  theme: ThemeConfig;
  audioAsset?: ProjectAsset;
  museumOpacity: number;
  motionY: number;
  glow: number;
  cardKey: number;
  variant?: "floating" | "panel";
};

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "00:00";
  }

  const wholeSeconds = Math.floor(seconds);
  const mins = Math.floor(wholeSeconds / 60);
  const secs = wholeSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function NowPlayingCard({
  device,
  theme,
  audioAsset,
  museumOpacity,
  motionY,
  glow,
  cardKey,
  variant = "floating"
}: NowPlayingCardProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioSrc = audioAsset?.sourceUrl?.trim();
  const trackTitle = audioAsset?.title?.trim() || theme.soundtrackTitle;
  const trackSubtitle = useMemo(() => {
    if (audioAsset?.author?.trim()) {
      return `${device.name} · ${audioAsset.author.trim()}`;
    }
    if (audioAsset?.attribution?.trim()) {
      return `${device.name} · ${audioAsset.attribution.trim()}`;
    }
    return `${device.name} ${theme.soundtrackSubtitle}`;
  }, [audioAsset?.attribution, audioAsset?.author, device.name, theme.soundtrackSubtitle]);
  const progressWidth = duration > 0 ? `${(currentTime / duration) * 100}%` : "0%";

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    audio.load();
  }, [audioSrc, cardKey, device.id]);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio || !audioSrc) return;

    if (audio.paused) {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
      return;
    }

    audio.pause();
    setIsPlaying(false);
  };

  return (
    <section
      className={`player-right card-xl ${variant === "panel" ? "player-panel" : "player-layer"}`}
      key={`player-${cardKey}`}
      style={{
        transform: variant === "panel" ? `translateY(${motionY * 0.2}px)` : `translateY(calc(-50% + ${motionY}px))`,
        opacity: glow * museumOpacity,
        pointerEvents: museumOpacity > 0.4 ? "auto" : "none"
      }}
    >
      <div className="small-caption">{variant === "panel" ? "SOUNDTRACK" : "NOW PLAYING"}</div>
      <div className="player-wrap">
        <AudioEraArtwork device={device} />
        <div>
          <div className="player-actions">
            <div className="track-title">{trackTitle}</div>
            <button
              type="button"
              className="player-toggle"
              onClick={() => void togglePlayback()}
              disabled={!audioSrc}
              aria-label={isPlaying ? "Pause soundtrack" : "Play soundtrack"}
            >
              {isPlaying ? "Pause" : audioSrc ? "Play" : "Demo"}
            </button>
          </div>
          <div className="track-sub">{trackSubtitle}</div>
          <div className="bar">
            <div className="bar-fill" style={{ width: progressWidth }} />
          </div>
          <div className="times">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration || 238)}</span>
          </div>
        </div>
      </div>
      <audio
        ref={audioRef}
        src={audioSrc}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
      />
    </section>
  );
}
