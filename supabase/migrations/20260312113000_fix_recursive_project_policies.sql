begin;

drop policy if exists "projects_public_read_published" on public.projects;
drop policy if exists "published_pages_public_read_published" on public.published_pages;

create policy "projects_public_read_published"
on public.projects
for select
to anon, authenticated
using (status = 'published');

create policy "published_pages_public_read_published"
on public.published_pages
for select
to anon, authenticated
using (published_at is not null);

commit;
