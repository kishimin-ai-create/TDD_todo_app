## Review Target

Recent frontend commits (`origin/frontend..HEAD`, i.e. `f48c59b`–`3bec1d0`) covering:
- `.github/workflows/ci-pr.yml`
- `.github/workflows/ci-nightly.yml`
- `frontend/e2e/visual.spec.ts`
- `frontend/playwright.config.ts`

Full backend source under `backend/src/` (all layers: models, repositories, services, controllers, infrastructure, tests).

## Summary

The reg-suit → Playwright `toHaveScreenshot` migration is clean and the backend architecture is well-structured (Clean Architecture layers are respected, all SQL uses parameterised queries, errors are wrapped at the boundary). Four issues need attention:

1. `mysql-app-repository.ts` uses a non-atomic SELECT + INSERT/UPDATE pair, creating a race condition absent in the todo repository which already uses `ON DUPLICATE KEY UPDATE`.
2. The nightly CI runs visual tests twice — once in the full `npx playwright test` run and a second time in the dedicated `@visual` step.
3. Two parallel validation definitions (`request-validation.ts` and `schemas.ts`) can silently drift.
4. One test title in `hono-app.test.ts` contradicts its assertion, making CI output misleading.

---

**<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>
`mysql-app-repository.ts` — non-atomic save creates a race condition**

`save()` performs a SELECT to check existence and then branches to INSERT or UPDATE:

```ts
// mysql-app-repository.ts  save()
const [rows] = await pool.execute<ExistsRow[]>(
  'SELECT EXISTS(SELECT 1 FROM App WHERE id = ?) AS `exists`',
  [app.id],
);
if (rows[0].exists === 1) {
  await pool.execute('UPDATE App SET ...', [...]);
} else {
  await pool.execute('INSERT INTO App (...) VALUES (...)', [...]);
}
```

Under concurrent requests two calls that both see `exists = 0` will both attempt an INSERT.  
The second INSERT will throw a duplicate-key error, which is caught and re-thrown as `AppError('REPOSITORY_ERROR', ...)` — returning HTTP 500 to the client instead of the correct semantic response.

By contrast, `mysql-todo-repository.ts` already uses the correct atomic upsert:

```sql
INSERT INTO Todo (...) VALUES (...)
ON DUPLICATE KEY UPDATE title = VALUES(title), ...
```

**Fix:** Replace the two-step pattern with `INSERT INTO App (...) VALUES (?) ON DUPLICATE KEY UPDATE name = VALUES(name), updatedAt = VALUES(updatedAt), deletedAt = VALUES(deletedAt)`.

Useful? React with 👍 / 👎.

**Disposition:** Fixed — `backend/src/infrastructure/mysql-app-repository.ts`

Fixed. Replaced the two-step SELECT + INSERT/UPDATE pattern in `save()` with a single atomic `INSERT INTO App (...) VALUES (?) ON DUPLICATE KEY UPDATE name = VALUES(name), updatedAt = VALUES(updatedAt), deletedAt = VALUES(deletedAt)`, matching the pattern already used in `mysql-todo-repository.ts`. The `ExistsRow` type is retained as it is still referenced by `existsActiveByName`. All 387 backend tests pass.

---

The nightly workflow first runs the entire Playwright suite (which includes `@visual` tests) and then runs the `@visual` subset a second time:

```yaml
# Step 1 – runs ALL tests, including @visual
- name: Run Playwright (full suite, all browsers)
  run: npx playwright test

# Step 2 – runs @visual again, redundantly
- name: Run visual regression tests
  run: npx playwright test --grep "@visual" --project=chromium
```

This wastes CI time and doubles screenshot comparisons on each nightly run. It can also produce confusing artifacts when the full run passes but the second run fails (e.g. due to a flaky animation).

**Fix:** Either exclude `@visual` from the full run (`npx playwright test --grep-invert "@visual"`) or remove the dedicated visual step and rely on the full run.

Useful? React with 👍 / 👎.

**Disposition:** Fixed — `.github/workflows/ci-nightly.yml`

Fixed. Added `--grep-invert "@visual"` to the full Playwright run step in `ci-nightly.yml` so it now reads `npx playwright test --grep-invert "@visual"`. The dedicated `@visual` step remains unchanged, ensuring visual regression tests still run exactly once per nightly with the correct Chromium-only configuration.

---

Runtime validation is handled by hand-written guards in `request-validation.ts` (e.g. `validateName`, `validateTitle`). Separately, `schemas.ts` defines Zod schemas (`CreateAppRequestSchema`, `UpdateAppRequestSchema`, etc.) for OpenAPI documentation.

Both define the same constraints (`name`: 1–100 chars, `title`: 1–200 chars). If either side is updated without updating the other (e.g. raising the title max-length to 500), the API will behave differently from what the OpenAPI doc advertises. There are no tests that assert the two definitions agree.

**Fix:** Use the Zod schemas in `request-validation.ts` for runtime validation (`schema.parse(body)`) and derive the OpenAPI inline schema from them via `resolver()`. This eliminates duplication entirely.

Useful? React with 👍 / 👎.

**Disposition:** Reply-only — architectural decision, planned refactor

The concern is valid — `schemas.ts` (Zod, used for OpenAPI/documentation) and `request-validation.ts` (hand-written guards, used at runtime) currently duplicate the same constraints. Merging them via `schema.parse()` in `request-validation.ts` is the correct long-term direction, but it would require threading the Zod dependency into the controller validation layer, updating every parse function, and verifying that Zod's error shape maps correctly to `AppError('VALIDATION_ERROR', ...)` for all callers. This is a meaningful refactor that touches both layers and carries risk of changing error message text visible in API responses. It will be tracked as a separate task to ensure proper test coverage of the new error mapping before merging.

---

```ts
// hono-app.test.ts  line 95-103
it('PUT with no body falls back to empty body (returns 422 for missing name)', async () => {
  ...
  expect(res.status).toBe(200);   // ← asserts 200, not 422
});
```

The test description promises a `422` but the assertion expects `200`. This is correct behavior (the `name` field is optional on updates), but the misleading title will confuse anyone reading CI output or debugging a future regression.

**Fix:** Rename the test to something like `'PUT with no body is accepted as no-op update (200)'`.

Useful? React with 👍 / 👎.

**Disposition:** Fixed — `backend/src/tests/integrations/infrastructure/hono-app.test.ts`

Fixed. Renamed the test at line 95 of `hono-app.test.ts` from `'PUT with no body falls back to empty body (returns 422 for missing name)'` to `'PUT with no body is accepted as no-op update (200)'`. The title now accurately reflects that `name` is optional on updates and the expected status is 200. All 387 backend tests pass.

---

Both presenter functions infer their return type:

```ts
export function presentApp(app: AppEntity) { ... }   // return type inferred
export function presentTodo(todo: TodoEntity) { ... } // return type inferred
```

Per the TypeScript rules for this project, all public functions must have explicit return types. Without them, accidental property additions to the returned object silently change the public API contract.

**Fix:** Add explicit return types (either inline objects or dedicated DTO types):

```ts
export type AppDto = { id: string; name: string; createdAt: string; updatedAt: string };
export function presentApp(app: AppEntity): AppDto { ... }
```

Useful? React with 👍 / 👎.

**Disposition:** Fixed — `backend/src/controllers/http-presenter.ts`

Fixed. Added exported `AppDto` and `TodoDto` types to `http-presenter.ts` and annotated `presentApp(app: AppEntity): AppDto` and `presentTodo(todo: TodoEntity): TodoDto` with explicit return types. TypeScript typecheck and all 387 backend tests pass.

---

```yaml
run: npx playwright test --grep "@smoke" --pass-with-no-tests --project=chromium
```

If all `@smoke` tags are accidentally removed from test files (or the tag is renamed), this step passes silently and no smoke test is ever run on a PR. The flag trades a clear CI failure for silent coverage erosion.

**Fix:** Remove `--pass-with-no-tests`. Add at least one `@smoke`-tagged test (e.g. in `frontend/e2e/example.spec.ts`) so the flag is no longer needed. If the intent is to make smoke tests optional, document that decision explicitly in a comment.

Useful? React with 👍 / 👎.

**Disposition:** Fixed — `.github/workflows/ci-pr.yml` and `frontend/e2e/example.spec.ts`

Fixed. Removed `--pass-with-no-tests` from the smoke test step in `ci-pr.yml`. Added `@smoke` to the title of the `'has title'` test in `frontend/e2e/example.spec.ts` so at least one smoke-tagged test is always present. The PR CI will now fail explicitly if all `@smoke` tags are inadvertently removed. Frontend typecheck and lint pass.

