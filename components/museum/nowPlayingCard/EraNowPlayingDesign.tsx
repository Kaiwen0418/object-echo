import { useEffect, useRef } from "react";

type EraNowPlayingDesignProps = {
  year: number;
  title: string;
  subtitle: string;
  isPlaying: boolean;
  hasAudio: boolean;
  currentTimeLabel: string;
  durationLabel: string;
  progressRatio: number;
  onToggle: () => void;
};

function getEraKey(year: number) {
  if (year < 1980) return "before1980";
  if (year < 1990) return "1980s";
  if (year < 2000) return "1990s";
  if (year < 2010) return "2000s";
  if (year < 2020) return "2010s";
  return "2020s";
}

function RingsCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let raf = 0;

    const draw = () => {
      frame += active ? 1.8 : 0.45;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < 4; i += 1) {
        const pulse = Math.sin(frame * 0.035 - i * 0.55) * (active ? 6 : 2);
        const radius = 46 + i * 14 + pulse;
        ctx.beginPath();
        ctx.arc(100, 100, radius, 0, Math.PI * 2);
        ctx.strokeStyle = i % 2 === 0 ? "#ffcc00" : "rgba(232,232,232,0.22)";
        ctx.lineWidth = i === 1 ? 1.2 : 1;
        ctx.stroke();
      }

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return <canvas ref={canvasRef} width={200} height={200} className="npc-canvas npc-canvas-rings" aria-hidden="true" />;
}

function RadialTicksCanvas({ active, accent, dim }: { active: boolean; accent: string; dim: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let tick = 0;
    let raf = 0;

    const draw = () => {
      tick += active ? 1.4 : 0.35;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const count = 64;
      const radius = 62;

      for (let i = 0; i < count; i += 1) {
        const angle = (i / count) * Math.PI * 2;
        const noise = active ? Math.sin(i * 0.35 + tick * 0.12) * 8 + Math.random() * 4 : Math.sin(i * 0.18) * 1.5;
        const length = 5 + Math.max(0, noise);
        const x1 = 100 + Math.cos(angle) * radius;
        const y1 = 100 + Math.sin(angle) * radius;
        const x2 = 100 + Math.cos(angle) * (radius + length);
        const y2 = 100 + Math.sin(angle) * (radius + length);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = i % 2 === 0 ? accent : dim;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(raf);
  }, [accent, active, dim]);

  return <canvas ref={canvasRef} width={200} height={200} className="npc-canvas npc-canvas-radial" aria-hidden="true" />;
}

function WaveCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let raf = 0;

    const draw = () => {
      frame += active ? 1.6 : 0.45;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.strokeStyle = "#d7d7d7";
      ctx.lineWidth = 1.2;

      const points = 110;
      const step = canvas.width / points;
      for (let i = 0; i <= points; i += 1) {
        const x = i * step;
        const y =
          canvas.height / 2 +
          Math.sin(i * 0.18 + frame * 0.08) * (active ? 10 : 4) +
          Math.sin(i * 0.37 - frame * 0.035) * (active ? 5 : 2);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return <canvas ref={canvasRef} width={272} height={48} className="npc-canvas npc-canvas-wave" aria-hidden="true" />;
}

function formatDeckCounter(label: string) {
  const safe = label || "00:00";
  return `00:${safe}`;
}

function Before1980Card(props: EraNowPlayingDesignProps) {
  return (
    <div className="npc-era-card npc-era-before1980">
      <div className="npc-before1980-record-wrap">
        <div className={`npc-before1980-record ${props.isPlaying ? "is-active" : ""}`}>
          <div className="npc-before1980-groove" />
          <div className="npc-before1980-label">SIDE A</div>
        </div>
      </div>
      <div className="npc-before1980-copy">
        <div>
          <div className="npc-era-eyebrow">Phat Beat Recorder</div>
          <div className="npc-era-title">{props.title}</div>
          <div className="npc-era-subtitle">{props.subtitle}</div>
        </div>
        <div className="npc-before1980-status">{props.isPlaying ? "Droppin' the needle..." : "Station idle."}</div>
        <div className="npc-before1980-controls">
          <div className="npc-era-timer">{props.currentTimeLabel}</div>
          <button type="button" className={`npc-toggle npc-rec-toggle ${props.isPlaying ? "is-active" : ""}`} onClick={props.onToggle} disabled={!props.hasAudio}>
            <span />
          </button>
        </div>
      </div>
    </div>
  );
}

function EightiesCard(props: EraNowPlayingDesignProps) {
  const segments = 20;
  const leftLevel = Math.max(2, Math.round(props.progressRatio * segments));
  const rightLevel = props.isPlaying ? Math.max(3, Math.round(((props.progressRatio * 0.8 + 0.2) % 1) * segments)) : 0;

  return (
    <div className="npc-era-card npc-era-1980s">
      <div className="npc-era-head">
        <div className="npc-era-brand">Variant Sonyc</div>
        <div className="npc-era-tag">TC-900 Digital Capture</div>
      </div>
      <div className="npc-era-1980s-screen">
        <div className="npc-era-screen-label">Level L/R</div>
        <div className="npc-era-vu">
          {Array.from({ length: segments }).map((_, index) => (
            <span key={`vu-l-${index}`} className={`npc-era-vu-segment ${index < leftLevel ? "is-on" : ""} ${index > 16 && index < leftLevel ? "is-peak" : ""}`} />
          ))}
        </div>
        <div className="npc-era-vu">
          {Array.from({ length: segments }).map((_, index) => (
            <span key={`vu-r-${index}`} className={`npc-era-vu-segment ${index < rightLevel ? "is-on" : ""} ${index > 16 && index < rightLevel ? "is-peak" : ""}`} />
          ))}
        </div>
        <div className="npc-era-screen-footer">
          <div>
            <div className="npc-era-screen-label">Counter</div>
            <div className="npc-era-screen-title">{props.title}</div>
          </div>
          <div className="npc-era-lcd-time">{formatDeckCounter(props.currentTimeLabel)}</div>
        </div>
      </div>
      <div className="npc-era-1980s-controls">
        <div className="npc-era-knob">
          <span />
          <small>Rec Lev</small>
        </div>
        <div className="npc-era-transport">
          <button type="button" className="npc-toggle npc-transport-stop" onClick={props.onToggle} disabled={!props.hasAudio && !props.isPlaying}>
            <span />
          </button>
          <button type="button" className={`npc-toggle npc-transport-rec ${props.isPlaying ? "is-active" : ""}`} onClick={props.onToggle} disabled={!props.hasAudio}>
            <span />
          </button>
        </div>
        <div className="npc-era-knob is-right">
          <span />
          <small>Output</small>
        </div>
      </div>
    </div>
  );
}

function NinetiesCard(props: EraNowPlayingDesignProps) {
  return (
    <div className="npc-era-card npc-era-1990s">
      <div className="npc-era-grid" />
      <div className="npc-era-accent-square" />
      <div className="npc-era-head">
        <div>
          <div className="npc-era-brand">Master Mix</div>
          <div className="npc-era-tag">Minimalist Form 02</div>
        </div>
        <div className="npc-era-right-meta">
          <div className="npc-era-brand">{props.year}</div>
          <div className="npc-era-tag">Bauhaus Edition</div>
        </div>
      </div>
      <div className="npc-era-1990s-stage">
        <RingsCanvas active={props.isPlaying} />
        <div className="npc-era-bauhaus-ring">
          <div className="npc-era-bauhaus-inner" />
          <div className="npc-era-bauhaus-dot" />
        </div>
      </div>
      <div className="npc-era-1990s-footer">
        <div className="npc-era-clock">{props.currentTimeLabel}</div>
        <div className="npc-era-track-block">
          <div className="npc-era-tag">Input Signal</div>
          <div className="npc-era-side">{props.title}</div>
        </div>
      </div>
      <button type="button" className="npc-era-corner-toggle" onClick={props.onToggle} disabled={!props.hasAudio}>
        {props.isPlaying ? "Pause" : props.hasAudio ? "Play" : "Demo"}
      </button>
    </div>
  );
}

function TwoThousandsCard(props: EraNowPlayingDesignProps) {
  return (
    <div className="npc-era-card npc-era-2000s">
      <div className="npc-era-noise" />
      <div className="npc-era-bootleg-head">
        <span>SIDE_A</span>
        <span>REC_094</span>
      </div>
      <div className="npc-era-2000s-stage">
        <div className="npc-era-bootleg-disc">
          <div className="npc-era-bootleg-circle" />
          <RadialTicksCanvas active={props.isPlaying} accent="#000000" dim="#222222" />
          <button type="button" className="npc-toggle npc-bootleg-trigger" onClick={props.onToggle} disabled={!props.hasAudio}>
            <span className={props.isPlaying ? "is-round" : ""} />
          </button>
        </div>
      </div>
      <div className="npc-era-2000s-footer">
        <div>
          <div className="npc-era-bootleg-label">TRACK_INFO</div>
          <div className="npc-era-bootleg-status">{props.subtitle}</div>
        </div>
        <div className="npc-era-bootleg-time">{props.currentTimeLabel}</div>
      </div>
    </div>
  );
}

function TwentyTensCard(props: EraNowPlayingDesignProps) {
  return (
    <div className="npc-era-card npc-era-2010s">
      <div className="npc-era-vhs-overlay" />
      <div className="npc-era-vhs-scanlines" />
      <div className="npc-era-vhs-noise" />
      <div className="npc-era-head">
        <div>
          <div className="npc-era-brand">Master Mix</div>
          <div className="npc-era-tag">Chromium Dioxide / Type II</div>
        </div>
        <div className="npc-era-right-meta">
          <div className="npc-era-brand">{props.year}</div>
          <div className="npc-era-tag">High Fidelity</div>
        </div>
      </div>
      <div className="npc-era-2010s-stage">
        <RadialTicksCanvas active={props.isPlaying} accent="#ffb000" dim="#7a5500" />
        <div className="npc-era-vhs-core">
          <div className={`npc-era-vhs-dot ${props.isPlaying ? "is-active" : ""}`} />
        </div>
      </div>
      <div className="npc-era-2010s-footer">
        <div className="npc-era-vhs-time">{props.currentTimeLabel} / {props.durationLabel}</div>
        <div className="npc-era-track-block">
          <div className="npc-era-tag">Input Signal</div>
          <div className="npc-era-side">{props.title}</div>
        </div>
      </div>
      <button type="button" className="npc-era-corner-toggle is-vhs" onClick={props.onToggle} disabled={!props.hasAudio}>
        {props.isPlaying ? "Pause" : props.hasAudio ? "Play" : "Demo"}
      </button>
    </div>
  );
}

function TwentyTwentiesCard(props: EraNowPlayingDesignProps) {
  return (
    <div className="npc-era-card npc-era-2020s">
      <div className="npc-era-2020s-head">{props.title}</div>
      <div className="npc-era-2020s-stage">
        <WaveCanvas active={props.isPlaying} />
      </div>
      <div className="npc-era-2020s-footer">
        <div className="npc-era-2020s-time">{props.currentTimeLabel}</div>
        <button type="button" className="npc-toggle npc-2020s-toggle" onClick={props.onToggle} disabled={!props.hasAudio}>
          {props.isPlaying ? "Pause" : props.hasAudio ? "Play" : "Demo"}
        </button>
      </div>
    </div>
  );
}

export function EraNowPlayingDesign(props: EraNowPlayingDesignProps) {
  const era = getEraKey(props.year);

  if (era === "before1980") return <Before1980Card {...props} />;
  if (era === "1980s") return <EightiesCard {...props} />;
  if (era === "1990s") return <NinetiesCard {...props} />;
  if (era === "2000s") return <TwoThousandsCard {...props} />;
  if (era === "2010s") return <TwentyTensCard {...props} />;
  return <TwentyTwentiesCard {...props} />;
}
