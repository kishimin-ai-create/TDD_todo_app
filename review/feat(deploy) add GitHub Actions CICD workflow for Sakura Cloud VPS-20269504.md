**<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>
Parse coverage metrics from the correct JSON structure**

`extractMetrics` expects a top-level `total` object, but Vitest/Istanbul
`coverage-final.json` is a file-coverage map and does not provide
`coverage.total`. As a result, every metric falls back to `0`, which makes the
generated dashboard report 0% coverage even when tests are actually covering
code (the committed `docs/coverage/index.html` already shows this failure mode).
This breaks the core purpose of the coverage dashboard and can mislead
merge/deploy decisions.

Useful? React with 👍 / 👎.

**Disposition: fixed** — `extractMetrics` in
`scripts/generate-coverage-report.js` has been rewritten to aggregate over the
file-coverage map format that Vitest/Istanbul actually produces. For each file
entry the function now iterates `s` (statements), `b` (branches — each value is
`[taken, not_taken]`), and `f` (functions), tallying covered/total counts and
computing `pct = Math.round((covered / total) * 100)`. The fallback to
`coverage.total` has been removed entirely. Committed in
`fix(coverage): parse coverage-final.json file-map and fix report href depth`.

---

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>
Correct relative links to detailed coverage reports**

The generated links use `../frontend/...` and `../backend/...` from
`docs/coverage/index.html`, which resolves under `docs/` (for example,
`docs/frontend/...`) instead of the repository root paths where reports are
generated. This makes the "View Report" links non-functional when opening the
dashboard, so users cannot reach the detailed coverage pages.

Useful? React with 👍 / 👎.

**Disposition: fixed** — All three `href` values in `generateHTML` have been
updated from `../X/` to `../../X/`. Since `docs/coverage/index.html` is two
levels deep relative to the repo root, the correct paths are
`../../frontend/coverage/index.html` and
`../../backend/coverage/unit/index.html`. The "View Report" links now resolve to
the correct repo-root coverage directories. Same commit as above.

---

> @copilot+claude-sonnet-4.6

The Backend CI and Test Coverage workflows were both failing with
`npm error Missing: esbuild@0.28.0 from lock file`.

Root cause: `vitest`'s bundled `vite` has a peer dependency on
`esbuild ^0.27.0 || ^0.28.0`. The CI runner's npm resolves this to
esbuild@0.28.0, but that entry was missing from the committed
`backend/package-lock.json`.

Fixed in commit `737273a` by running `npm install` in `backend/` to regenerate
the lock file with the missing `node_modules/vitest/node_modules/esbuild@0.28.0`
entry.

**<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>
Load .env when running production migrations**

`Run database migrations` executes `node dist/infrastructure/migrate.mjs`
without loading the backend `.env`, but `migrate.ts` reads DB connection
settings from `process.env` and falls back to local defaults. On a typical VPS
where credentials are only in `/var/www/tdd-todo-app/backend/.env`, this can
fail authentication or target the wrong database during deploy; invoke Node with
`--env-file` (or explicitly export env vars) for this step.

Useful? React with 👍 / 👎.

**Disposition: fixed** — The `Run database migrations` step in `.github/workflows/deploy.yml` now invokes Node with `--env-file .env`: `node --env-file .env dist/infrastructure/migrate.mjs`. Node.js 20 (the pinned `NODE_VERSION`) natively supports `--env-file`, so no extra tooling is required. Credentials stored in `/var/www/tdd-todo-app/backend/.env` on the VPS are loaded before `migrate.mjs` executes, ensuring `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, and `DB_DATABASE` resolve correctly instead of falling back to local defaults. Committed in `fix(deploy): load .env before running production migrations`.

---

**<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>
Read coverage totals from summary data**

The dashboard parser assumes a `total` object exists in `coverage-final.json`,
but that file is a per-file coverage map, so these lookups resolve to zero and
the generated dashboard reports 0% across all metrics. This makes the central
coverage report inaccurate and unusable; parse `coverage-summary.json` (via
`json-summary` reporter) or aggregate totals from the file map before rendering.

Useful? React with 👍 / 👎.

**Disposition: fixed** — Same root cause as the "Parse coverage metrics from the correct JSON structure" finding above. `extractMetrics` in `scripts/generate-coverage-report.js` was rewritten to aggregate statement, branch, and function counts directly from the file-coverage map that Vitest/Istanbul actually produces; no `total` object is required. Fixed in commit `7432af2` (`fix(coverage): parse coverage-final.json file-map and fix report href depth`).

---

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>
Fix dashboard links to coverage reports**

The dashboard is generated at `docs/coverage/index.html`, but this link uses
`../frontend/...`, which resolves to `docs/frontend/...` instead of the
repository root `frontend/...`; users clicking “View Report” will hit missing
pages. Update these hrefs to go up two levels (e.g. `../../frontend/...`,
similarly for backend) so the linked reports are reachable.

Useful? React with 👍 / 👎.

**Disposition: fixed** — Same root cause as the "Correct relative links to detailed coverage reports" finding above. All three `href` values in `generateHTML` were updated from `../X/` to `../../X/` so links resolve correctly from `docs/coverage/index.html` to the repo-root coverage directories. Fixed in commit `7432af2` (same commit).

> @copilot+claude-sonnet-4.6

The Backend CI and Frontend CI jobs are now passing for the latest commit
(`bbb7187`). The only remaining CI failure is the **Test Coverage** job, but
that's a pre-existing issue: frontend line coverage is at ~28% against the 80%
threshold that was set in commit `78cf89a` (before this PR). It's not caused by
the deploy workflow changes or the lock file fix. The deploy workflow itself is
green.
