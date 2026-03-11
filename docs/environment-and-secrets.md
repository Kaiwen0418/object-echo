# Environment And Secrets

## Local `.env`

Copy `.env.example` to `.env.local` and fill in values as services become available.

Current application variables:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- optional `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `R2_PUBLIC_BASE_URL`

For the current mock-first phase, the app can still run without these values.

## OAuth Provider Setup

The current app implementation supports:

- GitHub
- Google

The current app intentionally does not wire Apple yet.

### Common Supabase Auth Setup

In the Supabase dashboard:

1. Enable GitHub and Google providers.
2. Add your app callback URL to the redirect allow list.
3. Use the application callback route:
   - local: `http://localhost:3000/auth/callback`
   - preview: `https://<your-preview-domain>/auth/callback`
   - production: `https://<your-domain>/auth/callback`

### GitHub

Create a GitHub OAuth App and set:

- Homepage URL: your app URL
- Authorization callback URL: the Supabase callback URL shown in the GitHub provider settings

GitHub OAuth App setup is the main prerequisite here. No paid developer program is required.

### Google

Create a Google Cloud OAuth client and configure:

- consent / branding
- authorized redirect URI: the Supabase callback URL shown in the Google provider settings

Google is usually the second provider to enable after GitHub.

## Vercel Project Variables

Set these in Vercel:

### Preview

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `R2_PUBLIC_BASE_URL`

Recommended target:

- Preview Vercel environment -> staging Supabase + non-production R2 bucket

### Production

Set the same keys, but point them to production services.

Recommended target:

- Production Vercel environment -> production Supabase + production R2 bucket

## GitHub Actions Secrets

The CI workflow does not need extra secrets.

The Supabase migration workflows expect:

- `SUPABASE_ACCESS_TOKEN`
- `STAGING_PROJECT_ID`
- `STAGING_DB_PASSWORD`
- `PRODUCTION_PROJECT_ID`
- `PRODUCTION_DB_PASSWORD`

Recommended placement:

- repository-level secret: `SUPABASE_ACCESS_TOKEN`
- staging environment secrets: `STAGING_PROJECT_ID`, `STAGING_DB_PASSWORD`
- production environment secrets: `PRODUCTION_PROJECT_ID`, `PRODUCTION_DB_PASSWORD`

## GitHub Environments

Create these GitHub Environments:

- `staging`
- `production`

Recommended protections:

- `staging`: optional reviewers
- `production`: required reviewer or maintainer approval

## Configuration Checklist

Before enabling real Supabase migrations:

1. Create staging and production Supabase projects.
2. Create GitHub environment secrets.
3. Initialize Supabase locally with the CLI.
4. Replace placeholder SQL/migrations with real migration files.
5. Verify `develop` pushes only affect staging.
6. Verify `main` pushes only affect production.

## Safety Notes

- Never expose `SUPABASE_SERVICE_ROLE_KEY` to client components.
- Never use production database credentials in Preview Vercel environments.
- Do not edit staging or production schema manually once migrations are adopted.
