# Supabase Skeleton

This folder is a placeholder scaffold for the future real Supabase project.

Expected long-term contents:

- `config.toml`
- `migrations/*.sql`
- optional `seed.sql`

Current status:

- present for repository structure only
- not fully initialized with `supabase init`
- safe to keep in the repository while the app still runs against local mock data

## Recommended Next Step

When you are ready to connect a real Supabase project:

1. Install the Supabase CLI locally.
2. Run `supabase init` if you want the official generated config.
3. Add real migration files under `supabase/migrations/`.
4. Link staging and production projects separately.
