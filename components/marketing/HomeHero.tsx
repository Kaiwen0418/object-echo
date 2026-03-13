import { ScrambleText } from "@/components/ui/ScrambleText";

type HomeHeroProps = {
  opacity: number;
  isActive: boolean;
  onEnter: () => void;
};

export function HomeHero({ opacity, isActive, onEnter }: HomeHeroProps) {
  return (
    <section className="home-hero" style={{ opacity }}>
      <div className="home-hero-copy">
        <div className="section-eyebrow">Personal museum builder</div>
        <h1 className="shell-title">
          <ScrambleText active={isActive} text="Build a collection page that feels lit, staged, and remembered." />
        </h1>
        <p className="shell-copy">
          Object Echo turns personal devices and media into a cinematic museum timeline. Start with a collection,
          publish a scene, and let the archive unfold as people scroll.
        </p>
      </div>
      <button type="button" className="hero-enter" onClick={onEnter}>
        <span className="hero-enter-label">Enter Demo</span>
        <span className="hero-enter-arrow" aria-hidden="true">
          ↓
        </span>
      </button>
      <div className="home-hero-atmosphere" aria-hidden="true">
        <div className="home-glow home-glow-a" />
        <div className="home-glow home-glow-b" />
        <div className="home-grid-lines" />
      </div>
    </section>
  );
}
