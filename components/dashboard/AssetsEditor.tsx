"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { saveAssetsAction, type SaveAssetsState } from "@/app/dashboard/[projectId]/(workspace)/assets/actions";
import { createSupabaseClient } from "@/lib/supabase/client";
import type { ProjectAsset, SketchfabSearchResult } from "@/types";

type AssetsEditorProps = {
  projectId: string;
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

type AssetFieldErrors = Record<
  string,
  {
    type?: string;
    sourceType?: string;
    source?: string;
  }
>;

function validateAssetField(
  key: "type" | "sourceType" | "source",
  value: string
): string | undefined {
  if (key === "type" && value !== "model" && value !== "audio" && value !== "image") {
    return "Select an asset type.";
  }

  if (key === "sourceType" && value !== "upload" && value !== "sketchfab" && value !== "external") {
    return "Select a source type.";
  }

  if (key === "source" && !value.trim()) {
    return "Source URL or storage key is required.";
  }

  return undefined;
}

export function AssetsEditor({ projectId, initialAssets }: AssetsEditorProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<SaveAssetsState, FormData>(saveAssetsAction.bind(null, projectId), {});
  const [assets, setAssets] = useState(initialAssets);
  const [errors, setErrors] = useState<AssetFieldErrors>({});
  const [sketchfabQueries, setSketchfabQueries] = useState<Record<string, string>>({});
  const [sketchfabResults, setSketchfabResults] = useState<Record<string, SketchfabSearchResult[]>>({});
  const [toolStatus, setToolStatus] = useState<Record<string, string>>({});
  const [loadingTool, setLoadingTool] = useState<Record<string, "sketchfab" | "upload" | undefined>>({});
  const serializedAssets = useMemo(() => JSON.stringify(assets), [assets]);

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state.success]);

  const updateAsset = (
    index: number,
    key: "title" | "type" | "sourceType" | "sourceUrl" | "storageKey",
    value: string
  ) => {
    setAssets((current) =>
      current.map((asset, assetIndex) =>
        assetIndex === index
          ? {
              ...asset,
              [key]: value
            }
          : asset
      )
    );

    const assetId = assets[index]?.id;
    if (!assetId) return;

    const errorKey = key === "sourceUrl" || key === "storageKey" ? "source" : key;
    if (errorKey === "title") return;

    const nextError = validateAssetField(errorKey, value);
    setErrors((current) => ({
      ...current,
      [assetId]: {
        ...current[assetId],
        [errorKey]: nextError
      }
    }));
  };

  const validateOnBlur = (assetId: string, key: "type" | "sourceType" | "source", value: string) => {
    const nextError = validateAssetField(key, value);
    setErrors((current) => ({
      ...current,
      [assetId]: {
        ...current[assetId],
        [key]: nextError
      }
    }));
  };

  const validateAll = () => {
    const nextErrors: AssetFieldErrors = {};

    for (const asset of assets) {
      const typeError = validateAssetField("type", asset.type);
      const sourceTypeError = validateAssetField("sourceType", asset.sourceType);
      const sourceError = validateAssetField("source", asset.sourceUrl ?? asset.storageKey ?? "");

      if (typeError || sourceTypeError || sourceError) {
        nextErrors[asset.id] = {
          type: typeError,
          sourceType: sourceTypeError,
          source: sourceError
        };
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const add = () => {
    setAssets((current) => [
      ...current,
      {
        id: `draft_${Date.now()}`,
        projectId,
        type: "image",
        sourceType: "external",
        sourceUrl: "",
        storageKey: "",
        title: "",
        author: "",
        license: "",
        attribution: ""
      }
    ]);
  };

  const remove = (index: number) => {
    const targetId = assets[index]?.id;
    setAssets((current) => current.filter((_, assetIndex) => assetIndex !== index));
    if (targetId) {
      setErrors((current) => {
        const next = { ...current };
        delete next[targetId];
        return next;
      });
    }
  };

  const searchSketchfab = async (assetId: string) => {
    const query = sketchfabQueries[assetId]?.trim();
    if (!query) {
      setToolStatus((current) => ({ ...current, [assetId]: "Enter a search query first." }));
      return;
    }

    setLoadingTool((current) => ({ ...current, [assetId]: "sketchfab" }));
    setToolStatus((current) => ({ ...current, [assetId]: "Searching Sketchfab mock results..." }));

    const response = await fetch(`/api/devices/search-models?query=${encodeURIComponent(query)}`);
    const payload = (await response.json()) as { results?: SketchfabSearchResult[] };

    setSketchfabResults((current) => ({ ...current, [assetId]: payload.results ?? [] }));
    setToolStatus((current) => ({
      ...current,
      [assetId]: payload.results?.length ? "Select a result to attach it as the model source." : "No mock results returned."
    }));
    setLoadingTool((current) => ({ ...current, [assetId]: undefined }));
  };

  const applySketchfabResult = (index: number, result: SketchfabSearchResult) => {
    setAssets((current) =>
      current.map((asset, assetIndex) =>
        assetIndex === index
          ? {
              ...asset,
              title: asset.title || result.name,
              sourceType: "sketchfab",
              sourceUrl: result.viewerUrl
            }
          : asset
      )
    );

    const assetId = assets[index]?.id;
    if (assetId) {
      setToolStatus((current) => ({
        ...current,
        [assetId]: "Sketchfab result attached. TODO: replace with real download/import flow."
      }));
      setErrors((current) => ({
        ...current,
        [assetId]: {
          ...current[assetId],
          source: undefined
        }
      }));
    }
  };

  const uploadFile = async (index: number, file: File) => {
    const asset = assets[index];
    if (!asset) return;
    const supabase = createSupabaseClient();

    if (!supabase) {
      setToolStatus((current) => ({
        ...current,
        [asset.id]: "Supabase is not configured in this environment."
      }));
      return;
    }

    setLoadingTool((current) => ({ ...current, [asset.id]: "upload" }));
    setToolStatus((current) => ({ ...current, [asset.id]: "Uploading file..." }));

    try {
      const response = await fetch("/api/upload/storage-sign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          projectId,
          kind: asset.type === "audio" ? "audio" : asset.type === "image" ? "images" : "models",
          filename: file.name
        })
      });

      const payload = (await response.json()) as SignedUploadPayload;

      if (!response.ok || !payload.upload) {
        throw new Error(payload.error ?? "Failed to prepare upload.");
      }

      const { error: uploadError } = await supabase.storage
        .from(payload.upload.bucket)
        .uploadToSignedUrl(payload.upload.path, payload.upload.token, file);

      if (uploadError) {
        throw uploadError;
      }

      setAssets((current) =>
        current.map((currentAsset, assetIndex) =>
          assetIndex === index
            ? {
                ...currentAsset,
                storageKey: payload.upload?.path,
                sourceUrl: payload.upload?.publicUrl,
                sourceType: "upload",
                title: currentAsset.title || file.name.replace(/\.[^.]+$/, "")
              }
            : currentAsset
        )
      );
      setErrors((current) => ({
        ...current,
        [asset.id]: {
          ...current[asset.id],
          source: undefined
        }
      }));
      setToolStatus((current) => ({
        ...current,
        [asset.id]: `Uploaded ${file.name}.`
      }));
    } catch (error) {
      setToolStatus((current) => ({
        ...current,
        [asset.id]: error instanceof Error ? error.message : "Upload failed."
      }));
    } finally {
      setLoadingTool((current) => ({ ...current, [asset.id]: undefined }));
    }
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
      <input type="hidden" name="assetsJson" value={serializedAssets} />
      {assets.map((asset, index) => (
        <section key={asset.id} className="panel form-grid compact">
          <div>
            <label htmlFor={`asset-title-${asset.id}`}>Title</label>
            <input
              id={`asset-title-${asset.id}`}
              value={asset.title ?? ""}
              onChange={(event) => updateAsset(index, "title", event.target.value)}
            />
          </div>
          <div>
            <label htmlFor={`asset-type-${asset.id}`}>Type</label>
            <select
              id={`asset-type-${asset.id}`}
              value={asset.type}
              aria-invalid={Boolean(errors[asset.id]?.type)}
              aria-describedby={errors[asset.id]?.type ? `asset-type-error-${asset.id}` : undefined}
              onChange={(event) => updateAsset(index, "type", event.target.value)}
              onBlur={(event) => validateOnBlur(asset.id, "type", event.target.value)}
            >
              <option value="model">Model</option>
              <option value="audio">Audio</option>
              <option value="image">Image</option>
            </select>
            {errors[asset.id]?.type ? (
              <p id={`asset-type-error-${asset.id}`} className="field-error">
                {errors[asset.id]?.type}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor={`asset-source-type-${asset.id}`}>Source Type</label>
            <select
              id={`asset-source-type-${asset.id}`}
              value={asset.sourceType}
              aria-invalid={Boolean(errors[asset.id]?.sourceType)}
              aria-describedby={errors[asset.id]?.sourceType ? `asset-source-type-error-${asset.id}` : undefined}
              onChange={(event) => updateAsset(index, "sourceType", event.target.value)}
              onBlur={(event) => validateOnBlur(asset.id, "sourceType", event.target.value)}
            >
              <option value="external">External</option>
              <option value="upload">Upload</option>
              <option value="sketchfab">Sketchfab</option>
            </select>
            {errors[asset.id]?.sourceType ? (
              <p id={`asset-source-type-error-${asset.id}`} className="field-error">
                {errors[asset.id]?.sourceType}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor={`asset-source-url-${asset.id}`}>Source URL</label>
            <input
              id={`asset-source-url-${asset.id}`}
              value={asset.sourceUrl ?? ""}
              aria-invalid={Boolean(errors[asset.id]?.source)}
              aria-describedby={errors[asset.id]?.source ? `asset-source-error-${asset.id}` : `asset-source-help-${asset.id}`}
              onChange={(event) => updateAsset(index, "sourceUrl", event.target.value)}
              onBlur={(event) => validateOnBlur(asset.id, "source", event.target.value)}
            />
            <p id={`asset-source-help-${asset.id}`} className="field-help">
              Use a public URL for now. Supabase Storage upload wiring can replace this later.
            </p>
            {errors[asset.id]?.source ? (
              <p id={`asset-source-error-${asset.id}`} className="field-error">
                {errors[asset.id]?.source}
              </p>
            ) : null}
          </div>
          {asset.type === "model" ? (
            <div className="asset-source-tools">
              <div className="section-eyebrow">Model source interface</div>
              {asset.sourceType === "sketchfab" ? (
                <>
                  <div className="inline-actions">
                    <input
                      value={sketchfabQueries[asset.id] ?? ""}
                      placeholder="Search Sketchfab models"
                      onChange={(event) =>
                        setSketchfabQueries((current) => ({
                          ...current,
                          [asset.id]: event.target.value
                        }))
                      }
                    />
                    <button
                      type="button"
                      className="ghost-button"
                      disabled={loadingTool[asset.id] === "sketchfab"}
                      onClick={() => void searchSketchfab(asset.id)}
                    >
                      {loadingTool[asset.id] === "sketchfab" ? "Searching..." : "Search Sketchfab"}
                    </button>
                  </div>
                  {(sketchfabResults[asset.id] ?? []).map((result) => (
                    <div key={result.id} className="asset-source-result">
                      <div>
                        <strong>{result.name}</strong>
                        <p className="field-help">
                          {result.authorName} · {result.licenseLabel ?? "License TBD"}
                        </p>
                      </div>
                      <button type="button" className="ghost-button" onClick={() => applySketchfabResult(index, result)}>
                        Use Result
                      </button>
                    </div>
                  ))}
                </>
              ) : null}
              {asset.sourceType === "upload" ? (
                <div className="inline-actions">
                  <label className="ghost-button">
                    <input
                      type="file"
                      accept=".glb"
                      hidden
                      disabled={loadingTool[asset.id] === "upload"}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          void uploadFile(index, file);
                        }
                        event.currentTarget.value = "";
                      }}
                    />
                    {loadingTool[asset.id] === "upload" ? "Uploading..." : "Choose File"}
                  </label>
                  <span className="field-help">Uploads currently support `.glb` directly. `.gltf` remains allowed only as an external URL.</span>
                </div>
              ) : null}
              {toolStatus[asset.id] ? <p className="field-help">{toolStatus[asset.id]}</p> : null}
            </div>
          ) : null}
          <div className="inline-actions">
            <button type="button" className="ghost-button" onClick={() => remove(index)}>
              Remove
            </button>
          </div>
        </section>
      ))}
      <div className="inline-actions">
        <button type="button" className="primary-button" onClick={add}>
          Add Asset
        </button>
        <button type="submit" className="ghost-button" disabled={isPending}>
          {isPending ? "Saving..." : "Save Changes"}
        </button>
        <span className="inline-note">Asset metadata now saves to Supabase.</span>
      </div>
      {state.error ? <div className="panel auth-alert">{state.error}</div> : null}
      {state.success ? <p className="field-success">{state.success}</p> : null}
    </form>
  );
}
