begin;

create extension if not exists pgcrypto;

create type public.project_status as enum ('draft', 'published', 'archived');
create type public.asset_type as enum ('model', 'audio', 'image');
create type public.asset_source_type as enum ('upload', 'sketchfab', 'external');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (
    id,
    email,
    display_name,
    avatar_url
  )
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'user_name',
      split_part(coalesce(new.email, ''), '@', 1),
      'New User'
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = excluded.display_name,
    avatar_url = coalesce(excluded.avatar_url, public.user_profiles.avatar_url),
    updated_at = timezone('utc', now());

  return new;
end;
$$;

create or replace function public.validate_project_device_asset_links()
returns trigger
language plpgsql
as $$
declare
  linked_model_project_id uuid;
  linked_model_type public.asset_type;
  linked_music_project_id uuid;
  linked_music_type public.asset_type;
begin
  if new.model_asset_id is not null then
    select project_id, type
    into linked_model_project_id, linked_model_type
    from public.project_assets
    where id = new.model_asset_id;

    if linked_model_project_id is null then
      raise exception 'model_asset_id must reference an existing project asset';
    end if;

    if linked_model_project_id <> new.project_id then
      raise exception 'model_asset_id must belong to the same project';
    end if;

    if linked_model_type <> 'model' then
      raise exception 'model_asset_id must reference an asset of type model';
    end if;
  end if;

  if new.music_asset_id is not null then
    select project_id, type
    into linked_music_project_id, linked_music_type
    from public.project_assets
    where id = new.music_asset_id;

    if linked_music_project_id is null then
      raise exception 'music_asset_id must reference an existing project asset';
    end if;

    if linked_music_project_id <> new.project_id then
      raise exception 'music_asset_id must belong to the same project';
    end if;

    if linked_music_type <> 'audio' then
      raise exception 'music_asset_id must reference an asset of type audio';
    end if;
  end if;

  return new;
end;
$$;

create table public.user_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  username text unique,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint user_profiles_username_format_check
    check (username is null or username ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles (id) on delete cascade,
  title text not null,
  slug text not null unique,
  description text not null default '',
  status public.project_status not null default 'draft',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint projects_slug_format_check
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.project_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  type public.asset_type not null,
  source_type public.asset_source_type not null,
  source_url text,
  storage_key text,
  title text,
  author text,
  license text,
  attribution text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint project_assets_source_present_check
    check (
      source_url is not null
      or storage_key is not null
    )
);

create table public.project_devices (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  year integer not null,
  name text not null,
  era text not null default '',
  specs jsonb not null default '[]'::jsonb,
  model_asset_id uuid references public.project_assets (id) on delete set null,
  music_asset_id uuid references public.project_assets (id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint project_devices_year_check check (year between 1900 and 2100),
  constraint project_devices_specs_array_check check (jsonb_typeof(specs) = 'array'),
  constraint project_devices_sort_order_unique unique (project_id, sort_order)
);

create table public.published_pages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects (id) on delete cascade,
  slug text not null unique,
  title text not null,
  description text not null default '',
  theme jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint published_pages_slug_format_check
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint published_pages_theme_object_check
    check (jsonb_typeof(theme) = 'object')
);

create index projects_user_id_idx on public.projects (user_id);
create index projects_status_idx on public.projects (status);
create index project_assets_project_id_idx on public.project_assets (project_id);
create index project_assets_project_type_idx on public.project_assets (project_id, type);
create index project_devices_project_id_idx on public.project_devices (project_id);
create index project_devices_project_sort_idx on public.project_devices (project_id, sort_order);
create index published_pages_project_id_idx on public.published_pages (project_id);
create index published_pages_published_at_idx on public.published_pages (published_at);

create trigger set_user_profiles_updated_at
before update on public.user_profiles
for each row
execute function public.set_updated_at();

create trigger set_projects_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();

create trigger set_project_assets_updated_at
before update on public.project_assets
for each row
execute function public.set_updated_at();

create trigger set_project_devices_updated_at
before update on public.project_devices
for each row
execute function public.set_updated_at();

create trigger validate_project_device_asset_links
before insert or update on public.project_devices
for each row
execute function public.validate_project_device_asset_links();

create trigger set_published_pages_updated_at
before update on public.published_pages
for each row
execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();

alter table public.user_profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_assets enable row level security;
alter table public.project_devices enable row level security;
alter table public.published_pages enable row level security;

create policy "user_profiles_select_own"
on public.user_profiles
for select
to authenticated
using (auth.uid() = id);

create policy "user_profiles_update_own"
on public.user_profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "user_profiles_public_read_published_owners"
on public.user_profiles
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.projects
    where projects.user_id = user_profiles.id
      and projects.status = 'published'
  )
);

create policy "projects_select_own"
on public.projects
for select
to authenticated
using (auth.uid() = user_id);

create policy "projects_insert_own"
on public.projects
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "projects_update_own"
on public.projects
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "projects_delete_own"
on public.projects
for delete
to authenticated
using (auth.uid() = user_id);

create policy "projects_public_read_published"
on public.projects
for select
to anon, authenticated
using (
  status = 'published'
  and exists (
    select 1
    from public.published_pages
    where published_pages.project_id = projects.id
      and published_pages.published_at is not null
  )
);

create policy "project_assets_select_own"
on public.project_assets
for select
to authenticated
using (
  exists (
    select 1
    from public.projects
    where projects.id = project_assets.project_id
      and projects.user_id = auth.uid()
  )
);

create policy "project_assets_insert_own"
on public.project_assets
for insert
to authenticated
with check (
  exists (
    select 1
    from public.projects
    where projects.id = project_assets.project_id
      and projects.user_id = auth.uid()
  )
);

create policy "project_assets_update_own"
on public.project_assets
for update
to authenticated
using (
  exists (
    select 1
    from public.projects
    where projects.id = project_assets.project_id
      and projects.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.projects
    where projects.id = project_assets.project_id
      and projects.user_id = auth.uid()
  )
);

create policy "project_assets_delete_own"
on public.project_assets
for delete
to authenticated
using (
  exists (
    select 1
    from public.projects
    where projects.id = project_assets.project_id
      and projects.user_id = auth.uid()
  )
);

create policy "project_assets_public_read_published"
on public.project_assets
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.projects
    join public.published_pages on published_pages.project_id = projects.id
    where projects.id = project_assets.project_id
      and projects.status = 'published'
      and published_pages.published_at is not null
  )
);

create policy "project_devices_select_own"
on public.project_devices
for select
to authenticated
using (
  exists (
    select 1
    from public.projects
    where projects.id = project_devices.project_id
      and projects.user_id = auth.uid()
  )
);

create policy "project_devices_insert_own"
on public.project_devices
for insert
to authenticated
with check (
  exists (
    select 1
    from public.projects
    where projects.id = project_devices.project_id
      and projects.user_id = auth.uid()
  )
);

create policy "project_devices_update_own"
on public.project_devices
for update
to authenticated
using (
  exists (
    select 1
    from public.projects
    where projects.id = project_devices.project_id
      and projects.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.projects
    where projects.id = project_devices.project_id
      and projects.user_id = auth.uid()
  )
);

create policy "project_devices_delete_own"
on public.project_devices
for delete
to authenticated
using (
  exists (
    select 1
    from public.projects
    where projects.id = project_devices.project_id
      and projects.user_id = auth.uid()
  )
);

create policy "project_devices_public_read_published"
on public.project_devices
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.projects
    join public.published_pages on published_pages.project_id = projects.id
    where projects.id = project_devices.project_id
      and projects.status = 'published'
      and published_pages.published_at is not null
  )
);

create policy "published_pages_select_own"
on public.published_pages
for select
to authenticated
using (
  exists (
    select 1
    from public.projects
    where projects.id = published_pages.project_id
      and projects.user_id = auth.uid()
  )
);

create policy "published_pages_insert_own"
on public.published_pages
for insert
to authenticated
with check (
  exists (
    select 1
    from public.projects
    where projects.id = published_pages.project_id
      and projects.user_id = auth.uid()
  )
);

create policy "published_pages_update_own"
on public.published_pages
for update
to authenticated
using (
  exists (
    select 1
    from public.projects
    where projects.id = published_pages.project_id
      and projects.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.projects
    where projects.id = published_pages.project_id
      and projects.user_id = auth.uid()
  )
);

create policy "published_pages_delete_own"
on public.published_pages
for delete
to authenticated
using (
  exists (
    select 1
    from public.projects
    where projects.id = published_pages.project_id
      and projects.user_id = auth.uid()
  )
);

create policy "published_pages_public_read_published"
on public.published_pages
for select
to anon, authenticated
using (
  published_at is not null
  and exists (
    select 1
    from public.projects
    where projects.id = published_pages.project_id
      and projects.status = 'published'
  )
);

commit;
