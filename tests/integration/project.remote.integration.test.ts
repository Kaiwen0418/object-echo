import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { User } from "@supabase/supabase-js";
import {
  createRemoteAdminClient,
  deleteProjectCascade,
  getRemoteIntegrationEnv,
  signInRemoteTestUser
} from "./helpers/remote-supabase";

const remoteEnv = getRemoteIntegrationEnv();
const currentUserRef: { current: User | null } = { current: null };
const adminClient = remoteEnv ? createRemoteAdminClient(remoteEnv) : null;
const createdProjectIds: string[] = [];

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => adminClient),
  createSupabaseAdminClient: vi.fn(() => adminClient),
  getCurrentSupabaseUser: vi.fn(async () => currentUserRef.current)
}));

const describeRemote = remoteEnv ? describe : describe.skip;

describeRemote.sequential("remote Supabase project integration", () => {
  beforeAll(async () => {
    if (!remoteEnv) return;
    currentUserRef.current = await signInRemoteTestUser(remoteEnv);
  });

  afterEach(async () => {
    if (!adminClient) return;

    while (createdProjectIds.length > 0) {
      const projectId = createdProjectIds.pop();
      if (projectId) {
        await deleteProjectCascade(adminClient, projectId);
      }
    }
  });

  it("creates and lists a project against the remote database", async () => {
    const { createProject, listProjects } = await import("@/lib/utils/project");
    const slug = `it-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const project = await createProject({
      title: "Integration Test Museum",
      slug,
      description: "Created by remote integration tests"
    });
    createdProjectIds.push(project.id);

    expect(project.slug).toBe(slug);

    const projects = await listProjects();
    expect(projects.some((item) => item.id === project.id)).toBe(true);
  });

  it("persists assets and rejects invalid device audio links", async () => {
    const { createProject, replaceProjectDevices, syncProjectAssets } = await import("@/lib/utils/project");
    const slug = `it-assets-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const project = await createProject({
      title: "Integration Asset Museum",
      slug,
      description: "Asset/device integration"
    });
    createdProjectIds.push(project.id);

    const assets = await syncProjectAssets(project.id, [
      {
        type: "model",
        sourceType: "sketchfab",
        sourceUrl: "https://sketchfab.com/models/c3d445e4e77441eba265504c0391a415/embed",
        title: "Device Model"
      },
      {
        type: "audio",
        sourceType: "external",
        sourceUrl: "https://cdn.example.com/song.mp3",
        title: "Soundtrack"
      }
    ]);

    const modelAsset = assets.find((asset) => asset.type === "model");
    const audioAsset = assets.find((asset) => asset.type === "audio");

    expect(modelAsset?.id).toBeTruthy();
    expect(audioAsset?.id).toBeTruthy();

    await expect(
      replaceProjectDevices(project.id, [
        {
          name: "Broken Device",
          year: 2008,
          musicAssetId: modelAsset?.id,
          sortOrder: 0
        }
      ])
    ).rejects.toThrow('Device "Broken Device" references an invalid music asset.');

    const devices = await replaceProjectDevices(project.id, [
      {
        name: "Working Device",
        year: 2008,
        modelAssetId: modelAsset?.id,
        musicAssetId: audioAsset?.id,
        sortOrder: 0
      }
    ]);

    expect(devices).toHaveLength(1);
    expect(devices[0]?.musicAssetId).toBe(audioAsset?.id);
  });

  it("returns a full bundle from getProjectById", async () => {
    const { createProject, getProjectById, replaceProjectDevices, syncProjectAssets } = await import("@/lib/utils/project");
    const slug = `it-bundle-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const project = await createProject({
      title: "Integration Bundle Museum",
      slug,
      description: "Bundle hydration"
    });
    createdProjectIds.push(project.id);

    const assets = await syncProjectAssets(project.id, [
      {
        type: "audio",
        sourceType: "external",
        sourceUrl: "https://cdn.example.com/song.mp3",
        title: "Soundtrack"
      }
    ]);

    await replaceProjectDevices(project.id, [
      {
        name: "Bundle Device",
        year: 2010,
        musicAssetId: assets[0]?.id,
        sortOrder: 0
      }
    ]);

    const bundle = await getProjectById(project.id);

    expect(bundle?.project.id).toBe(project.id);
    expect(bundle?.assets).toHaveLength(1);
    expect(bundle?.devices).toHaveLength(1);
    expect(bundle?.devices[0]?.musicAssetId).toBe(assets[0]?.id);
  });
});
