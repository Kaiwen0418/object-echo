"use client";

import Image from "next/image";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveProfileAction, type SaveProfileState } from "@/app/dashboard/(workspace)/profile/actions";
import { createSupabaseClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/types";

type ProfileSettingsFormProps = {
  profile: UserProfile;
  onSaved?: () => void;
  onCancel?: () => void;
};

const initialState: SaveProfileState = {};

export function ProfileSettingsForm({ profile, onSaved, onCancel }: ProfileSettingsFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(saveProfileAction, initialState);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? "");
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (state.success) {
      router.refresh();
      onSaved?.();
    }
  }, [onSaved, router, state.success]);

  const uploadAvatar = async (file: File) => {
    const supabase = createSupabaseClient();
    if (!supabase) {
      setUploadStatus("Supabase auth is not configured.");
      return;
    }

    setIsUploading(true);
    setUploadStatus("Uploading avatar...");

    try {
      const response = await fetch("/api/upload/profile-avatar-sign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          filename: file.name
        })
      });

      const payload = (await response.json()) as {
        upload?: {
          bucket: string;
          path: string;
          token: string;
          publicUrl: string;
        };
        error?: string;
      };

      if (!response.ok || !payload.upload) {
        throw new Error(payload.error ?? "Failed to prepare avatar upload.");
      }

      const { error } = await supabase.storage
        .from(payload.upload.bucket)
        .uploadToSignedUrl(payload.upload.path, payload.upload.token, file);

      if (error) {
        throw error;
      }

      setAvatarUrl(payload.upload.publicUrl);
      setUploadStatus("Avatar uploaded. Save profile to apply it.");
    } catch (error) {
      setUploadStatus(error instanceof Error ? error.message : "Avatar upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form className="form-grid profile-settings-form" action={formAction}>
      <div className="section-eyebrow">Profile settings</div>
      <div>
        <label htmlFor="profile-display-name">Display name</label>
        <input id="profile-display-name" name="displayName" defaultValue={profile.displayName} required />
      </div>
      <div>
        <label htmlFor="profile-email">Email</label>
        <input id="profile-email" value={profile.email} disabled readOnly />
        <p className="field-help">Email is managed by Supabase auth and cannot be edited here.</p>
      </div>
      <div>
        <label htmlFor="profile-avatar-url">Avatar URL</label>
        <input id="profile-avatar-url" name="avatarUrl" type="hidden" value={avatarUrl} readOnly />
        <div className="profile-avatar-upload">
          <div className={`profile-avatar-upload-preview${avatarUrl ? "" : " profile-avatar-upload-preview-fallback"}`}>
            {avatarUrl ? <Image src={avatarUrl} alt="" fill sizes="104px" unoptimized /> : null}
          </div>
          <div className="stack">
            <label className="ghost-button profile-avatar-upload-button">
              <input
                type="file"
                accept="image/*,.png,.jpg,.jpeg,.webp,.avif"
                hidden
                disabled={isUploading}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void uploadAvatar(file);
                  }
                  event.currentTarget.value = "";
                }}
              />
              {isUploading ? "Uploading..." : "Upload avatar"}
            </label>
            <button
              type="button"
              className="ghost-button"
              onClick={() => setAvatarUrl("")}
              disabled={isUploading || !avatarUrl}
            >
              Remove avatar
            </button>
            <p className="field-help">Upload an image instead of pasting a URL.</p>
            {uploadStatus ? <p className="field-help">{uploadStatus}</p> : null}
          </div>
        </div>
      </div>
      {state.error ? <p className="field-error">{state.error}</p> : null}
      {state.success ? <p className="field-success">{state.success}</p> : null}
      <div className="inline-actions">
        <button type="submit" className="primary-button form-submit-button" disabled={isPending}>
          {isPending ? "Saving..." : "Save Profile"}
        </button>
        {onCancel ? (
          <button type="button" className="ghost-button" onClick={onCancel} disabled={isPending || isUploading}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
