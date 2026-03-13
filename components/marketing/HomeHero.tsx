import { ScrambleText } from "@/components/ui/ScrambleText";
import { HomeHeroScene } from "@/components/marketing/HomeHeroScene";

type HomeHeroProps = {
  opacity: number;
  isActive: boolean;
  onEnter: () => void;
};

export function HomeHero({ opacity, isActive, onEnter }: HomeHeroProps) {
  return (
    <section className="home-hero" style={{ opacity }}>
      <HomeHeroScene />
      <div className="home-hero-vignette" aria-hidden="true" />
      <div className="home-hero-ui" aria-hidden="true">
        <span className="frame-mark frame-mark-tl" />
        <span className="frame-mark frame-mark-tr" />
        <span className="frame-mark frame-mark-bl" />
        <span className="frame-mark frame-mark-br" />
        <div className="home-hero-gridline" />
        <div className="home-hero-telemetry telemetry-left">AZIMUTH: 114.2 // ELEV: -4.8</div>
        <div className="home-hero-telemetry telemetry-right">SYS.STATE: ARCHIVAL_MODE_ACTIVE</div>
      </div>

      <div className="home-hero-main">
        <div className="home-hero-copy">
          <div className="home-hero-rec">REC. / [00:00:00]</div>
          <h1 className="shell-title home-hero-title">
            <ScrambleText active={isActive} text="Build a personal collection that feels lit, staged, and remembered." />
          </h1>
          <p className="shell-copy home-hero-description">
            Object Echo turns personal devices and media into a cinematic museum timeline. Start with a collection,
            publish a scene, and let the archive unfold as people scroll.
          </p>
          <div className="home-hero-actions">
            <button type="button" className="hero-primary-button" onClick={onEnter}>
              Enter Demo
            </button>
            <div className="home-hero-metadata">
              <span>FORMAT: HERO LANDING INTERFACE</span>
              <span>MODE: LIGHT / DARK</span>
            </div>
          </div>
        </div>
      </div>

      <div className="home-hero-footer">
        <span>CURATION TARGET: PERSONAL DEVICE MUSEUM</span>
        <button type="button" className="hero-enter" onClick={onEnter}>
          <span className="hero-enter-label">Scroll to Enter Timeline</span>
          <span className="hero-enter-arrow" aria-hidden="true">
            ↓
          </span>
        </button>
        <span>MEM. BUFFER: 99%</span>
      </div>
    </section>
  );
}
