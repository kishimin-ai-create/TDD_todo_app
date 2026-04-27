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

The OpenAPI YAML file that contained the `/api/v1` server URL was deleted in a prior session. No `.yaml` file exists under `backend/` anymore, so there is nothing to correct. This finding no longer applies to the current codebase.

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

Added `--env-file-if-exists=.env` to the `dev` script in `backend/package.json`. The script is now `tsx --env-file-if-exists=.env --watch src/server.ts`, consistent with the existing `migrate` script. This ensures `.env` credentials are loaded when running `npm run dev` without failing when the file is absent (Node.js ≥ 22.10 flag). Committed as `fix: load .env in npm run dev via --env-file-if-exists`.

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

Same as Finding 1: the OpenAPI YAML file was deleted in a prior session and no server URL configuration remains in the codebase. This finding is no longer actionable.

---