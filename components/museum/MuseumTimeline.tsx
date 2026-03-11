import { TIMELINE_DETAIL_TICKS } from "@/features/museum/lib/config";
import type { ProjectDevice } from "@/types";

type MuseumTimelineProps = {
  devices: ProjectDevice[];
  centeredIndex: number;
  displayedProgress: number;
  onJump: (index: number) => void;
};

export function MuseumTimeline({
  devices,
  centeredIndex,
  displayedProgress,
  onJump
}: MuseumTimelineProps) {
  const timelineSpacing = 86;

  return (
    <section className="timeline-rail-wrap" aria-label="Device timeline">
      <span className="timeline-axis" />
      <span className="timeline-focus" />
      {TIMELINE_DETAIL_TICKS.map((tick, index) => (
        <span
          key={`detail-${index}`}
          className="timeline-detail-tick"
          style={{ top: `calc(50% + ${tick * timelineSpacing}px)` }}
          aria-hidden="true"
        />
      ))}
      {devices.map((item, index) => {
        const offset = index - displayedProgress;
        const distance = Math.min(Math.abs(offset), 2.4);
        const opacity = Math.max(0.18, 1 - distance * 0.34);
        const scale = Math.max(0.72, 1 - distance * 0.12);
        const rotate = offset * -18;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onJump(index)}
            className={`timeline-tick ${index === centeredIndex ? "active" : ""}`}
            style={{
              top: "50%",
              transform: `translateY(${offset * timelineSpacing}px) rotateX(${rotate}deg) scale(${scale})`,
              opacity
            }}
            aria-current={index === centeredIndex}
          >
            <span className="tick-year">{item.year}</span>
            <span className="tick-mark" />
          </button>
        );
      })}
    </section>
  );
}
