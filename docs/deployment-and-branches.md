# Deployment And Branches

## Recommended Deployment

This repository should use:

- Vercel for the Next.js application
- Supabase for auth and database
- Supabase Storage for object storage
- GitHub Actions for CI and Supabase migration delivery

The recommended production flow is:

1. Connect the GitHub repository to Vercel.
2. Let Vercel deploy Preview environments for pull requests and branch pushes.
3. Let `main` deploy the Production app in Vercel.
4. Let GitHub Actions run lint, typecheck, and build on pull requests.
5. Let GitHub Actions push Supabase migrations from `develop` to staging and from `main` to production.

This keeps application deployment simple and keeps database promotion explicit.

## Environment Variables

The app code currently reads these variables:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`

GitHub Actions also expects these repository or environment secrets:

- `SUPABASE_ACCESS_TOKEN`
- `STAGING_PROJECT_ID`
- `STAGING_DB_PASSWORD`
- `PRODUCTION_PROJECT_ID`
- `PRODUCTION_DB_PASSWORD`

Use `.env.example` as the local template.

## Vercel Setup

Create one Vercel project for this repository.

- Production branch: `main`
- Preview branches: all other branches
- Root directory: repository root
- Framework preset: Next.js

Recommended Vercel environments:

- Development: local only or optional shared dev values
- Preview: staging Supabase project and staging storage bucket
- Production: production Supabase project and production storage bucket

Do not expose `SUPABASE_SERVICE_ROLE_KEY` to client code. It is server-only.

## Supabase Setup

Create two Supabase projects:

- Staging
- Production

Branch mapping:

- `develop` -> staging database migrations
- `main` -> production database migrations

Store schema changes in `supabase/migrations`.

When the Supabase project is initialized, add:

- `supabase/config.toml`
- `supabase/migrations/*`
- optional `supabase/seed.sql`

The workflow files already assume this layout.

## Branch Rules

Use these branch types:

- `main`: production-ready code only
- `develop`: integration branch for upcoming release work
- `feature/<short-name>`: normal feature work
- `fix/<short-name>`: non-urgent fixes targeting `develop`
- `hotfix/<short-name>`: urgent production fixes targeting `main`

Expected flow:

1. Create `feature/*` from `develop`.
2. Open a pull request back into `develop`.
3. Let Preview deploys validate UI and routing changes.
4. Merge `develop` into `main` for production releases.
5. Create `hotfix/*` from `main` only when production needs an urgent fix.
6. After a hotfix lands in `main`, merge or cherry-pick it back into `develop`.

## Pull Request Rules

Every PR should satisfy:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`

If the PR changes database schema:

- include the migration file
- do not hand-edit staging or production directly
- validate the migration against staging before promoting to `main`

## Release Rules

Use this release policy:

1. Merge validated work into `develop`.
2. Verify staging app behavior through Vercel Preview or a shared staging URL.
3. Promote `develop` to `main` with a dedicated release PR.
4. Let Vercel deploy production from `main`.
5. Let `supabase-production.yml` push production migrations from `main`.

Avoid direct pushes to `main`.

## Notes For This Repository

- Supabase database, auth, and storage integrations are still partially placeholders in code.
- The current workflows are ready for CI immediately.
- The Supabase workflows become active once the `supabase/` directory is added.
- The app can run locally without full Supabase configuration because the code uses mock fallbacks.
