## Review Target

Branch: `backend` (commits `ebb7e6d`–`402f7a5`, 6 commits not yet merged to `origin/backend`)

Changed files:
- `backend/package.json`
- `backend/src/controllers/app-controller.ts`
- `backend/src/controllers/http-presenter.ts`
- `backend/src/controllers/todo-controller.ts`
- `.github/agents/FixAgent.agent.md` (new file)
- `.github/agents/CodeReviewAgent.agent.md`
- `.github/agents/ReviewResponseAgent.agent.md`
- `.github/agents/RefactorAgent.agent.md` + 10 other agent files (translation only)
- `.github/rules/typescript.rules.md`, `.github/CUSTOM_COMMANDS.md`, `.github/workflows/backend.yaml`, `.github/workflows/frontend.yaml` (translation only)

## Summary

The changes are well-scoped and purposeful. The backend `handleControllerError` refactor is clean and the `npm run migrate` fix addresses a real developer-blocking bug correctly. The FixAgent addition and agent-chain wiring are architecturally sound.

One real gap was found: the `handleControllerError` function was moved into `http-presenter.ts` without adding corresponding unit tests to `http-presenter.test.ts`. Integration tests cover the error path indirectly but the unit test file has no case for `handleControllerError`. No P1 issues found.

---

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>
`handleControllerError` is exported from `http-presenter.ts` but has no unit tests**

`http-presenter.test.ts` tests `presentApp`, `presentTodo`, `presentSuccess`, and `presentError`, but after the refactor that extracted `handleControllerError` into `http-presenter.ts`, the unit test file was not updated to cover the new export.

The function has two observable behaviors that should be tested directly:

1. When the thrown value is an `AppError` → it must return the result of `presentError(error)` (not throw)
2. When the thrown value is NOT an `AppError` (e.g., `new Error('unexpected')`) → it must re-throw

Controller integration tests in `tests/integrations/controllers/` do exercise path 1 indirectly (they verify 404/409 responses). Path 2 — the re-throw branch — is not exercised by any test in the repo.

A missing re-throw test means that if someone accidentally adds `return null` or swallows the unknown error in a future change to `handleControllerError`, no test will catch it.

**Fix:** Add to `http-presenter.test.ts`:

```typescript
import { AppError } from '../models/app-error';
import { handleControllerError } from './http-presenter';

describe('handleControllerError', () => {
  it('returns a JSON response for a known AppError', () => {
    const error = new AppError('NOT_FOUND', 'resource missing');
    const result = handleControllerError(error);
    expect(result.status).toBe(404);
    expect(result.body.success).toBe(false);
    expect(result.body.error?.code).toBe('NOT_FOUND');
  });

  it('re-throws unknown errors', () => {
    const unknown = new Error('unexpected');
    expect(() => handleControllerError(unknown)).toThrow('unexpected');
  });
});
```

Useful? React with 👍 / 👎.

**Disposition:** fixed — `backend/src/controllers/http-presenter.test.ts`

Added a `handleControllerError` describe block with two tests:
1. `'returns a JSON response for a known AppError'` — asserts status 404, `success: false`, and `error.code: 'NOT_FOUND'` for a `NOT_FOUND` AppError.
2. `'re-throws unknown errors'` — asserts that a plain `Error('unexpected')` propagates (the previously uncovered re-throw branch).

All 117 unit tests pass (`npm run test:unit`). Committed as `test: add unit tests for handleControllerError in http-presenter` (commit `0a2ed64`).

---

**<sub><sub>![P3 Badge](https://img.shields.io/badge/P3-blue?style=flat)</sub></sub>
`--env-file=.env` in the migrate script fails hard if `.env` is absent**

The fix in `backend/package.json` changes the migrate script from:

```json
"migrate": "tsx src/infrastructure/migrate.ts"
```

to:

```json
"migrate": "tsx --env-file=.env src/infrastructure/migrate.ts"
```

Node.js 22's `--env-file` flag **throws** (`ERR_INVALID_ARG_VALUE`) if the specified file does not exist, regardless of whether the required env vars are already set in the process environment. This means a developer or script that sets `DB_PASSWORD` via shell environment variables (not a `.env` file) would have their `npm run migrate` broken by this change even though their credentials are valid.

For the current project where `.env` is the documented setup method and CI does not run `npm run migrate`, this is low-risk. However, if a CI migration step is added in the future, it would fail unless a `.env` file is created or the script is changed.

**Alternative:** Use `--env-file-if-exists=.env` (available since Node.js 22.10), which loads the file if present but does not fail if it's missing:

```json
"migrate": "tsx --env-file-if-exists=.env src/infrastructure/migrate.ts"
```

This preserves the fix (`.env` is loaded when present) while allowing shell-env-only workflows.

Useful? React with 👍 / 👎.

**Disposition:** fixed — `backend/package.json`

The project runs Node.js v22.20.0, which includes `--env-file-if-exists` (added in 22.10). The migrate script has been updated from `--env-file=.env` to `--env-file-if-exists=.env`. The `.env` file is still loaded when present, but the command no longer throws when it is absent — shell-env-only and CI workflows both work correctly. Committed as `fix: use --env-file-if-exists for migrate script` (commit `ef01c85`).

---

**<sub><sub>![P3 Badge](https://img.shields.io/badge/P3-blue?style=flat)</sub></sub>
`http-presenter.ts` now owns both presentation logic and controller error handling**

After the refactor, `http-presenter.ts` exports two distinct concerns:

1. **Presentation** — `presentApp`, `presentTodo`, `presentSuccess`, `presentError` (data formatting)
2. **Error handling** — `handleControllerError` (catch-clause dispatch logic)

The file name `http-presenter` implies formatting/mapping only. The `handleControllerError` function is not a presenter — it is a catch-clause helper that decides whether to surface an error response or re-throw. Having it in `http-presenter.ts` makes the module's responsibility slightly ambiguous.

This is not a bug and does not violate any layer rule (all imports stay within the controller layer). The concern is purely about discoverability: a future developer looking for error handling logic would not intuitively search `http-presenter.ts`.

**Option:** Move `handleControllerError` to a small `controller-utils.ts` file alongside `http-presenter.ts` and `request-validation.ts`. Or rename the module to `http-helpers.ts` to signal that it contains more than presentation DTOs.

This is a low-priority cleanup and should not block the merge.

Useful? React with 👍 / 👎.

**Disposition:** reply only — no code change

The observation is accurate: `handleControllerError` is a catch-clause helper rather than a pure formatter. However, the module boundary does not violate any layer rule (all symbols stay within the controller layer), and the function has a direct dependency on `presentError` — co-locating them avoids a circular or trivial cross-file import. A rename or extraction to `controller-utils.ts` would be a valid future cleanup, but the current scope and naming are clear enough that it does not meet the threshold for a change in this PR. Logged as a follow-up consideration.

---
