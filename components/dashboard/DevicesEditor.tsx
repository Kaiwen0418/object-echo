"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { saveDevicesAction, type SaveDevicesState } from "@/app/dashboard/[projectId]/(workspace)/devices/actions";
import type { ProjectAsset, ProjectDevice } from "@/types";

type DevicesEditorProps = {
  projectId: string;
  initialDevices: ProjectDevice[];
  initialAssets: ProjectAsset[];
};

type DeviceFieldErrors = Record<
  string,
  {
    name?: string;
    year?: string;
  }
>;

function validateDeviceField(key: "name" | "year", value: string) {
  if (key === "name") {
    return value.trim() ? undefined : "Device name is required.";
  }

  const numericYear = Number(value);
  const currentYear = new Date().getFullYear() + 1;

  if (!value.trim()) {
    return "Year is required.";
  }

  if (!Number.isInteger(numericYear) || numericYear < 1900 || numericYear > currentYear) {
    return `Use a year between 1900 and ${currentYear}.`;
  }

  return undefined;
}

export function DevicesEditor({ projectId, initialDevices, initialAssets }: DevicesEditorProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<SaveDevicesState, FormData>(
    saveDevicesAction.bind(null, projectId),
    {}
  );
  const [devices, setDevices] = useState(initialDevices);
  const [errors, setErrors] = useState<DeviceFieldErrors>({});
  const serializedDevices = useMemo(() => JSON.stringify(devices), [devices]);
  const modelAssets = useMemo(
    () => initialAssets.filter((asset) => asset.type === "model" && (asset.sourceUrl || asset.storageKey)),
    [initialAssets]
  );
  const audioAssets = useMemo(
    () => initialAssets.filter((asset) => asset.type === "audio" && (asset.sourceUrl || asset.storageKey)),
    [initialAssets]
  );

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state.success]);

  const updateDevice = (index: number, key: "name" | "year" | "modelAssetId" | "musicAssetId", value: string) => {
    setDevices((current) =>
      current.map((device, deviceIndex) =>
        deviceIndex === index
          ? {
              ...device,
              [key]:
                key === "year"
                  ? Number(value)
                  : key === "modelAssetId"
                    ? value || undefined
                    : value
            }
          : device
      )
    );

    const deviceId = devices[index]?.id;
    if (!deviceId) return;

    if (key === "modelAssetId" || key === "musicAssetId") {
      return;
    }

    const error = validateDeviceField(key, value);
    setErrors((current) => ({
      ...current,
      [deviceId]: {
        ...current[deviceId],
        [key]: error
      }
    }));
  };

  const validateOnBlur = (deviceId: string, key: "name" | "year", value: string) => {
    const error = validateDeviceField(key, value);
    setErrors((current) => ({
      ...current,
      [deviceId]: {
        ...current[deviceId],
        [key]: error
      }
    }));
  };

  const move = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= devices.length) return;

    const next = [...devices];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    setDevices(next.map((device, sortOrder) => ({ ...device, sortOrder })));
  };

  const remove = (index: number) => {
    const targetId = devices[index]?.id;
    setDevices((current) => current.filter((_, deviceIndex) => deviceIndex !== index).map((device, sortOrder) => ({ ...device, sortOrder })));
    if (targetId) {
      setErrors((current) => {
        const next = { ...current };
        delete next[targetId];
        return next;
      });
    }
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

  const validateAll = () => {
    const nextErrors: DeviceFieldErrors = {};

    for (const device of devices) {
      const nameError = validateDeviceField("name", device.name);
      const yearError = validateDeviceField("year", String(device.year));

      if (nameError || yearError) {
        nextErrors[device.id] = {
          name: nameError,
          year: yearError
        };
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  return (
    <form
      className="stack"
      action={formAction}
      noValidate
      onSubmit={(event) => {
        if (!validateAll()) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="devicesJson" value={serializedDevices} />
      {devices.map((device, index) => (
        <section key={device.id} className="panel form-grid compact">
          <div>
            <label htmlFor={`device-name-${device.id}`}>Name</label>
            <input
              id={`device-name-${device.id}`}
              value={device.name}
              aria-invalid={Boolean(errors[device.id]?.name)}
              aria-describedby={errors[device.id]?.name ? `device-name-error-${device.id}` : undefined}
              onChange={(event) => updateDevice(index, "name", event.target.value)}
              onBlur={(event) => validateOnBlur(device.id, "name", event.target.value)}
            />
            {errors[device.id]?.name ? (
              <p id={`device-name-error-${device.id}`} className="field-error">
                {errors[device.id]?.name}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor={`device-year-${device.id}`}>Year</label>
            <input
              id={`device-year-${device.id}`}
              type="number"
              value={device.year}
              aria-invalid={Boolean(errors[device.id]?.year)}
              aria-describedby={errors[device.id]?.year ? `device-year-error-${device.id}` : `device-year-help-${device.id}`}
              onChange={(event) => updateDevice(index, "year", event.target.value)}
              onBlur={(event) => validateOnBlur(device.id, "year", event.target.value)}
            />
            <p id={`device-year-help-${device.id}`} className="field-help">
              Use the device release year.
            </p>
            {errors[device.id]?.year ? (
              <p id={`device-year-error-${device.id}`} className="field-error">
                {errors[device.id]?.year}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor={`device-model-${device.id}`}>Model Asset</label>
            <select
              id={`device-model-${device.id}`}
              value={device.modelAssetId ?? ""}
              onChange={(event) => updateDevice(index, "modelAssetId", event.target.value)}
            >
              <option value="">Use default museum model</option>
              {modelAssets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.title?.trim() || asset.storageKey || asset.sourceUrl || asset.id}
                </option>
              ))}
            </select>
            <p className="field-help">
              Select one of this project&apos;s uploaded model assets to override the default device model.
            </p>
          </div>
          <div>
            <label htmlFor={`device-music-${device.id}`}>Audio Asset</label>
            <select
              id={`device-music-${device.id}`}
              value={device.musicAssetId ?? ""}
              onChange={(event) => updateDevice(index, "musicAssetId", event.target.value)}
            >
              <option value="">Use theme soundtrack metadata</option>
              {audioAssets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.title?.trim() || asset.storageKey || asset.sourceUrl || asset.id}
                </option>
              ))}
            </select>
            <p className="field-help">
              Select an audio asset to drive the soundtrack card and inline playback for this device.
            </p>
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
        <button type="submit" className="primary-button form-submit-button" disabled={isPending}>
          {isPending ? "Saving..." : "Save Changes"}
        </button>
        <span className="inline-note">Device ordering and edits now save to Supabase.</span>
      </div>
      {state.error ? <div className="panel auth-alert">{state.error}</div> : null}
      {state.success ? <p className="field-success">{state.success}</p> : null}
    </form>
  );
}
