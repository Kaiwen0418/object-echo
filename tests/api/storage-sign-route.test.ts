import { afterEach, describe, expect, it, vi } from "vitest";

const createStorageSignedUpload = vi.fn();
const createSupabaseServerClient = vi.fn();
const createSupabaseAdminClient = vi.fn();
const getCurrentSupabaseUser = vi.fn();
const getStorageConfig = vi.fn();

vi.mock("@/lib/storage/signing", () => ({
  createStorageSignedUpload
}));

vi.mock("@/lib/storage/client", () => ({
  getStorageConfig
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
  createSupabaseAdminClient,
  getCurrentSupabaseUser
}));

afterEach(() => {
  vi.clearAllMocks();
});

function makeSupabaseClient(params: {
  ownedProject?: { id: string } | null;
  ownedProjectError?: { message: string } | null;
  userProjects?: Array<{ id: string }>;
  userProjectsError?: { message: string } | null;
}) {
  return {
    from(table: string) {
      if (table !== "projects") {
        throw new Error(`Unexpected table: ${table}`);
      }

      return {
        select(selection: string) {
          if (selection !== "id") {
            throw new Error(`Unexpected selection: ${selection}`);
          }

          return {
            eq(column: string, value: string) {
              if (column === "id") {
                expect(value).toBeDefined();
                return {
                  eq(nextColumn: string, nextValue: string) {
                    expect(nextColumn).toBe("user_id");
                    expect(nextValue).toBeDefined();
                    return {
                      maybeSingle: vi.fn().mockResolvedValue({
                        data: params.ownedProject ?? null,
                        error: params.ownedProjectError ?? null
                      })
                    };
                  }
                };
              }

              if (column === "user_id") {
                expect(value).toBeDefined();
                return {
                  returns: vi.fn().mockResolvedValue({
                    data: params.userProjects ?? [],
                    error: params.userProjectsError ?? null
                  })
                };
              }

              throw new Error(`Unexpected column: ${column}`);
            }
          };
        }
      };
    }
  };
}

function makeAdminClient(totalBytes = 0) {
  return {
    storage: {
      from: vi.fn().mockReturnValue({
        list: vi.fn().mockResolvedValue({
          data: totalBytes
            ? [
                {
                  name: "existing.bin",
                  metadata: { size: totalBytes }
                }
              ]
            : [],
          error: null
        })
      })
    }
  };
}

describe("app/api/upload/storage-sign/route", () => {
  it("returns 401 when the user is not signed in", async () => {
    getCurrentSupabaseUser.mockResolvedValueOnce(null);
    createSupabaseServerClient.mockResolvedValueOnce(null);
    getStorageConfig.mockReturnValue({ enabled: true, bucket: "project-assets" });
    createSupabaseAdminClient.mockReturnValue(makeAdminClient());
    const { POST } = await import("@/app/api/upload/storage-sign/route");

    const response = await POST(
      new Request("http://localhost/api/upload/storage-sign", {
        method: "POST",
        body: JSON.stringify({ projectId: "p1", kind: "audio", filename: "song.mp3", fileSize: 1024 })
      })
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "You must be signed in." });
  });

  it("returns 400 when projectId is missing", async () => {
    getCurrentSupabaseUser.mockResolvedValueOnce({ id: "u1" });
    createSupabaseServerClient.mockResolvedValueOnce({});
    getStorageConfig.mockReturnValue({ enabled: true, bucket: "project-assets" });
    createSupabaseAdminClient.mockReturnValue(makeAdminClient());
    const { POST } = await import("@/app/api/upload/storage-sign/route");

    const response = await POST(
      new Request("http://localhost/api/upload/storage-sign", {
        method: "POST",
        body: JSON.stringify({ filename: "cover.png", kind: "image", fileSize: 1024 })
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "projectId is required." });
  });

  it("returns 400 when fileSize is missing", async () => {
    getCurrentSupabaseUser.mockResolvedValueOnce({ id: "u1" });
    createSupabaseServerClient.mockResolvedValueOnce({});
    getStorageConfig.mockReturnValue({ enabled: true, bucket: "project-assets" });
    createSupabaseAdminClient.mockReturnValue(makeAdminClient());
    const { POST } = await import("@/app/api/upload/storage-sign/route");

    const response = await POST(
      new Request("http://localhost/api/upload/storage-sign", {
        method: "POST",
        body: JSON.stringify({ projectId: "p1", kind: "image", filename: "cover.png" })
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "fileSize is required." });
  });

  it("returns a signed upload payload for a valid owned project", async () => {
    getCurrentSupabaseUser.mockResolvedValueOnce({ id: "u1" });
    createSupabaseServerClient.mockResolvedValueOnce(
      makeSupabaseClient({
        ownedProject: { id: "p1" },
        userProjects: [{ id: "p1" }]
      })
    );
    getStorageConfig.mockReturnValue({ enabled: true, bucket: "project-assets" });
    createSupabaseAdminClient.mockReturnValue(makeAdminClient());
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
        body: JSON.stringify({ projectId: "p1", kind: "audio", filename: "song.mp3", fileSize: 1024 })
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
    createSupabaseServerClient.mockResolvedValueOnce(
      makeSupabaseClient({
        ownedProject: null,
        userProjects: []
      })
    );
    getStorageConfig.mockReturnValue({ enabled: true, bucket: "project-assets" });
    createSupabaseAdminClient.mockReturnValue(makeAdminClient());
    const { POST } = await import("@/app/api/upload/storage-sign/route");

    const response = await POST(
      new Request("http://localhost/api/upload/storage-sign", {
        method: "POST",
        body: JSON.stringify({ projectId: "missing", kind: "image", filename: "cover.png", fileSize: 1024 })
      })
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Project not found." });
  });

  it("returns 400 when user asset storage quota would be exceeded", async () => {
    getCurrentSupabaseUser.mockResolvedValueOnce({ id: "u1" });
    createSupabaseServerClient.mockResolvedValueOnce(
      makeSupabaseClient({
        ownedProject: { id: "p1" },
        userProjects: [{ id: "p1" }]
      })
    );
    getStorageConfig.mockReturnValue({ enabled: true, bucket: "project-assets" });
    createSupabaseAdminClient.mockReturnValue(makeAdminClient(250 * 1024 * 1024));
    const { POST } = await import("@/app/api/upload/storage-sign/route");

    const response = await POST(
      new Request("http://localhost/api/upload/storage-sign", {
        method: "POST",
        body: JSON.stringify({ projectId: "p1", kind: "image", filename: "cover.png", fileSize: 1024 })
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "You can store up to 250 MB of uploaded assets per account."
    });
  });

  it("returns 500 when signed upload creation fails", async () => {
    getCurrentSupabaseUser.mockResolvedValueOnce({ id: "u1" });
    createSupabaseServerClient.mockResolvedValueOnce(
      makeSupabaseClient({
        ownedProject: { id: "p1" },
        userProjects: [{ id: "p1" }]
      })
    );
    getStorageConfig.mockReturnValue({ enabled: true, bucket: "project-assets" });
    createSupabaseAdminClient.mockReturnValue(makeAdminClient());
    createStorageSignedUpload.mockRejectedValueOnce(new Error("Bucket not found"));
    const { POST } = await import("@/app/api/upload/storage-sign/route");

    const response = await POST(
      new Request("http://localhost/api/upload/storage-sign", {
        method: "POST",
        body: JSON.stringify({ projectId: "p1", kind: "image", filename: "cover.png", fileSize: 1024 })
      })
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Bucket not found" });
  });
});
