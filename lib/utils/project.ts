import { demoBundle, demoProjects, demoTheme } from "@/data/demo/projects";
import { MAX_PROJECTS_PER_USER } from "@/lib/limits";
import { createSupabaseAdminClient, createSupabaseServerClient, getCurrentSupabaseUser } from "@/lib/supabase/server";
import type {
  MuseumProjectBundle,
  Project,
  ProjectAsset,
  ProjectDevice,
  PublishedPage,
  ThemeConfig,
  UserProfile
} from "@/types";

type UserProfileRow = {
  id: string;
  email: string;
  username: string | null;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

type ProjectRow = {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  description: string;
  status: Project["status"];
  created_at: string;
  updated_at: string;
};

type ProjectAssetRow = {
  id: string;
  project_id: string;
  type: ProjectAsset["type"];
  source_type: ProjectAsset["sourceType"];
  source_url: string | null;
  preview_image_url: string | null;
  storage_key: string | null;
  title: string | null;
  author: string | null;
  license: string | null;
  attribution: string | null;
};

type ProjectDeviceRow = {
  id: string;
  project_id: string;
  year: number;
  name: string;
  era: string;
  specs: ProjectDevice["specs"] | null;
  model_asset_id: string | null;
  music_asset_id: string | null;
  sort_order: number;
};

type PublishedPageRow = {
  id: string;
  project_id: string;
  slug: string;
  title: string;
  description: string;
  theme: ThemeConfig | null;
  published_at: string | null;
};

function mapUserProfile(row: UserProfileRow): UserProfile {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    avatarUrl: row.avatar_url ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapProject(row: ProjectRow): Project {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapProjectAsset(row: ProjectAssetRow): ProjectAsset {
  return {
    id: row.id,
    projectId: row.project_id,
    type: row.type,
    sourceType: row.source_type,
    sourceUrl: row.source_url ?? undefined,
    previewImageUrl: row.preview_image_url ?? undefined,
    storageKey: row.storage_key ?? undefined,
    title: row.title ?? undefined,
    author: row.author ?? undefined,
    license: row.license ?? undefined,
    attribution: row.attribution ?? undefined
  };
}

function mapProjectDevice(row: ProjectDeviceRow): ProjectDevice {
  return {
    id: row.id,
    projectId: row.project_id,
    year: row.year,
    name: row.name,
    era: row.era,
    specs: row.specs ?? [],
    modelAssetId: row.model_asset_id ?? undefined,
    musicAssetId: row.music_asset_id ?? undefined,
    sortOrder: row.sort_order
  };
}

function createDraftPublishedPage(project: Project): PublishedPage {
  return {
    id: `draft-${project.id}`,
    projectId: project.id,
    slug: project.slug,
    title: project.title,
    description: project.description,
    theme: demoTheme,
    publishedAt: undefined
  };
}

function mapPublishedPage(row: PublishedPageRow): PublishedPage {
  return {
    id: row.id,
    projectId: row.project_id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    theme: row.theme ?? demoTheme,
    publishedAt: row.published_at ?? undefined
  };
}

function buildBundle(params: {
  owner: UserProfile;
  project: Project;
  devices: ProjectDevice[];
  assets: ProjectAsset[];
  publishedPage?: PublishedPage;
}): MuseumProjectBundle {
  return {
    owner: params.owner,
    project: params.project,
    devices: params.devices,
    assets: params.assets,
    publishedPage: params.publishedPage ?? createDraftPublishedPage(params.project)
  };
}

async function fetchProjectBundle(projectRow: ProjectRow): Promise<MuseumProjectBundle | undefined> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return undefined;
  }

  const [{ data: ownerRow }, { data: deviceRows }, { data: assetRows }, { data: publishedPageRow }] =
    await Promise.all([
      supabase.from("user_profiles").select("*").eq("id", projectRow.user_id).maybeSingle<UserProfileRow>(),
      supabase.from("project_devices").select("*").eq("project_id", projectRow.id).order("sort_order", { ascending: true }).returns<ProjectDeviceRow[]>(),
      supabase.from("project_assets").select("*").eq("project_id", projectRow.id).returns<ProjectAssetRow[]>(),
      supabase.from("published_pages").select("*").eq("project_id", projectRow.id).maybeSingle<PublishedPageRow>()
    ]);

  if (!ownerRow) {
    return undefined;
  }

  return buildBundle({
    owner: mapUserProfile(ownerRow),
    project: mapProject(projectRow),
    devices: (deviceRows ?? []).map(mapProjectDevice),
    assets: (assetRows ?? []).map(mapProjectAsset),
    publishedPage: publishedPageRow ? mapPublishedPage(publishedPageRow) : undefined
  });
}

export async function ensureCurrentUserProfile() {
  const user = await getCurrentSupabaseUser();
  const admin = createSupabaseAdminClient();

  if (!user || !admin) {
    return null;
  }

  const { data, error } = await admin
    .from("user_profiles")
    .upsert(
      {
        id: user.id,
        email: user.email ?? "",
        display_name:
          user.user_metadata?.display_name ??
          user.user_metadata?.name ??
          user.email?.split("@")[0] ??
          "New User",
        avatar_url: user.user_metadata?.avatar_url ?? null
      },
      { onConflict: "id" }
    )
    .select("*")
    .single<UserProfileRow>();

  if (error) {
    throw error;
  }

  return mapUserProfile(data);
}

export async function getCurrentUserProfile() {
  const user = await getCurrentSupabaseUser();
  const supabase = await createSupabaseServerClient();

  if (!user || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<UserProfileRow>();

  if (error) {
    throw error;
  }

  if (data) {
    return mapUserProfile(data);
  }

  return ensureCurrentUserProfile();
}

export async function updateCurrentUserProfile(input: {
  displayName: string;
  avatarUrl?: string;
}) {
  const user = await getCurrentSupabaseUser();
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();

  if (!user || !supabase) {
    throw new Error("You must be signed in to update your profile.");
  }

  const displayName = input.displayName.trim();
  const avatarUrl = input.avatarUrl?.trim() || null;

  if (!displayName) {
    throw new Error("Display name is required.");
  }

  let data: UserProfileRow | null = null;

  if (admin) {
    const result = await admin
      .from("user_profiles")
      .upsert(
        {
          id: user.id,
          email: user.email ?? "",
          display_name: displayName,
          avatar_url: avatarUrl
        },
        { onConflict: "id" }
      )
      .select("*")
      .single<UserProfileRow>();

    if (result.error) {
      throw result.error;
    }

    data = result.data;
  } else {
    const result = await supabase
      .from("user_profiles")
      .update({
        email: user.email ?? "",
        display_name: displayName,
        avatar_url: avatarUrl
      })
      .eq("id", user.id)
      .select("*")
      .maybeSingle<UserProfileRow>();

    if (result.error) {
      throw result.error;
    }

    if (!result.data) {
      throw new Error("Profile record is missing. Refresh the dashboard and try again.");
    }

    data = result.data;
  }

  const { error: authError } = await supabase.auth.updateUser({
    data: {
      ...(user.user_metadata ?? {}),
      display_name: displayName,
      avatar_url: avatarUrl
    }
  });

  if (authError && admin) {
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...(user.user_metadata ?? {}),
        display_name: displayName,
        avatar_url: avatarUrl
      }
    });

    if (error) {
      throw error;
    }
  } else if (authError) {
    throw authError;
  }

  return mapUserProfile(data);
}

export async function listProjects(): Promise<Project[]> {
  const supabase = await createSupabaseServerClient();
  const user = await getCurrentSupabaseUser();

  if (!supabase || !user) {
    return demoProjects;
  }

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<ProjectRow[]>();

  if (error) {
    console.error("Failed to list projects", error);
    return [];
  }

  return (data ?? []).map(mapProject);
}

export async function createProject(input: {
  title: string;
  slug: string;
  description: string;
}): Promise<Project> {
  const supabase = await createSupabaseServerClient();
  const user = await getCurrentSupabaseUser();

  if (!supabase || !user) {
    throw new Error("You must be signed in to create a project.");
  }

  await ensureCurrentUserProfile();

  const { count, error: countError } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (countError) {
    throw new Error(countError.message);
  }

  if ((count ?? 0) >= MAX_PROJECTS_PER_USER) {
    throw new Error(`You can create up to ${MAX_PROJECTS_PER_USER} projects.`);
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      title: input.title,
      slug: input.slug,
      description: input.description
    })
    .select("*")
    .single<ProjectRow>();

  if (error) {
    throw new Error(error.message);
  }

  return mapProject(data);
}

export async function publishProject(projectId: string) {
  const supabase = await createSupabaseServerClient();
  const user = await getCurrentSupabaseUser();

  if (!supabase || !user) {
    throw new Error("You must be signed in to publish a project.");
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .maybeSingle<ProjectRow>();

  if (projectError) {
    throw new Error(projectError.message);
  }

  if (!project) {
    throw new Error("Project not found.");
  }

  const { data: existingPublishedPage, error: existingPublishedPageError } = await supabase
    .from("published_pages")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle<PublishedPageRow>();

  if (existingPublishedPageError) {
    throw new Error(existingPublishedPageError.message);
  }

  const { error: publishError } = await supabase.from("published_pages").upsert(
    {
      project_id: projectId,
      slug: project.slug,
      title: project.title,
      description: project.description,
      theme: existingPublishedPage?.theme ?? demoTheme,
      published_at: new Date().toISOString()
    },
    { onConflict: "project_id" }
  );

  if (publishError) {
    throw new Error(publishError.message);
  }

  const { error: updateProjectError } = await supabase
    .from("projects")
    .update({ status: "published" satisfies Project["status"] })
    .eq("id", projectId)
    .eq("user_id", user.id);

  if (updateProjectError) {
    throw new Error(updateProjectError.message);
  }
}

export async function unpublishProject(projectId: string) {
  const supabase = await createSupabaseServerClient();
  const user = await getCurrentSupabaseUser();

  if (!supabase || !user) {
    throw new Error("You must be signed in to unpublish a project.");
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .maybeSingle<{ id: string }>();

  if (projectError) {
    throw new Error(projectError.message);
  }

  if (!project) {
    throw new Error("Project not found.");
  }

  const { error: deletePublishedPageError } = await supabase.from("published_pages").delete().eq("project_id", projectId);

  if (deletePublishedPageError) {
    throw new Error(deletePublishedPageError.message);
  }

  const { error: updateProjectError } = await supabase
    .from("projects")
    .update({ status: "draft" satisfies Project["status"] })
    .eq("id", projectId)
    .eq("user_id", user.id);

  if (updateProjectError) {
    throw new Error(updateProjectError.message);
  }
}

export async function replaceProjectDevices(
  projectId: string,
  devices: Array<{
    id?: string;
    name: string;
    year: number;
    era?: string;
    specs?: ProjectDevice["specs"];
    modelAssetId?: string;
    musicAssetId?: string;
    sortOrder: number;
  }>
): Promise<ProjectDevice[]> {
  const supabase = await createSupabaseServerClient();
  const user = await getCurrentSupabaseUser();

  if (!supabase || !user) {
    throw new Error("You must be signed in to update devices.");
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .maybeSingle<{ id: string }>();

  if (projectError) {
    throw projectError;
  }

  if (!project) {
    throw new Error("Project not found.");
  }

  const referencedAssetIds = Array.from(
    new Set(
      devices
        .flatMap((device) => [device.modelAssetId, device.musicAssetId])
        .filter((assetId): assetId is string => typeof assetId === "string" && assetId.length > 0)
    )
  );

  let assetTypeById = new Map<string, ProjectAsset["type"]>();

  if (referencedAssetIds.length > 0) {
    const { data: assetRows, error: assetError } = await supabase
      .from("project_assets")
      .select("id, type")
      .eq("project_id", projectId)
      .in("id", referencedAssetIds)
      .returns<Array<{ id: string; type: ProjectAsset["type"] }>>();

    if (assetError) {
      throw assetError;
    }

    assetTypeById = new Map((assetRows ?? []).map((asset) => [asset.id, asset.type]));

    for (const device of devices) {
      if (device.modelAssetId) {
        const assetType = assetTypeById.get(device.modelAssetId);
        if (assetType !== "model") {
          throw new Error(`Device "${device.name}" references an invalid model asset.`);
        }
      }

      if (device.musicAssetId) {
        const assetType = assetTypeById.get(device.musicAssetId);
        if (assetType !== "audio") {
          throw new Error(`Device "${device.name}" references an invalid music asset.`);
        }
      }
    }
  }

  const payload = devices.map((device, index) => ({
    project_id: projectId,
    name: device.name,
    year: device.year,
    era: device.era ?? "",
    specs: device.specs ?? [],
    model_asset_id: device.modelAssetId ?? null,
    music_asset_id: device.musicAssetId ?? null,
    sort_order: index
  }));

  const { error: deleteError } = await supabase.from("project_devices").delete().eq("project_id", projectId);

  if (deleteError) {
    throw deleteError;
  }

  if (!payload.length) {
    return [];
  }

  const { data, error } = await supabase
    .from("project_devices")
    .insert(payload)
    .select("*")
    .order("sort_order", { ascending: true })
    .returns<ProjectDeviceRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapProjectDevice);
}

export async function syncProjectAssets(
  projectId: string,
  assets: Array<{
    id?: string;
    type: ProjectAsset["type"];
    sourceType: ProjectAsset["sourceType"];
    sourceUrl?: string;
    previewImageUrl?: string;
    storageKey?: string;
    title?: string;
    author?: string;
    license?: string;
    attribution?: string;
  }>
): Promise<ProjectAsset[]> {
  const supabase = await createSupabaseServerClient();
  const user = await getCurrentSupabaseUser();

  if (!supabase || !user) {
    throw new Error("You must be signed in to update assets.");
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .maybeSingle<{ id: string }>();

  if (projectError) {
    throw projectError;
  }

  if (!project) {
    throw new Error("Project not found.");
  }

  const { data: existingAssets, error: existingError } = await supabase
    .from("project_assets")
    .select("id")
    .eq("project_id", projectId)
    .returns<Array<{ id: string }>>();

  if (existingError) {
    throw existingError;
  }

  const existingIds = new Set((existingAssets ?? []).map((asset) => asset.id));
  const retainedIds = new Set(
    assets
      .map((asset) => asset.id)
      .filter((assetId): assetId is string => typeof assetId === "string")
      .filter((assetId) => existingIds.has(assetId))
  );
  const idsToDelete = [...existingIds].filter((id) => !retainedIds.has(id));

  if (idsToDelete.length > 0) {
    const { error: deleteError } = await supabase.from("project_assets").delete().in("id", idsToDelete);

    if (deleteError) {
      throw deleteError;
    }
  }

  const savedAssets: ProjectAsset[] = [];

  for (const asset of assets) {
    const payload = {
      project_id: projectId,
      type: asset.type,
      source_type: asset.sourceType,
      source_url: asset.sourceUrl ?? null,
      preview_image_url: asset.previewImageUrl ?? null,
      storage_key: asset.storageKey ?? null,
      title: asset.title ?? null,
      author: asset.author ?? null,
      license: asset.license ?? null,
      attribution: asset.attribution ?? null
    };

    if (asset.id && existingIds.has(asset.id)) {
      const { data: updatedAsset, error } = await supabase
        .from("project_assets")
        .update(payload)
        .eq("id", asset.id)
        .eq("project_id", projectId)
        .select("*")
        .single<ProjectAssetRow>();

      if (error) {
        throw error;
      }
      savedAssets.push(mapProjectAsset(updatedAsset));
      continue;
    }

    const { data: insertedAsset, error } = await supabase
      .from("project_assets")
      .insert(payload)
      .select("*")
      .single<ProjectAssetRow>();

    if (error) {
      throw error;
    }
    savedAssets.push(mapProjectAsset(insertedAsset));
  }

  return savedAssets;
}

export async function getProjectById(projectId: string): Promise<MuseumProjectBundle | undefined> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return demoBundle.project.id === projectId ? demoBundle : undefined;
  }

  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle<ProjectRow>();

  if (!data) {
    return demoBundle.project.id === projectId ? demoBundle : undefined;
  }

  return fetchProjectBundle(data);
}

export async function getProjectBySlug(slug: string): Promise<MuseumProjectBundle | undefined> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return demoBundle.project.slug === slug ? demoBundle : undefined;
  }

  const { data: publishedPage } = await supabase
    .from("published_pages")
    .select("*")
    .eq("slug", slug)
    .not("published_at", "is", null)
    .maybeSingle<PublishedPageRow>();

  if (!publishedPage) {
    return demoBundle.project.slug === slug ? demoBundle : undefined;
  }

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", publishedPage.project_id)
    .maybeSingle<ProjectRow>();

  if (!project) {
    return undefined;
  }

  const bundle = await fetchProjectBundle(project);

  if (!bundle) {
    return undefined;
  }

  return {
    ...bundle,
    publishedPage: mapPublishedPage(publishedPage)
  };
}
