## Title

feat(frontend): orval code-gen, MSW v2 Vitest integration, two-workflow CI, Playwright visual regression, and backend bug fixes

## Summary

This PR establishes the complete frontend testing and CI infrastructure on top of the
already-merged backend API. It introduces four coherent areas of change:

1. **OpenAPI → TypeScript code generation via orval** — type-safe API client, TanStack Query
   hooks, and MSW handler stubs all generated from `docs/spec/backend/openapi-generated-pretty.json`.
2. **MSW v2 + Vitest integration** — generated handlers wired into a shared Vitest test server
   so component tests work against realistic, schema-accurate mocks without a real backend.
3. **Two-tier CI strategy** — a fast PR workflow (lint → typecheck → Vitest → Storybook →
   Playwright `@smoke`) and a nightly full workflow (all browsers + visual regression with
   `toHaveScreenshot()`), replacing the single legacy `playwright.yml`.
4. **Backend bug fixes and FixAgent process update** — four defects found in code review
   (`frontend-ci-backend-20260428.md`) are fixed, and `FixAgent.agent.md` is updated to
   mandate a Red→Green→Refactor TDD cycle for every bug fix.

## Related Tasks

- Review: `review/frontend-ci-backend-20260428.md`
- TBD (no external issue tracker IDs available)

## What was done

### 1. orval + OpenAPI code generation

- Added `frontend/orval.config.ts` pointing at `docs/spec/backend/openapi-generated-pretty.json`.
- Output configured for `split` mode:
  - **Types** → `src/api/generated/models/` (80 individual DTO files)
  - **TanStack Query hooks** → `src/api/generated/index.ts`
  - **MSW handlers** → `src/api/generated/index.msw.ts`
- Custom fetch wrapper at `frontend/src/api/client.ts`:
  - Reads `VITE_API_BASE_URL` for environment-level base URL override.
  - Throws the parsed JSON error body on non-OK responses.
  - Registered in `orval.config.ts` as the `mutator` so all generated hooks use it.

### 2. MSW v2 + Vitest integration

- `frontend/src/test/server.ts` — creates a shared MSW `setupServer` instance using
  `getTDDTodoAppAPIMock()` (the orval-generated handler factory).
- `frontend/src/test/setup.ts` — standard lifecycle hooks (`beforeAll`, `afterEach`,
  `afterAll`) that start, reset, and stop the server; also imports
  `@testing-library/jest-dom/vitest` for extended matchers.
- `frontend/vite.config.ts` — registers `src/test/setup.ts` as a Vitest setup file,
  sets `environment: "jsdom"`, and configures the dev server proxy (`/api →
  http://localhost:3000`).

### 3. CI two-workflow strategy

**`ci-pr.yml`** (triggers on `push` to `main`/`develop` and all PRs):
- Lint (`npm run lint`)
- TypeScript typecheck (`npm run typecheck`)
- Vitest unit & integration tests (`npm run test`)
- Storybook build sanity check (`npm run build-storybook`)
- Playwright `@smoke` tests on Chromium only (`npx playwright test --grep "@smoke"
  --project=chromium`)
- Playwright report uploaded as an artifact (7-day retention)

**`ci-nightly.yml`** (triggers on schedule `0 18 * * *` UTC ≈ JST 03:00 + `workflow_dispatch`):
- Production build + `vite preview` server on port 4173
- Playwright full suite on all three browsers, excluding `@visual`
  (`--grep-invert "@visual"`)
- Storybook build sanity check
- Visual regression step: `npx playwright test --grep "@visual" --project=chromium`
  with `PLAYWRIGHT_BASE_URL=http://localhost:4173`
- Playwright report (30-day) and snapshot diffs artifact on failure

**Removed:** `.github/workflows/playwright.yml` (legacy single-job Playwright workflow).

### 4. Playwright visual regression

- `frontend/e2e/visual.spec.ts` — `@visual`-tagged describe block with a single
  "home page" test that navigates to `/`, waits for `networkidle`, and asserts
  `toHaveScreenshot('home.png', { fullPage: true })`.
- `frontend/playwright.config.ts` — added `expect.toHaveScreenshot` config:
  `maxDiffPixelRatio: 0.01`, `animations: 'disabled'`; `baseURL` reads
  `PLAYWRIGHT_BASE_URL` env var (fallback `http://localhost:4173`).
- Snapshots committed under `e2e/__snapshots__/`; updated with
  `npx playwright test --update-snapshots`.

### 5. Backend bug fixes (from `review/frontend-ci-backend-20260428.md`)

| # | File | Fix |
|---|------|-----|
| P1 | `backend/src/infrastructure/mysql-app-repository.ts` | Replaced non-atomic SELECT + INSERT/UPDATE in `save()` with a single `INSERT … ON DUPLICATE KEY UPDATE` to eliminate the concurrent-insert race condition. Matches the pattern already used in `mysql-todo-repository.ts`. |
| P2 | `.github/workflows/ci-nightly.yml` | Added `--grep-invert "@visual"` to the full Playwright run step so visual tests are no longer executed twice per nightly run. |
| P3 | `backend/src/controllers/http-presenter.ts` | Added explicit exported `AppDto` and `TodoDto` types; annotated `presentApp` and `presentTodo` with explicit return types to enforce the public API contract. |
| P4 | `backend/src/tests/integrations/infrastructure/hono-app.test.ts` | Renamed misleading test title `'PUT with no body falls back to empty body (returns 422 for missing name)'` → `'PUT with no body is accepted as no-op update (200)'`. |
| P5 | `.github/workflows/ci-pr.yml` + `frontend/e2e/example.spec.ts` | Removed `--pass-with-no-tests` from the `@smoke` step; added `@smoke` tag to the existing `'has title'` test so the step always has at least one test and will fail explicitly if all smoke tags are accidentally removed. |

### 6. FixAgent TDD cycle mandate

- `.github/agents/FixAgent.agent.md` — added a mandatory **Bug Fix TDD Cycle** section
  (Red → Verify Red → Green → Verify Green → optional Refactor → Verify → Commit).
  All bug fixes must now follow this cycle; skipping steps is prohibited.

## What is not included

- **Frontend UI components** — no React page or component implementation is included;
  the generated hooks and MSW mocks provide the API contract but there are no consumers yet.
- **`schemas.ts` Zod runtime validation unification** — the dual-definition issue
  (`request-validation.ts` + `schemas.ts`) identified in code review is tracked as a
  separate task; it requires mapping Zod error shapes to `AppError('VALIDATION_ERROR')`
  across all callers before it can be merged safely.
- **Mobile and branded browser Playwright projects** — configuration stubs are present
  but commented out; not activated in this PR.
- **GitHub Secrets / environment configuration** — `VITE_API_BASE_URL` and
  `PLAYWRIGHT_BASE_URL` are environment variables; no secret values are committed.
- **Storybook stories** for new components (none added yet).
- **Visual regression baseline snapshots for non-home pages** — only the home page
  snapshot is set up.

## Impact

| Area | Impact |
|------|--------|
| Frontend API layer | All HTTP calls now go through orval-generated type-safe hooks backed by `customFetch`; drift between API types and implementation is caught at `npm run typecheck`. |
| Frontend tests | Vitest tests gain realistic schema-accurate MSW mocks automatically regenerated when the OpenAPI spec changes. |
| CI (all PRs) | PRs now run lint + typecheck + Vitest + Storybook + Playwright `@smoke` (Chromium); build time target ≤ 15 min. |
| CI (nightly) | Full cross-browser Playwright + visual regression runs independently; failures upload diff artifacts for immediate inspection. |
| Backend | `save()` in `mysql-app-repository.ts` is now concurrency-safe; `http-presenter.ts` public types are explicit. |
| Agent process | All future bug fixes via FixAgent must follow the Red→Green→Refactor TDD cycle. |

## Testing

- **Vitest** — `npm run test` (from `frontend/`); setup file configures MSW server lifecycle.
- **Storybook** — `npm run build-storybook` confirms no broken story imports.
- **Playwright smoke** — `npx playwright test --grep "@smoke" --project=chromium` (at least
  one test always present in `e2e/example.spec.ts`).
- **Playwright visual** — `npx playwright test --grep "@visual" --project=chromium`
  against a running `vite preview` server; baseline snapshots committed.
- **Backend** — all 387 backend integration tests pass after the four bug fixes
  (confirmed in `review/frontend-ci-backend-20260428.md` disposition notes).
- **TypeScript** — `npm run typecheck` passes for both frontend and backend.
- **Lint** — `npm run lint` passes for frontend.

## Notes

- The orval-generated files under `frontend/src/api/generated/` are committed to the
  repository (not `.gitignore`d) so consumers can import types without running codegen
  locally. Re-run `npx orval` after any OpenAPI spec update.
- Visual regression baselines must be regenerated with `npx playwright test
  --update-snapshots` whenever intentional UI changes are made; commit the updated
  snapshots in the same PR as the UI change.
- The nightly workflow can be triggered manually via `workflow_dispatch` to refresh
  baselines or debug flaky tests without waiting for the 03:00 JST schedule.
- The legacy `playwright.yml` is deleted; no external status checks should reference it.
