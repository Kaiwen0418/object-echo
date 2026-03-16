import { afterEach, describe, expect, it, vi } from "vitest";

const createStorageSignedUpload = vi.fn();
const createSupabaseServerClient = vi.fn();
const getCurrentSupabaseUser = vi.fn();

vi.mock("@/lib/storage/signing", () => ({
  createStorageSignedUpload
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
  getCurrentSupabaseUser
}));

afterEach(() => {
  vi.clearAllMocks();
});

function makeProjectsQuery(result: { data?: unknown; error?: { message: string } | null }) {
  const maybeSingle = vi.fn().mockResolvedValue({
    data: result.data ?? null,
    error: result.error ?? null
  });
  const eqUser = vi.fn().mockReturnValue({ maybeSingle });
  const eqId = vi.fn().mockReturnValue({ eq: eqUser });
  const select = vi.fn().mockReturnValue({ eq: eqId });
  const from = vi.fn().mockReturnValue({ select });

  return {
    client: { from },
    from,
    select,
    eqId,
    eqUser,
    maybeSingle
  };
}

describe("app/api/upload/storage-sign/route", () => {
  it("returns 401 when the user is not signed in", async () => {
    getCurrentSupabaseUser.mockResolvedValueOnce(null);
    createSupabaseServerClient.mockResolvedValueOnce(null);
    const { POST } = await import("@/app/api/upload/storage-sign/route");

    const response = await POST(
      new Request("http://localhost/api/upload/storage-sign", {
        method: "POST",
        body: JSON.stringify({ projectId: "p1", kind: "audio", filename: "song.mp3" })
      })
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "You must be signed in." });
  });

  it("returns 400 when projectId is missing", async () => {
    getCurrentSupabaseUser.mockResolvedValueOnce({ id: "u1" });
    createSupabaseServerClient.mockResolvedValueOnce({});
    const { POST } = await import("@/app/api/upload/storage-sign/route");

    const response = await POST(
      new Request("http://localhost/api/upload/storage-sign", {
        method: "POST",
        body: JSON.stringify({ filename: "cover.png", kind: "image" })
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "projectId is required." });
  });

  it("returns a signed upload payload for a valid owned project", async () => {
    getCurrentSupabaseUser.mockResolvedValueOnce({ id: "u1" });
    const projects = makeProjectsQuery({ data: { id: "p1" } });
    createSupabaseServerClient.mockResolvedValueOnce(projects.client);
    createStorageSignedUpload.mockResolvedValueOnce({
      bucket: "project-assets",
      path: "projects/p1/uploads/audio-1-song.mp3",
      token: "token",
      signedUrl: "https://signed.example/upload",
      publicUrl: "https://public.example/song.mp3",
      expiresAt: "2026-01-01T00:00:00.000Z"
    });
    const { POST } = await import("@/app/api/upload/storage-sign/route");

    const response = await POST(
      new Request("http://localhost/api/upload/storage-sign", {
        method: "POST",
        body: JSON.stringify({ projectId: "p1", kind: "audio", filename: "song.mp3" })
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      upload: {
        bucket: "project-assets",
        path: "projects/p1/uploads/audio-1-song.mp3",
        token: "token",
        signedUrl: "https://signed.example/upload",
        publicUrl: "https://public.example/song.mp3",
        expiresAt: "2026-01-01T00:00:00.000Z"
      }
    });
    expect(createStorageSignedUpload).toHaveBeenCalledWith({
      filename: "song.mp3",
      projectId: "p1",
      kind: "audio"
    });
  });

  it("returns 404 when the project is not owned by the user", async () => {
    getCurrentSupabaseUser.mockResolvedValueOnce({ id: "u1" });
    const projects = makeProjectsQuery({ data: null });
    createSupabaseServerClient.mockResolvedValueOnce(projects.client);
    const { POST } = await import("@/app/api/upload/storage-sign/route");

    const response = await POST(
      new Request("http://localhost/api/upload/storage-sign", {
        method: "POST",
        body: JSON.stringify({ projectId: "missing", kind: "image", filename: "cover.png" })
      })
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Project not found." });
  });

  it("returns 500 when signed upload creation fails", async () => {
    getCurrentSupabaseUser.mockResolvedValueOnce({ id: "u1" });
    const projects = makeProjectsQuery({ data: { id: "p1" } });
    createSupabaseServerClient.mockResolvedValueOnce(projects.client);
    createStorageSignedUpload.mockRejectedValueOnce(new Error("Bucket not found"));
    const { POST } = await import("@/app/api/upload/storage-sign/route");

    const response = await POST(
      new Request("http://localhost/api/upload/storage-sign", {
        method: "POST",
        body: JSON.stringify({ projectId: "p1", kind: "image", filename: "cover.png" })
      })
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Bucket not found" });
  });
});
