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

**Disposition: fixed** — `extractMetrics` in `scripts/generate-coverage-report.js` has been rewritten to aggregate over the file-coverage map format that Vitest/Istanbul actually produces. For each file entry the function now iterates `s` (statements), `b` (branches — each value is `[taken, not_taken]`), and `f` (functions), tallying covered/total counts and computing `pct = Math.round((covered / total) * 100)`. The fallback to `coverage.total` has been removed entirely. Committed in `fix(coverage): parse coverage-final.json file-map and fix report href depth`.

---
**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>
Correct relative links to detailed coverage reports**

The generated links use `../frontend/...` and `../backend/...` from
`docs/coverage/index.html`, which resolves under `docs/` (for example,
`docs/frontend/...`) instead of the repository root paths where reports are
generated. This makes the "View Report" links non-functional when opening the
dashboard, so users cannot reach the detailed coverage pages.

Useful? React with 👍 / 👎.

**Disposition: fixed** — All three `href` values in `generateHTML` have been updated from `../X/` to `../../X/`. Since `docs/coverage/index.html` is two levels deep relative to the repo root, the correct paths are `../../frontend/coverage/index.html` and `../../backend/coverage/unit/index.html`. The "View Report" links now resolve to the correct repo-root coverage directories. Same commit as above.

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
