import type { SketchfabSearchResult } from "@/types";

export async function searchModels(query: string): Promise<SketchfabSearchResult[]> {
  const safeQuery = query.trim() || "device";

  return [
    {
      id: "mock-sketchfab-1",
      name: `${safeQuery} museum model`,
      viewerUrl: "https://sketchfab.com/mock/device-museum-model",
      embedUrl: "https://sketchfab.com/models/mock-device-museum-model/embed",
      thumbnailUrl: "https://placehold.co/640x360?text=Sketchfab+Mock",
      authorName: "Mock Creator",
      licenseLabel: "Editorial Mock",
      downloadable: false
    }
  ];
}

// TODO: Call the real Sketchfab search API and map pagination/auth state.
