export type AssetType = "model" | "audio" | "image";
export type AssetSourceType = "upload" | "sketchfab" | "external";
export type ProjectStatus = "draft" | "published" | "archived";

export type DeviceSpec = {
  label: string;
  value: string;
};

export type UserProfile = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export type Project = {
  id: string;
  userId: string;
  title: string;
  slug: string;
  description: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
};

export type ProjectDevice = {
  id: string;
  projectId: string;
  year: number;
  name: string;
  era: string;
  specs: DeviceSpec[];
  modelAssetId?: string;
  musicAssetId?: string;
  sortOrder: number;
};

export type ProjectAsset = {
  id: string;
  projectId: string;
  type: AssetType;
  sourceType: AssetSourceType;
  sourceUrl?: string;
  storageKey?: string;
  title?: string;
  author?: string;
  license?: string;
  attribution?: string;
};

export type ThemeConfig = {
  darkModeDefault: boolean;
  accentColor: string;
  surfaceColor: string;
  backgroundColor: string;
  timelineLabel: string;
  soundtrackTitle: string;
  soundtrackSubtitle: string;
  soundtrackCoverUrl: string;
};

export type PublishedPage = {
  id: string;
  projectId: string;
  slug: string;
  title: string;
  description: string;
  theme: ThemeConfig;
  publishedAt?: string;
};

export type MuseumProjectBundle = {
  owner: UserProfile;
  project: Project;
  devices: ProjectDevice[];
  assets: ProjectAsset[];
  publishedPage: PublishedPage;
};

export type MuseumSceneModelConfig = {
  kind?: "gltf" | "svg";
  path: string;
  scale: number;
  lift: number;
  yaw?: number;
  pitch?: number;
  offsetX?: number;
  brightness?: number;
  emissiveIntensity?: number;
  roughnessScale?: number;
  metalnessScale?: number;
  planeWidth?: number;
  planeHeight?: number;
};

export type SketchfabSearchResult = {
  id: string;
  name: string;
  viewerUrl: string;
  embedUrl: string;
  thumbnailUrl: string;
  authorName: string;
  licenseLabel?: string;
  downloadable: boolean;
};

export type DeviceMatchResponse = {
  era: string;
  specs: DeviceSpec[];
  candidateModels: SketchfabSearchResult[];
};
