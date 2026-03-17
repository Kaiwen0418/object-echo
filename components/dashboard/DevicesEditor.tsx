"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { saveDevicesAction, type SaveDevicesState } from "@/app/dashboard/[projectId]/(workspace)/devices/actions";
import { createSupabaseClient } from "@/lib/supabase/client";
import type { ProjectAsset, ProjectDevice, SketchfabSearchResult } from "@/types";

type DevicesEditorProps = {
  projectId: string;
  initialDevices: ProjectDevice[];
  initialAssets: ProjectAsset[];
};

type SignedUploadPayload = {
  upload?: {
    bucket: string;
    path: string;
    token: string;
    signedUrl: string;
    publicUrl: string;
    expiresAt: string;
  };
  error?: string;
};

type DeviceDraft = {
  id: string;
  projectId: string;
  year: number;
  name: string;
  era: string;
  specs: ProjectDevice["specs"];
  modelAssetId?: string;
  musicAssetId?: string;
  sortOrder: number;
};

type SketchfabSearchPayload = {
  results?: Array<Record<string, unknown>>;
  cursors?: {
    next?: string | null;
    previous?: string | null;
  };
};

type SketchfabThumbnailImage = {
  url?: string;
  width?: number;
};

function getAssetLabel(asset?: ProjectAsset, emptyLabel?: string) {
  if (!asset) return emptyLabel ?? "Not selected";
  return asset.title?.trim() || asset.sourceUrl || asset.storageKey || asset.id;
}

function pickSketchfabThumbnail(images: SketchfabThumbnailImage[] | undefined, preferredWidth: number) {
  if (!images?.length) {
    return "";
  }

  const candidates = images.filter(
    (image): image is Required<Pick<SketchfabThumbnailImage, "url" | "width">> =>
      typeof image.url === "string" && image.url.length > 0 && typeof image.width === "number"
  );

  if (!candidates.length) {
    return "";
  }

  return [...candidates].sort((left, right) => Math.abs(left.width - preferredWidth) - Math.abs(right.width - preferredWidth))[0]
    ?.url;
}

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

function createDeviceDraft(projectId: string, sortOrder: number): DeviceDraft {
  return {
    id: `draft_${Date.now()}`,
    projectId,
    year: new Date().getFullYear(),
    name: "",
    era: "Unsorted",
    specs: [],
    sortOrder
  };
}

function mapSketchfabResult(input: {
  uid?: string;
  name?: string;
  embedUrl?: string;
  viewerUrl?: string;
  user?: { displayName?: string };
  license?: { label?: string };
  thumbnails?: { images?: SketchfabThumbnailImage[] };
}): SketchfabSearchResult | null {
  if (!input.uid || !input.name) {
    return null;
  }

  return {
    id: input.uid,
    name: input.name,
    viewerUrl: input.viewerUrl ?? `https://sketchfab.com/3d-models/${input.uid}`,
    embedUrl: input.embedUrl ?? `https://sketchfab.com/models/${input.uid}/embed`,
    thumbnailUrl: pickSketchfabThumbnail(input.thumbnails?.images, 720),
    authorName: input.user?.displayName ?? "Sketchfab Creator",
    licenseLabel: input.license?.label,
    downloadable: false
  };
}

export function DevicesEditor({ projectId, initialDevices, initialAssets }: DevicesEditorProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<SaveDevicesState, FormData>(
    saveDevicesAction.bind(null, projectId),
    {}
  );
  const [devices, setDevices] = useState(initialDevices);
  const [assets, setAssets] = useState(initialAssets);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<DeviceDraft>(() => createDeviceDraft(projectId, initialDevices.length));
  const [sketchfabQuery, setSketchfabQuery] = useState("");
  const [sketchfabResults, setSketchfabResults] = useState<SketchfabSearchResult[]>([]);
  const [sketchfabNextCursor, setSketchfabNextCursor] = useState<string | null>(null);
  const [sketchfabPreviousCursor, setSketchfabPreviousCursor] = useState<string | null>(null);
  const [sketchfabPage, setSketchfabPage] = useState(1);
  const [modalStatus, setModalStatus] = useState("");
  const [isSearchingSketchfab, setIsSearchingSketchfab] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const serializedDevices = useMemo(() => JSON.stringify(devices), [devices]);
  const serializedAssets = useMemo(() => JSON.stringify(assets), [assets]);
  const modelAssets = useMemo(
    () => assets.filter((asset) => asset.type === "model" && (asset.sourceUrl || asset.storageKey)),
    [assets]
  );
  const audioAssets = useMemo(
    () => assets.filter((asset) => asset.type === "audio" && (asset.sourceUrl || asset.storageKey)),
    [assets]
  );

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state.success]);

  const move = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= devices.length) return;

    const next = [...devices];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    setDevices(next.map((device, sortOrder) => ({ ...device, sortOrder })));
  };

  const remove = (index: number) => {
    const target = devices[index];
    if (!target) return;

    const confirmed = window.confirm(
      `Remove "${target.name || "this device"}"? This only removes the device entry. Linked media assets stay in the project until you delete them separately.`
    );
    if (!confirmed) return;

    setDevices((current) =>
      current
        .filter((_, deviceIndex) => deviceIndex !== index)
        .map((device, sortOrder) => ({ ...device, sortOrder }))
    );
  };

  const openAddModal = () => {
    setEditingIndex(null);
    setDraft(createDeviceDraft(projectId, devices.length));
    setSketchfabQuery("");
    setSketchfabResults([]);
    setSketchfabNextCursor(null);
    setSketchfabPreviousCursor(null);
    setSketchfabPage(1);
    setModalStatus("");
    setIsModalOpen(true);
  };

  const openEditModal = (index: number) => {
    const device = devices[index];
    if (!device) return;
    setEditingIndex(index);
    setDraft({ ...device });
    setSketchfabQuery(device.name);
    setSketchfabResults([]);
    setSketchfabNextCursor(null);
    setSketchfabPreviousCursor(null);
    setSketchfabPage(1);
    setModalStatus("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSketchfabResults([]);
    setSketchfabNextCursor(null);
    setSketchfabPreviousCursor(null);
    setSketchfabPage(1);
    setSketchfabQuery("");
    setModalStatus("");
  };

  const searchSketchfab = async (cursor?: string | null, nextPage = 1) => {
    const query = sketchfabQuery.trim();
    if (!query) {
      setModalStatus("Enter a search query first.");
      return;
    }

    setIsSearchingSketchfab(true);
    setModalStatus("Searching Sketchfab...");

    try {
      const params = new URLSearchParams({
        type: "models",
        q: query,
        count: "8"
      });
      if (cursor) {
        params.set("cursor", cursor);
      }

      const response = await fetch(`https://api.sketchfab.com/v3/search?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Sketchfab search failed with ${response.status}.`);
      }

      const payload = (await response.json()) as SketchfabSearchPayload;
      const results = (payload.results ?? [])
        .map((item) =>
          mapSketchfabResult(item as {
            uid?: string;
            name?: string;
            embedUrl?: string;
            viewerUrl?: string;
            user?: { displayName?: string };
            license?: { label?: string };
            thumbnails?: { images?: SketchfabThumbnailImage[] };
          })
        )
        .filter((item): item is SketchfabSearchResult => Boolean(item));

      setSketchfabResults(results);
      setSketchfabNextCursor(payload.cursors?.next ?? null);
      setSketchfabPreviousCursor(payload.cursors?.previous ?? null);
      setSketchfabPage(nextPage);
      setModalStatus(results.length ? `Page ${nextPage}. Select a model to attach it to this device.` : "No results found.");
    } catch (error) {
      setModalStatus(error instanceof Error ? error.message : "Sketchfab search failed.");
    } finally {
      setIsSearchingSketchfab(false);
    }
  };

  const attachSketchfabResult = (result: SketchfabSearchResult) => {
    const assetId = `draft_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    setAssets((current) => [
      ...current,
      {
        id: assetId,
        projectId,
        type: "model",
        sourceType: "sketchfab",
        sourceUrl: result.embedUrl,
        previewImageUrl: result.thumbnailUrl || undefined,
        title: result.name,
        author: result.authorName,
        license: result.licenseLabel
      }
    ]);
    setDraft((current) => ({
      ...current,
      modelAssetId: assetId,
      name: current.name || result.name
    }));
    setModalStatus(`Attached ${result.name}.`);
  };

  const uploadAudio = async (file: File) => {
    const supabase = createSupabaseClient();

    if (!supabase) {
      setModalStatus("Supabase is not configured in this environment.");
      return;
    }

    setIsUploadingAudio(true);
    setModalStatus("Uploading audio...");

    try {
      const response = await fetch("/api/upload/storage-sign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          projectId,
          kind: "audio",
          filename: file.name
        })
      });

      const payload = (await response.json()) as SignedUploadPayload;
      if (!response.ok || !payload.upload) {
        throw new Error(payload.error ?? "Failed to prepare audio upload.");
      }
      const upload = payload.upload;

      const { error } = await supabase.storage
        .from(upload.bucket)
        .uploadToSignedUrl(upload.path, upload.token, file);

      if (error) {
        throw error;
      }

      const assetId = `draft_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      setAssets((current) => [
        ...current,
        {
          id: assetId,
          projectId,
          type: "audio",
          sourceType: "upload",
          storageKey: upload.path,
          sourceUrl: upload.publicUrl,
          title: file.name.replace(/\.[^.]+$/, "")
        }
      ]);
      setDraft((current) => ({ ...current, musicAssetId: assetId }));
      setModalStatus(`Uploaded ${file.name}.`);
    } catch (error) {
      setModalStatus(error instanceof Error ? error.message : "Audio upload failed.");
    } finally {
      setIsUploadingAudio(false);
    }
  };

  const confirmModal = () => {
    const nameError = validateDeviceField("name", draft.name);
    const yearError = validateDeviceField("year", String(draft.year));

    if (nameError || yearError) {
      setModalStatus(nameError ?? yearError ?? "Fill in the required device fields.");
      return;
    }

    if (editingIndex == null) {
      setDevices((current) => [...current, { ...draft, sortOrder: current.length }]);
    } else {
      setDevices((current) =>
        current.map((device, index) => (index === editingIndex ? { ...device, ...draft, sortOrder: device.sortOrder } : device))
      );
    }

    closeModal();
  };

  const validateAll = () => {
    for (const device of devices) {
      const nameError = validateDeviceField("name", device.name);
      const yearError = validateDeviceField("year", String(device.year));

      if (nameError || yearError) {
        return false;
      }
    }

    return true;
  };

  const getModelLabel = (device: ProjectDevice) =>
    getAssetLabel(modelAssets.find((asset) => asset.id === device.modelAssetId), "Default museum model");

  const getAudioLabel = (device: ProjectDevice) =>
    getAssetLabel(audioAssets.find((asset) => asset.id === device.musicAssetId), "Theme soundtrack metadata");

  const getModelAsset = (device: ProjectDevice) => modelAssets.find((asset) => asset.id === device.modelAssetId);

  return (
    <>
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
        <input type="hidden" name="assetsJson" value={serializedAssets} />
        {devices.map((device, index) => (
          <section key={device.id} className="panel device-card">
            <div className="device-card-preview">
              <div className="device-preview-frame">
                <span className="device-preview-label">Preview</span>
                {getModelAsset(device)?.previewImageUrl ? (
                  <img
                    className="device-preview-image"
                    src={getModelAsset(device)?.previewImageUrl}
                    alt={`${device.name} model preview`}
                  />
                ) : (
                  <strong>暂无</strong>
                )}
              </div>
            </div>

            <div className="device-card-metadata">
              <div className="device-card-header">
                <div className="section-eyebrow">Device {index + 1}</div>
                <h2>{device.name}</h2>
              </div>
              <div className="device-card-grid">
                <div>
                  <span className="device-card-label">Year</span>
                  <span className="device-card-value">{device.year}</span>
                </div>
                <div>
                  <span className="device-card-label">Era</span>
                  <span className="device-card-value">{device.era || "Unsorted"}</span>
                </div>
                <div>
                  <span className="device-card-label">Model</span>
                  <span className="device-card-value">{getModelLabel(device)}</span>
                </div>
                <div>
                  <span className="device-card-label">Audio</span>
                  <span className="device-card-value">{getAudioLabel(device)}</span>
                </div>
              </div>
            </div>

            <div className="device-card-actions">
              <button type="button" className="ghost-button" onClick={() => openEditModal(index)}>
                Edit
              </button>
              <div className="device-row-order">
                <button type="button" className="ghost-button" onClick={() => move(index, -1)} disabled={index === 0}>
                  ↑
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => move(index, 1)}
                  disabled={index === devices.length - 1}
                >
                  ↓
                </button>
              </div>
              <button type="button" className="ghost-button ghost-button-danger" onClick={() => remove(index)}>
                [!] Remove
              </button>
              <p className="field-help">Removing a device keeps linked media in the project.</p>
            </div>
          </section>
        ))}
        <div className="collection-actions">
          <button type="button" className="ghost-button" onClick={openAddModal}>
            Add Device
          </button>
          <div className="collection-actions-save">
            <span className="inline-note">Devices and linked media save together.</span>
            <button type="submit" className="primary-button form-submit-button" disabled={isPending}>
              {isPending ? "Saving..." : "Save Collection"}
            </button>
          </div>
        </div>
        {state.error ? <div className="panel auth-alert">{state.error}</div> : null}
        {state.success ? <p className="field-success">{state.success}</p> : null}
      </form>

      {isModalOpen ? (
        <div className="profile-modal" role="dialog" aria-modal="true" aria-labelledby="device-modal-title">
          <div className="profile-modal-backdrop" onClick={closeModal} aria-hidden="true" />
          <div className="panel profile-modal-surface device-modal-surface">
            <div className="profile-modal-header">
              <div>
                <div className="section-eyebrow">{editingIndex == null ? "New device" : "Device media"}</div>
                <h2 id="device-modal-title">{editingIndex == null ? "Add device" : "Edit device media"}</h2>
              </div>
              <button type="button" className="ghost-button" onClick={closeModal}>
                Close
              </button>
            </div>

            <div className="form-grid compact">
              <div>
                <label htmlFor="device-modal-name">Name</label>
                <input
                  id="device-modal-name"
                  value={draft.name}
                  onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="device-modal-year">Year</label>
                <input
                  id="device-modal-year"
                  type="number"
                  value={draft.year}
                  onChange={(event) => setDraft((current) => ({ ...current, year: Number(event.target.value) }))}
                />
              </div>
              <div>
                <label htmlFor="device-modal-era">Era</label>
                <input
                  id="device-modal-era"
                  value={draft.era}
                  onChange={(event) => setDraft((current) => ({ ...current, era: event.target.value }))}
                />
              </div>
            </div>

            <section className="asset-source-tools">
              <div className="section-eyebrow">Model source</div>
              <div className="inline-actions">
                <input
                  value={sketchfabQuery}
                  placeholder="Search Sketchfab models"
                  onChange={(event) => {
                    setSketchfabQuery(event.target.value);
                    setSketchfabNextCursor(null);
                    setSketchfabPreviousCursor(null);
                    setSketchfabPage(1);
                  }}
                />
                <button type="button" className="ghost-button" disabled={isSearchingSketchfab} onClick={() => void searchSketchfab(null, 1)}>
                  {isSearchingSketchfab ? "Searching..." : "Search Sketchfab"}
                </button>
              </div>
              {sketchfabResults.length ? (
                <div className="inline-actions sketchfab-pagination">
                  <span className="inline-note">Page {sketchfabPage}</span>
                  <button
                    type="button"
                    className="ghost-button"
                    disabled={isSearchingSketchfab || !sketchfabPreviousCursor}
                    onClick={() => void searchSketchfab(sketchfabPreviousCursor, Math.max(1, sketchfabPage - 1))}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="ghost-button"
                    disabled={isSearchingSketchfab || !sketchfabNextCursor}
                    onClick={() => void searchSketchfab(sketchfabNextCursor, sketchfabPage + 1)}
                  >
                    Next
                  </button>
                </div>
              ) : null}
              {sketchfabResults.map((result) => (
                <div key={result.id} className="asset-source-result">
                  <div className="asset-source-result-copy">
                    {result.thumbnailUrl ? (
                      <img className="asset-source-thumb" src={result.thumbnailUrl} alt={`${result.name} thumbnail`} />
                    ) : null}
                    <div>
                      <strong>{result.name}</strong>
                      <p className="field-help">
                        {result.authorName} · {result.licenseLabel ?? "License TBD"}
                      </p>
                    </div>
                  </div>
                  <button type="button" className="ghost-button" onClick={() => attachSketchfabResult(result)}>
                    Select
                  </button>
                </div>
              ))}
              <div className="device-selection-feedback">
                <span className="device-card-label">Selected model</span>
                <strong>{getAssetLabel(modelAssets.find((asset) => asset.id === draft.modelAssetId), "Default museum model")}</strong>
              </div>
            </section>

            <section className="asset-source-tools">
              <div className="section-eyebrow">Audio source</div>
              <div className="inline-actions">
                <label className="ghost-button">
                  <input
                    type="file"
                    accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg"
                    hidden
                    disabled={isUploadingAudio}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        void uploadAudio(file);
                      }
                      event.currentTarget.value = "";
                    }}
                  />
                  {isUploadingAudio ? "Uploading..." : "Upload Audio"}
                </label>
              </div>
              <div className="device-selection-feedback">
                <span className="device-card-label">Selected audio</span>
                <strong>{getAssetLabel(audioAssets.find((asset) => asset.id === draft.musicAssetId), "Theme soundtrack metadata")}</strong>
              </div>
            </section>

            {modalStatus ? <p className="field-help">{modalStatus}</p> : null}

            <div className="inline-actions">
              <button type="button" className="primary-button" onClick={confirmModal}>
                {editingIndex == null ? "Add Device" : "Apply Changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
