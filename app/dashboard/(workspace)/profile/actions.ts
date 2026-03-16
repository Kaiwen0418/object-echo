"use server";

import { updateCurrentUserProfile } from "@/lib/utils/project";

export type SaveProfileState = {
  error?: string;
  success?: string;
};

export async function saveProfileAction(
  _prevState: SaveProfileState,
  formData: FormData
): Promise<SaveProfileState> {
  try {
    const displayName = String(formData.get("displayName") ?? "").trim();
    const avatarUrl = String(formData.get("avatarUrl") ?? "").trim();

    if (!displayName) {
      return { error: "Display name is required." };
    }

    await updateCurrentUserProfile({
      displayName,
      avatarUrl: avatarUrl || undefined
    });

    return { success: "Profile updated." };
  } catch (error) {
    console.error("Failed to update profile", error);
    return {
      error: error instanceof Error ? error.message : "Failed to update profile."
    };
  }
}
