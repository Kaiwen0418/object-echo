import type { ProjectDevice, ThemeConfig } from "@/types";

type NowPlayingCardProps = {
  device: ProjectDevice;
  theme: ThemeConfig;
  museumOpacity: number;
  motionY: number;
  glow: number;
  cardKey: number;
};

export function NowPlayingCard({
  device,
  theme,
  museumOpacity,
  motionY,
  glow,
  cardKey
}: NowPlayingCardProps) {
  return (
    <section
      className="player-right card-xl player-layer"
      key={`player-${cardKey}`}
      style={{
        transform: `translateY(calc(-50% + ${motionY}px))`,
        opacity: glow * museumOpacity,
        pointerEvents: museumOpacity > 0.4 ? "auto" : "none"
      }}
    >
      <div className="small-caption">NOW PLAYING</div>
      <div className="player-wrap">
        {/* TODO: Replace demo artwork/music metadata with project-linked assets. */}
        <img className="cover-lg" src={theme.soundtrackCoverUrl} alt={`${device.name} era artwork`} />
        <div>
          <div className="track-title">{theme.soundtrackTitle}</div>
          <div className="track-sub">
            {device.name} {theme.soundtrackSubtitle}
          </div>
          <div className="bar">
            <div className="bar-fill" />
          </div>
          <div className="times">
            <span>01:26</span>
            <span>03:58</span>
          </div>
        </div>
      </div>
    </section>
  );
}
