type MuseumHeroProps = {
  opacity: number;
  title: string;
  description: string;
  onEnter: () => void;
};

export function MuseumHero({ opacity, title, description, onEnter }: MuseumHeroProps) {
  return (
    <section className="hero-page" style={{ opacity }}>
      <div className="hero-inner">
        <div className="hero-meta">
          <span className="hero-kicker">Personal Device Museum</span>
          <span className="hero-stamp">BBS ONLINE</span>
        </div>
        <div className="hero-frame">
          <div className="hero-ornament" aria-hidden="true" />
          <p className="hero-yearline">SYSOP LOG / 2008-2025 / DEVICE ARCHIVE</p>
          <h1 className="hero-title">{title}</h1>
          <p className="hero-copy">{description}</p>
          <div className="hero-notes">
            <span className="hero-note">[PHONE]</span>
            <span className="hero-note">[AUDIO]</span>
            <span className="hero-note">[WATCH]</span>
            <span className="hero-note">[COMPUTER]</span>
          </div>
          <div className="hero-console" aria-hidden="true">
            <span>&gt; guest login accepted</span>
            <span>&gt; archive nodes: 07</span>
            <span>&gt; scroll to enter timeline</span>
          </div>
          <button type="button" className="hero-cta" onClick={onEnter}>
            ENTER TIMELINE
          </button>
        </div>
      </div>
    </section>
  );
}
