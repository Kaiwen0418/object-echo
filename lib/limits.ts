export const MAX_PROJECTS_PER_USER = 4;
export const MAX_DEVICES_PER_PROJECT = 10;
export const MAX_ASSET_STORAGE_BYTES_PER_USER = 250 * 1024 * 1024;
export const MAX_SINGLE_ASSET_UPLOAD_BYTES = 50 * 1024 * 1024;

export function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }

  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  }

  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }

  return `${bytes} B`;
}
