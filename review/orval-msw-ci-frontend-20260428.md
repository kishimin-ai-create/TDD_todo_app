## Review Target

Frontend branch — orval code generation, MSW v2 + Vitest integration, CI workflows, and Playwright visual regression.

Reviewed files:
- `frontend/orval.config.ts`
- `frontend/src/api/client.ts`
- `frontend/src/api/generated/` (all 75 generated files)
- `frontend/src/test/server.ts`
- `frontend/src/test/setup.ts`
- `frontend/vite.config.ts`
- `.github/workflows/ci-pr.yml`
- `.github/workflows/ci-nightly.yml`
- `frontend/e2e/visual.spec.ts`
- `frontend/playwright.config.ts`

## Summary

The overall orval + MSW v2 + Vitest wiring is sound: the custom fetch wrapper, server setup, and lifecycle hooks are all connected correctly. Two P1 issues need attention before this setup can be relied upon: `customFetch` silently swallows non-JSON error responses (losing HTTP status information), and the nightly visual-regression CI step has no mechanism to bootstrap baseline snapshots, so it will always fail on a fresh clone. Two P2 issues compound the CI reliability: generated files are committed without a CI regeneration check (spec drift goes undetected), and the PR smoke Playwright step matches zero tests and provides no gate. The MSW `onUnhandledRequest: 'warn'` setting is also worth tightening.

---

**<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>
`customFetch`: non-JSON error body swallows HTTP status, throwing an unrelated SyntaxError**

In `frontend/src/api/client.ts`:

```ts
if (!response.ok) {
  throw (await response.json()) as unknown;  // ← throws SyntaxError when body is not JSON
}
```

When the server (or any proxy in front of it) returns a non-JSON error — e.g., a `504 Gateway Timeout` HTML page, a `502 Bad Gateway` from nginx, or any plain-text response — `response.json()` throws a `SyntaxError`. The caller receives a cryptic parse error with no HTTP status code or URL context; the actual failure is hidden.

Fix: read the body safely and always include the status code in the thrown error:

```ts
if (!response.ok) {
  let body: unknown;
  try { body = await response.json(); } catch { body = await response.text(); }
  throw Object.assign(new Error(`HTTP ${response.status}`), { status: response.status, body });
}
```

Useful? React with 👍 / 👎.

---

**<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>
Nightly CI visual regression step always fails on a fresh clone — no snapshot bootstrap mechanism**

In `.github/workflows/ci-nightly.yml` the comment reads:

> スナップショットが存在しない初回は --update-snapshots で生成し、コミット・プッシュする

But the actual step is:

```yaml
- name: Run visual regression tests
  run: npx playwright test --grep "@visual" --project=chromium
```

There is no `--update-snapshots` flag and no subsequent commit/push step. On a fresh clone (or after any snapshot reset) Playwright will compare screenshots against non-existent baselines and fail immediately. The nightly pipeline is broken for any contributor who clones the repo without pre-existing snapshots.

Fix: either (a) commit the initial baseline snapshots to git alongside the test, or (b) add a conditional bootstrap step that runs `--update-snapshots` when no snapshot files exist and auto-commits the result via `git-auto-commit-action` or equivalent.

Useful? React with 👍 / 👎.

---

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>
75 generated files committed to git with no CI regeneration check — spec drift is undetected**

`git ls-files frontend/src/api/generated/` lists 75 files, all tracked. Neither `ci-pr.yml` nor `ci-nightly.yml` runs `npm run generate` (which invokes orval). The `.gitignore` does not exclude `src/api/generated/`.

This means: if `docs/spec/backend/openapi-generated-pretty.json` is updated without re-running orval, the committed TypeScript client silently drifts out of sync with the actual API. TypeScript will not catch this because types match the stale generated code, not the updated spec.

Fix: add a `npm run generate` step to CI (before `typecheck`) and verify that the working tree is clean afterwards. Then add `src/api/generated/` to `.gitignore` so generated code is never committed — it is an artifact of the build, not source.

Useful? React with 👍 / 👎.

---

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>
`ci-pr.yml` Playwright smoke step always runs zero tests — no `@smoke` tests exist**

```yaml
- name: Run Playwright smoke tests
  run: npx playwright test --grep "@smoke" --project=chromium
```

The only e2e test file is `frontend/e2e/visual.spec.ts`, which is tagged `@visual`. There are no `@smoke` tags anywhere. Playwright exits with code 0 and reports "0 tests run", so this step always passes vacuously. Every PR CI run skips Playwright coverage entirely.

Fix: either add `@smoke` tags to appropriate e2e tests, or change the grep to a tag that actually exists (e.g., remove the `--grep` filter until smoke tests are defined). Passing a CI step that runs nothing gives false confidence.

Useful? React with 👍 / 👎.

---

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>
`onUnhandledRequest: 'warn'` allows tests to pass silently when an API call has no matching handler**

In `frontend/src/test/setup.ts`:

```ts
server.listen({ onUnhandledRequest: 'warn' });
```

With `'warn'`, if a component under test calls an endpoint that has no MSW handler (e.g., a newly added hook not yet covered), the request is logged as a warning but the test continues. The unmatched fetch will typically throw a network error inside jsdom, but the test may still pass depending on how the error is handled in the component. The warning is easily missed in CI output.

Fix: change to `'error'` to make any unhandled request a hard test failure. This immediately surfaces missing handler coverage:

```ts
server.listen({ onUnhandledRequest: 'error' });
```

Useful? React with 👍 / 👎.

---

**<sub><sub>![P3 Badge](https://img.shields.io/badge/P3-blue?style=flat)</sub></sub>
`@testing-library/jest-dom` used in `setup.ts` but not declared in `package.json` devDependencies**

`frontend/src/test/setup.ts` imports:

```ts
import '@testing-library/jest-dom/vitest';
```

But `@testing-library/jest-dom` does not appear in `package.json`'s `devDependencies`. It is currently available as a transitive dependency (pulled in by another package), so tests pass today. If the parent package drops or updates that dependency, this import will break without any warning at install time.

Fix: explicitly add `@testing-library/jest-dom` to `devDependencies`:

```bash
npm install -D @testing-library/jest-dom
```

Useful? React with 👍 / 👎.

---

**<sub><sub>![P3 Badge](https://img.shields.io/badge/P3-blue?style=flat)</sub></sub>
`playwright.config.ts` `webServer` is commented out — local e2e runs require manual server start**

```ts
// webServer: {
//   command: 'npm run preview',
//   url: 'http://localhost:4173',
//   reuseExistingServer: !process.env.CI,
// },
```

Without this, running `npx playwright test` locally requires the developer to manually start `npm run preview` first (and have already run `npm run build`). There is no error if the server is not running — Playwright will just report every test as failed with a connection refused error, which is not immediately obvious.

The commented-out config is correct. Uncommenting it (with `reuseExistingServer: !process.env.CI`) would make local runs self-contained and match the CI setup where the server is explicitly started before Playwright runs.

Useful? React with 👍 / 👎.
