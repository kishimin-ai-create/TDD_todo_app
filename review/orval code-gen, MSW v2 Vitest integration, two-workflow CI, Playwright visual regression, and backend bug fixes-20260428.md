**<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>
Return HTTP envelope from customFetch**

The generated Orval client functions are typed to return an HTTP envelope
(`{ data, status, headers }`, e.g. `postApiV1AppsResponse` in
`src/api/generated/index.ts`), but `customFetch` currently returns only
`response.json()`. That makes runtime values incompatible with the generated
contract (missing `status`/`headers` and one-level `data` mismatch), so
consumers using the generated hook types will read incorrect fields or
`undefined`. Build and return the expected envelope from `response.status`,
`response.headers`, and the parsed body (and mirror this shape for thrown
errors) so runtime matches the generated API types.

Useful? React with 👍 / 👎.

**Disposition:** Fixed — `frontend/src/api/client.ts`

`customFetch` now parses the response body for all HTTP status codes (JSON with
text fallback) and returns `{ data, status, headers }` matching the
orval-generated envelope types. The `response.ok` guard and throw were removed
because the generated types include 4xx/5xx as typed response variants, not
thrown errors. Verified with `tsc -b` (typecheck) and ESLint — both pass.
Committed in `fd613a6`.

---

**<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>
Commit visual baseline before running screenshot assertion**

This new `toHaveScreenshot('home.png')` assertion requires a checked-in baseline
image, but the commit adds the test without adding any
`frontend/e2e/__snapshots__/.../home.png` file. Because `ci-nightly.yml`
executes `npx playwright test --grep "@visual"` without `--update-snapshots`,
the nightly visual-regression job will fail continuously until the baseline
snapshot is committed.

Useful? React with 👍 / 👎.

**Disposition:** Reply only — `frontend/e2e/visual.spec.ts` +
`.github/workflows/ci-nightly.yml`

Visual baselines are platform-specific; a snapshot generated on macOS or Windows
will not match pixels rendered on ubuntu-latest (the CI runner). The correct
process is: run `npx playwright test --grep "@visual" --update-snapshots` on an
ubuntu-latest machine (or inside a Docker container matching the CI image), then
commit the generated `frontend/e2e/__snapshots__/` files. Adding
`--update-snapshots` unconditionally to the CI step is unsafe — it would
silently regenerate the baseline on every nightly run and never catch
regressions. The comment already in `ci-nightly.yml` documents the correct
one-time bootstrap flow. Action required by maintainer: generate the baseline on
Linux and commit it before the nightly run is expected to pass.

---

**<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>
Build app before running Playwright smoke tests**

In `.github/workflows/ci-pr.yml` the smoke step runs `npx playwright test`, and
the Playwright config for this repo (`frontend/playwright.config.ts`) always
starts `webServer` with `npm run preview`. Vite’s CLI docs state `vite preview`
serves the build output directory and should be preceded by `vite build`; this
workflow never runs `npm run build`, so on a clean CI runner `dist` is missing
and Playwright fails before any `@smoke` test executes.

Useful? React with 👍 / 👎.

**Disposition:** Fixed — `.github/workflows/ci-pr.yml`

A `Build frontend` step (`npm run build`) was inserted immediately before the `Install Playwright Browsers` step. Without it, `dist/` is absent on a clean CI runner and Playwright’s `webServer` (`npm run preview`) has nothing to serve, causing all tests to fail before executing. Frontend typecheck and ESLint pass. Committed in `5f2f75f`.

---

**<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>
Avoid starting preview server twice in nightly workflow**

This job pre-starts `npm run preview` and then runs Playwright, but the repo’s
Playwright config also launches its own `webServer` and sets
`reuseExistingServer` to `!process.env.CI` (false in CI). Playwright’s
documented behavior is to throw when the target URL is already occupied and
`reuseExistingServer` is false, so this prestarted server makes the Playwright
steps fail before tests run.

Useful? React with 👍 / 👎.

**Disposition:** Fixed — `.github/workflows/ci-nightly.yml`

The `Start preview server` (`npm run preview &`) and `Wait for preview server` (`wait-on`) steps were removed from `ci-nightly.yml`. `playwright.config.ts` sets `reuseExistingServer: !process.env.CI`, which evaluates to `false` in CI — Playwright throws when the target URL is already occupied. Removing the manual server start means Playwright’s `webServer` is the sole manager of the preview process. The `Build app` step is retained so `dist/` exists before `vite preview` starts. Committed in `5f2f75f`.

---

**<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>
Commit a baseline for the new visual screenshot assertion**

The new visual test asserts `toHaveScreenshot('home.png')`, but this commit does
not include any snapshot baseline files (repo-wide check of `frontend/e2e` at
this commit contains only `example.spec.ts` and `visual.spec.ts`). Playwright’s
snapshot behavior is to fail when the expected image is missing unless
`--update-snapshots` is used, so the nightly visual-regression step will fail
consistently.

Useful? React with 👍 / 👎.

**Disposition:** Reply only — `frontend/e2e/visual.spec.ts` + `.github/workflows/ci-nightly.yml`

This is a duplicate of finding 2 (lines 27–52), which was already processed. The same root cause, explanation, and required action apply: generate the baseline snapshot on ubuntu-latest (or a matching Docker image) and commit the resulting `frontend/e2e/__snapshots__/` files before the nightly run is expected to pass. No additional code change is needed here.

---

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>
Return HTTP metadata in customFetch to match generated types**

The generated Orval client types in this commit expect responses shaped with
`status` and `headers` (e.g. `postApiV1AppsResponse`), but `customFetch` returns
only `response.json()`. That creates a runtime/type contract mismatch: consumers
of generated hooks can read `result.status`/`result.headers` as typed fields but
will receive `undefined`, making response-branching logic unreliable.

Useful? React with 👍 / 👎.

**Disposition:** Reply only / already fixed — `frontend/src/api/client.ts`

This is a duplicate of finding 1 (lines 1–24). `customFetch` was already fixed in commit `fd613a6`: it now returns `{ data, status, headers }` matching the orval-generated envelope types. No further action needed.

---
