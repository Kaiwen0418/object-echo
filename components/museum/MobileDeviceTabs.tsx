import type { ProjectDevice } from "@/types";

type MobileDeviceTabsProps = {
  devices: ProjectDevice[];
  centeredIndex: number;
  onJump: (index: number) => void;
};

export function MobileDeviceTabs({ devices, centeredIndex, onJump }: MobileDeviceTabsProps) {
  return (
    <nav className="museum-mobile-tabs" aria-label="Device timeline">
      {devices.map((device, index) => (
        <button
          key={device.id}
          type="button"
          className={`museum-mobile-tab ${index === centeredIndex ? "is-active" : ""}`}
          onClick={() => onJump(index)}
          aria-current={index === centeredIndex}
        >
          <span className="museum-mobile-tab-year">{device.year}</span>
          <span className="museum-mobile-tab-name">{device.name}</span>
        </button>
      ))}
    </nav>
  );
}
