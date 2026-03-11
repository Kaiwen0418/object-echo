"use client";

import { useState } from "react";
import type { ProjectDevice } from "@/types";

type DevicesEditorProps = {
  initialDevices: ProjectDevice[];
};

export function DevicesEditor({ initialDevices }: DevicesEditorProps) {
  const [devices, setDevices] = useState(initialDevices);

  const updateDevice = (index: number, key: "name" | "year", value: string) => {
    setDevices((current) =>
      current.map((device, deviceIndex) =>
        deviceIndex === index
          ? {
              ...device,
              [key]: key === "year" ? Number(value) : value
            }
          : device
      )
    );
  };

  const move = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= devices.length) return;

    const next = [...devices];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    setDevices(next.map((device, sortOrder) => ({ ...device, sortOrder })));
  };

  const remove = (index: number) => {
    setDevices((current) => current.filter((_, deviceIndex) => deviceIndex !== index).map((device, sortOrder) => ({ ...device, sortOrder })));
  };

  const add = () => {
    setDevices((current) => [
      ...current,
      {
        id: `draft_${Date.now()}`,
        projectId: current[0]?.projectId ?? "project_demo_001",
        year: new Date().getFullYear(),
        name: "NEW DEVICE",
        era: "Unsorted",
        specs: [],
        sortOrder: current.length
      }
    ]);
  };

  return (
    <div className="stack">
      {devices.map((device, index) => (
        <section key={device.id} className="panel form-grid compact">
          <div>
            <label htmlFor={`device-name-${device.id}`}>Name</label>
            <input
              id={`device-name-${device.id}`}
              value={device.name}
              onChange={(event) => updateDevice(index, "name", event.target.value)}
            />
          </div>
          <div>
            <label htmlFor={`device-year-${device.id}`}>Year</label>
            <input
              id={`device-year-${device.id}`}
              type="number"
              value={device.year}
              onChange={(event) => updateDevice(index, "year", event.target.value)}
            />
          </div>
          <div className="inline-actions">
            <button type="button" className="ghost-button" onClick={() => move(index, -1)}>
              Move Up
            </button>
            <button type="button" className="ghost-button" onClick={() => move(index, 1)}>
              Move Down
            </button>
            <button type="button" className="ghost-button" onClick={() => remove(index)}>
              Remove
            </button>
          </div>
        </section>
      ))}
      <div className="inline-actions">
        <button type="button" className="primary-button" onClick={add}>
          Add Device
        </button>
        <span className="inline-note">TODO: save device ordering and edits to the backend.</span>
      </div>
    </div>
  );
}
