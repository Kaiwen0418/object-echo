import type { SketchfabSearchResult } from "@/types";
import { DEFAULT_SKETCHFAB_MODELS, buildSketchfabEmbedUrl, buildSketchfabViewerUrl } from "@/features/museum/lib/config";

export async function searchModels(query: string): Promise<SketchfabSearchResult[]> {
  const safeQuery = query.trim() || "device";
  const normalizedQuery = safeQuery.toLowerCase();

  return Object.values(DEFAULT_SKETCHFAB_MODELS)
    .filter((model) => {
      const haystack = `${model.title} ${model.author ?? ""} ${model.license ?? ""}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    })
    .map((model) => ({
      id: model.uid,
      name: model.title,
      viewerUrl: buildSketchfabViewerUrl(model.uid),
      embedUrl: buildSketchfabEmbedUrl(model.uid),
      thumbnailUrl: `https://placehold.co/640x360?text=${encodeURIComponent(model.title)}`,
      authorName: model.author ?? "Sketchfab Creator",
      licenseLabel: model.license,
      downloadable: false
    }));
}
