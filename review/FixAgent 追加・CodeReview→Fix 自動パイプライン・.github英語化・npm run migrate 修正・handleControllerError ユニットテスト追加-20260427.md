**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>
Drop duplicated /api/v1 from OpenAPI server URL**

The route metadata already registers paths with the `/api/v1` prefix (e.g.
`/api/v1/apps` in the generated spec), so setting `servers` to `/api/v1` makes
OpenAPI clients concatenate both and call `/api/v1/api/v1/...`, which produces
incorrect request URLs and 404s for generated SDKs or Swagger “try it out”
flows. Use root (`/`) or remove the server override so the emitted paths stay
callable.

Useful? React with 👍 / 👎.

**Disposition:** reply-only — stale finding

The OpenAPI YAML file that contained the `/api/v1` server URL was deleted in a
prior session. No `.yaml` file exists under `backend/` anymore, so there is
nothing to correct. This finding no longer applies to the current codebase.

---

**<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>
Load .env when running the backend dev server**

The new `dev` script starts `tsx` without any env-file option, so `npm run dev`
no longer loads values from `.env`. The runtime then builds MySQL config from
`process.env` defaults (including empty `DB_PASSWORD`), which causes connection
failures in setups where credentials are only in `.env` (a common local
workflow). This regresses local startup behavior and should be fixed by loading
`.env` explicitly (for example with `--env-file-if-exists=.env` or equivalent).

Useful? React with 👍 / 👎.

**Disposition:** fixed — `backend/package.json`

Added `--env-file-if-exists=.env` to the `dev` script in `backend/package.json`.
The script is now `tsx --env-file-if-exists=.env --watch src/server.ts`,
consistent with the existing `migrate` script. This ensures `.env` credentials
are loaded when running `npm run dev` without failing when the file is absent
(Node.js ≥ 22.10 flag). Committed as
`fix: load .env in npm run dev via --env-file-if-exists`.

---

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>
Remove duplicated API prefix in OpenAPI server URL**

This sets the OpenAPI server base URL to `/api/v1` even though all documented
paths already include `/api/v1` (e.g. `/api/v1/apps`). OpenAPI consumers resolve
endpoints as `server.url + path`, so generated clients/docs target
`/api/v1/api/v1/...` and hit incorrect URLs. Use a root server URL (or omit
`servers`) when paths are already fully prefixed.

Useful? React with 👍 / 👎.

**Disposition:** reply-only — stale finding

Same as Finding 1: the OpenAPI YAML file was deleted in a prior session and no
server URL configuration remains in the codebase. This finding is no longer
actionable.

---

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>
Use root server URL in generated OpenAPI document**

The OpenAPI config now sets `servers: [{ url: '/api/v1' }]` even though all
documented paths are already prefixed with `/api/v1` in `createHonoApp`, so
OpenAPI tooling will resolve operations to `/api/v1/api/v1/...` and hit
non-existent endpoints. This breaks generated SDK calls and Swagger "Try it out"
requests unless consumers manually override the server URL.

Useful? React with 👍 / 👎.

**Disposition:** fixed — `backend/src/infrastructure/hono-app.ts`

The `servers` URL in the OpenAPI config was set to `'/api/v1'`, but all
registered paths already carry the `/api/v1` prefix (e.g. `/api/v1/apps`).
OpenAPI tooling resolves endpoints as `server.url + path`, so this caused
generated clients to call `/api/v1/api/v1/...`. Fixed by changing `url` to
`'/'` so the server base stays at root and the fully-prefixed paths resolve
correctly. This was not a stale finding — the config lives in `hono-app.ts`,
not in a deleted YAML file.

---

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>
Remove duplicate terminal agent calls in review pipeline**

Making `@ArticleWriterAgent` and `@WorkSummaryAgent` mandatory here causes
repeated downstream execution when `@CodeReviewAgent` is invoked, because
`ReviewResponseAgent` and `FixAgent` already require those same terminal calls.
In practice this can trigger duplicate blog/diary generation (and potentially
repeated commits), instead of a single
`CodeReview -> ReviewResponse -> Fix -> Article/WorkSummary` pass.

Useful? React with 👍 / 👎.

**Disposition:** fixed — `.github/agents/CodeReviewAgent.agent.md`,
`.github/agents/ReviewResponseAgent.agent.md`

Confirmed: both CodeReviewAgent and ReviewResponseAgent post-completion sections
called `@ArticleWriterAgent` and `@WorkSummaryAgent`, which FixAgent already
calls as its terminal step. This caused triple execution of blog/diary generation
on every full pipeline run. Fixed by removing `@ArticleWriterAgent` and
`@WorkSummaryAgent` from CodeReviewAgent (leaving only `@ReviewResponseAgent`)
and from ReviewResponseAgent (leaving only `@FixAgent`). FixAgent remains the
single terminal caller of `@ArticleWriterAgent` and `@WorkSummaryAgent`.
