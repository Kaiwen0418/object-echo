# Testing Guide

## Purpose

This repository uses unit tests to lock down API and dashboard interaction behavior without needing a live browser session or a real Supabase backend.

The current suite is designed to catch regressions in:

- API request parsing
- response status and payload shape
- dashboard server action validation
- handoff between route/action layers and service utilities
- remote-backed service integration against a dedicated Supabase test project

## Current Stack

- Runner: `vitest`
- Config: [vitest.config.ts](../vitest.config.ts)
- Entry command: `pnpm test:unit`
- Remote integration command: `pnpm test:integration`
- Test root: `tests/`

## Current Coverage

### API routes

Located under `tests/api/`.

Covered handlers include:

- `app/api/projects/route.ts`
- `app/api/projects/[projectId]/route.ts`
- `app/api/devices/search-models/route.ts`
- `app/api/devices/match-specs/route.ts`
- `app/api/upload/storage-sign/route.ts`

The goal for route tests is to verify:

- request parsing
- dependency calls
- success payloads
- error branches such as `400`, `401`, `404`, and `500`

### Dashboard server actions

Located under `tests/actions/`.

Covered handlers include:

- `app/dashboard/new/actions.ts`
- `app/dashboard/[projectId]/(workspace)/assets/actions.ts`
- `app/dashboard/[projectId]/(workspace)/devices/actions.ts`

The goal for action tests is to verify:

- form-data parsing
- local validation
- normalization of payloads before persistence
- mapping of service-layer failures into UI-friendly state

### Remote integration tests

Located under `tests/integration/`.

These tests are opt-in and connect to a real remote Supabase test environment. The current integration coverage focuses on `lib/utils/project.ts` with:

- real project creation
- real asset persistence
- real device persistence
- bundle hydration via `getProjectById`

These tests are skipped by default unless the remote integration environment is explicitly enabled.

## Running Tests

Run all unit tests:

```bash
pnpm test:unit
```

Run remote integration tests:

```bash
pnpm test:integration
```

Run a single file:

```bash
pnpm test:unit -- tests/api/storage-sign-route.test.ts
```

Run files matching a pattern:

```bash
pnpm test:unit -- --grep storage-sign
```

## Design Principles

### 1. Test the public boundary

Prefer testing exported route handlers and exported server actions directly.

Good:

- call `GET()` / `POST()` on route modules
- call `saveAssetsAction()` with `FormData`

Avoid:

- testing internal implementation details unless extraction makes them reusable

### 2. Mock service dependencies, not the unit under test

Route and action tests should mock downstream dependencies such as:

- `@/lib/utils/project`
- `@/lib/storage/signing`
- `@/lib/supabase/server`
- `@/lib/sketchfab/client`

This keeps tests deterministic and fast.

### 3. Assert shape and behavior together

A good test should verify both:

- the returned status/payload
- the dependency call contract

Example:

- `storage-sign` should return `401` when unauthenticated
- and should not attempt to create a signed upload

### 4. Prefer narrow fixtures

Only include the fields needed by the scenario. Large test fixtures make failures harder to read and easier to break accidentally.

## Adding New Tests

When adding a new API route or server action:

1. Add a matching `*.test.ts` file under `tests/api/` or `tests/actions/`
2. Cover at least one success path
3. Cover the most important validation or failure path
4. Mock downstream services instead of relying on real Supabase or network calls
5. Run `pnpm test:unit`
6. Run `pnpm typecheck` if the test introduces new shared types or utilities

## Remote Integration Setup

Remote integration tests are intentionally disabled by default. To enable them, set:

- `RUN_REMOTE_INTEGRATION=true`
- `INTEGRATION_SUPABASE_TEST_EMAIL`
- `INTEGRATION_SUPABASE_TEST_PASSWORD`

By default, the integration helper will reuse your normal app Supabase config:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

These optional overrides are only needed if you want the integration suite to point at a different remote project:

- `INTEGRATION_SUPABASE_URL`
- `INTEGRATION_SUPABASE_ANON_KEY`
- `INTEGRATION_SUPABASE_SERVICE_ROLE_KEY`

Important constraints:

- Use a dedicated Supabase test project only
- Use a dedicated test user only
- Never point these variables at staging or production
- The integration suite performs real inserts and deletes

The helper entrypoint for this setup is [tests/integration/helpers/remote-supabase.ts](../tests/integration/helpers/remote-supabase.ts).

Recommended setup:

1. Keep your normal Supabase app variables in `.env.local`
2. Create `.env.test.local` from [.env.test.example](../.env.test.example)
3. Only add:
   - `RUN_REMOTE_INTEGRATION=true`
   - `INTEGRATION_SUPABASE_TEST_EMAIL`
   - `INTEGRATION_SUPABASE_TEST_PASSWORD`

This keeps the integration suite aligned with the same remote Supabase project your local app already uses.

## What Is Not Covered Yet

These areas still need additional testing:

- component interaction tests for dashboard forms
- upload failure UI states in `AssetsEditor`
- museum fallback rendering UI
- end-to-end flows across auth, project creation, asset upload, and preview

## Recommended Next Layers

If you continue expanding coverage, the recommended order is:

1. Service-layer tests for `lib/utils/project.ts`
2. Component tests for dashboard forms and upload interactions
3. Playwright end-to-end tests for critical user flows

## Notes

- Unit tests in this repo are intentionally independent from real Supabase state.
- If a test starts requiring a real backend, it likely belongs in an integration or end-to-end suite instead.
