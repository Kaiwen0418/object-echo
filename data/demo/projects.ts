import type {
  MuseumProjectBundle,
  Project,
  ProjectAsset,
  ProjectDevice,
  PublishedPage,
  ThemeConfig,
  UserProfile
} from "@/types";

export const demoUser: UserProfile = {
  id: "user_demo_001",
  email: "guest@object-echo.local",
  displayName: "Guest Curator",
  createdAt: "2026-03-11T09:00:00.000Z",
  updatedAt: "2026-03-11T09:00:00.000Z"
};

export const demoTheme: ThemeConfig = {
  darkModeDefault: false,
  accentColor: "#18223d",
  surfaceColor: "rgba(255,255,255,0.76)",
  backgroundColor: "#e6e9f1",
  timelineLabel: "Personal Device Museum",
  soundtrackTitle: "Memory Lane.fm",
  soundtrackSubtitle: "Device era mix",
  soundtrackCoverUrl:
    "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=500&q=80"
};

export const demoProject: Project = {
  id: "project_demo_001",
  userId: demoUser.id,
  title: "Blueberry Personal Device Museum",
  slug: "blueberry-device-museum",
  description: "A scrolling archive of personal devices, soundtracks, and digital memory.",
  status: "draft",
  createdAt: "2026-03-11T09:00:00.000Z",
  updatedAt: "2026-03-11T09:00:00.000Z"
};

export const demoDevices: ProjectDevice[] = [
  {
    id: "device_001",
    projectId: demoProject.id,
    year: 2008,
    name: "CASIO F-91W",
    era: "Digital Watches",
    specs: [
      { label: "Display", value: "LCD" },
      { label: "Functions", value: "Alarm + Stopwatch" },
      { label: "Battery", value: "Long Life Quartz" }
    ],
    modelAssetId: "asset_model_casio",
    sortOrder: 0
  },
  {
    id: "device_002",
    projectId: demoProject.id,
    year: 2009,
    name: "SONY WALKMAN",
    era: "Portable Audio",
    specs: [
      { label: "Format", value: "Cassette" },
      { label: "Focus", value: "Record + Playback" },
      { label: "Build", value: "Field Recorder" }
    ],
    modelAssetId: "asset_model_walkman",
    musicAssetId: "asset_audio_mix",
    sortOrder: 1
  },
  {
    id: "device_003",
    projectId: demoProject.id,
    year: 2010,
    name: "NOKIA 3310",
    era: "Early Mobile",
    specs: [
      { label: "Display", value: "84x48" },
      { label: "Network", value: "2G GSM" },
      { label: "Battery", value: "900mAh" }
    ],
    modelAssetId: "asset_model_nokia",
    sortOrder: 2
  },
  {
    id: "device_004",
    projectId: demoProject.id,
    year: 2012,
    name: "IPOD NANO",
    era: "Portable Music",
    specs: [
      { label: "Storage", value: "16GB" },
      { label: "Input", value: "Touch" },
      { label: "Focus", value: "Music" }
    ],
    modelAssetId: "asset_model_ipod",
    sortOrder: 3
  },
  {
    id: "device_005",
    projectId: demoProject.id,
    year: 2014,
    name: "SAMSUNG GALAXY MINI II",
    era: "Android Phones",
    specs: [
      { label: "Display", value: "3.27-inch TFT" },
      { label: "System", value: "Android" },
      { label: "Focus", value: "Compact Smartphone" }
    ],
    modelAssetId: "asset_model_galaxy",
    sortOrder: 4
  },
  {
    id: "device_006",
    projectId: demoProject.id,
    year: 2016,
    name: "WACOM TABLET",
    era: "Creative Tools",
    specs: [
      { label: "Input", value: "Pen" },
      { label: "Use", value: "Drawing" },
      { label: "Connect", value: "USB/BT" }
    ],
    modelAssetId: "asset_model_wacom",
    sortOrder: 5
  },
  {
    id: "device_007",
    projectId: demoProject.id,
    year: 2025,
    name: "MACBOOK M4",
    era: "Personal Computing",
    specs: [
      { label: "Chip", value: "Apple M4" },
      { label: "Form", value: "Laptop" },
      { label: "Focus", value: "Work + Create" }
    ],
    modelAssetId: "asset_model_macbook",
    sortOrder: 6
  }
];

export const demoAssets: ProjectAsset[] = [
  {
    id: "asset_model_casio",
    projectId: demoProject.id,
    type: "model",
    sourceType: "external",
    sourceUrl: "/demo/models/casio_f-91w/scene.gltf",
    title: "Casio F-91W"
  },
  {
    id: "asset_model_walkman",
    projectId: demoProject.id,
    type: "model",
    sourceType: "external",
    sourceUrl: "/demo/models/sony_walkman_professional_wm-d6c/scene.gltf",
    title: "Sony Walkman Professional WM-D6C"
  },
  {
    id: "asset_model_nokia",
    projectId: demoProject.id,
    type: "model",
    sourceType: "external",
    sourceUrl: "/demo/models/nokia_3310/scene.gltf",
    title: "Nokia 3310"
  },
  {
    id: "asset_model_ipod",
    projectId: demoProject.id,
    type: "model",
    sourceType: "external",
    sourceUrl: "/demo/models/ipod/scene.gltf",
    title: "iPod Nano"
  },
  {
    id: "asset_model_galaxy",
    projectId: demoProject.id,
    type: "model",
    sourceType: "external",
    sourceUrl: "/demo/models/samsung_galaxy_s4/scene.gltf",
    title: "Samsung Galaxy S4"
  },
  {
    id: "asset_model_wacom",
    projectId: demoProject.id,
    type: "model",
    sourceType: "external",
    sourceUrl: "/demo/models/wacom_intuos_ctl-4100k-n/scene.gltf",
    title: "Wacom Intuos"
  },
  {
    id: "asset_model_macbook",
    projectId: demoProject.id,
    type: "model",
    sourceType: "external",
    sourceUrl: "/demo/models/macbook_m4/scene.gltf",
    title: "MacBook M4"
  },
  {
    id: "asset_audio_mix",
    projectId: demoProject.id,
    type: "audio",
    sourceType: "external",
    sourceUrl: "https://example.com/mock-audio.mp3",
    title: "Memory Lane.fm"
  }
];

export const demoPublishedPage: PublishedPage = {
  id: "published_001",
  projectId: demoProject.id,
  slug: demoProject.slug,
  title: demoProject.title,
  description: demoProject.description,
  theme: demoTheme,
  publishedAt: "2026-03-11T09:00:00.000Z"
};

export const demoBundle: MuseumProjectBundle = {
  owner: demoUser,
  project: demoProject,
  devices: demoDevices,
  assets: demoAssets,
  publishedPage: demoPublishedPage
};

export const demoProjects: Project[] = [demoProject];
