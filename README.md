# Object Echo

Object Echo is a `Next.js App Router + TypeScript + pnpm` project for building personal collection museum pages. The current phase focuses on a reusable Three.js presentation layer, dashboard/page scaffolds, and local mock data that matches the intended backend shape.

## Local Development

Install dependencies:

```bash
pnpm install
```

Start the app:

```bash
pnpm dev
```

Useful commands:

```bash
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm test:integration
pnpm build
pnpm start
```

The default local URL is `http://localhost:3000`.

## Current Stack

- Next.js App Router
- TypeScript
- pnpm
- Three.js
- Supabase placeholder integration
- Supabase Storage placeholder integration

## Important Paths

- `app/`: routes and API routes
- `components/`: presentational UI
- `features/museum/`: reusable museum rendering layer
- `data/demo/`: stable mock data used by preview and public museum pages
- `lib/supabase/`: Supabase placeholders and future integration points
- `lib/storage/`: storage placeholders and future Supabase Storage helpers
- `.github/workflows/`: CI and Supabase promotion workflows
- `docs/`: deployment, branch rules, and environment setup notes
- `tests/`: unit tests for API routes and dashboard server actions

Current mock upload route:

- `/api/upload/storage-sign`

## Testing

The repo now includes a `vitest`-based unit test suite for:

- API route handlers in `app/api/`
- dashboard server actions in `app/dashboard/**/actions.ts`

Run the full unit suite with:

```bash
pnpm test:unit
```

Run the remote-backed integration suite with:

```bash
pnpm test:integration
```

Testing conventions and extension guidance live in [docs/testing.md](./docs/testing.md).

## Deployment Docs

- [Deployment and branch rules](./docs/deployment-and-branches.md)
- [Environment and secrets checklist](./docs/environment-and-secrets.md)
- [Testing guide](./docs/testing.md)

## Branch Model

- `main`: production
- `develop`: integration
- `feature/*`: new work from `develop`
- `fix/*`: non-urgent fixes back into `develop`
- `hotfix/*`: urgent production fixes from `main`

Read the detailed policy in [docs/deployment-and-branches.md](./docs/deployment-and-branches.md).

## Supabase Status

The repository now includes a `supabase/` skeleton, but the integration is still placeholder-level.

- Database schema is not connected yet
- Auth is not connected yet
- Supabase Storage uploads are still mocked
- Sketchfab search is still mocked

## Notes

- The old `three-reference/` directory is only a reference source and can be removed once you no longer need it.
- The public museum page and dashboard preview page share the same Three.js rendering module.
