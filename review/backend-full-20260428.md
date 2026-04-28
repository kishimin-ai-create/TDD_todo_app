## Review Target

Full backend source under `backend/src/` — all layers:
`models/`, `services/`, `repositories/`, `controllers/`, `infrastructure/`, `tests/`

## Summary

The overall architecture is clean and consistent with the project's DDD + Clean Architecture rules. Layer boundaries are respected, all SQL uses parameterized queries, and test coverage is broad. However, three concrete correctness/security issues stand out: the cascade-delete logic in `app-interactor.ts` is not atomic and can leave data in an inconsistent state under a MySQL failure; `mysql-client.ts` silently falls back to root/empty-password credentials when environment variables are absent; and test-environment bootstrapping is woven into the shared application module (`index.ts`), leaking test infrastructure into the production bundle. TypeScript hygiene gaps (missing explicit return types on three exported functions, undocumented `as` casts throughout tests) and a silent divergence risk between the runtime validator and the Zod schema round out the findings.

---

**<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>
Non-atomic cascade delete can leave orphaned todos on MySQL failure**

In `services/app-interactor.ts`, the `remove` function performs a three-step write sequence that is **not wrapped in a database transaction**:

```ts
// step 1
await appRepository.save(deletedApp);          // app.deletedAt is now set

// step 2
const todos = await todoRepository.listActiveByAppId(app.id);

// step 3 – each save is an independent round-trip
for (const todo of todos) {
  await todoRepository.save({ ...todo, deletedAt });
}
```

If the MySQL server returns an error (or the process crashes) between step 1 and a mid-loop iteration of step 3, the app row has `deletedAt` set but some todo rows do not. Those todos are permanently orphaned: they belong to an app that no longer appears in any active list, yet they remain retrievable via `listActiveByAppId`. There is no recovery path.

**How to fix:** Either introduce a transaction abstraction in the repository interface (e.g., a `withTransaction(callback)` port), or move the cascade responsibility to the MySQL layer (a single SQL `UPDATE Todo SET deletedAt = ? WHERE appId = ? AND deletedAt IS NULL` inside the same transaction as the app update). The in-memory implementation is unaffected because its Map operations cannot fail mid-loop, but the MySQL implementation is vulnerable.

Useful? React with 👍 / 👎.

---

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>
`mysql-client.ts` silently falls back to insecure credentials when env vars are absent**

```ts
// infrastructure/mysql-client.ts
user:     process.env.DB_USERNAME ?? 'root',
password: process.env.DB_PASSWORD ?? '',
```

If `DB_USERNAME` or `DB_PASSWORD` are not set in a production environment (misconfigured container, missing secret, etc.), the pool is created with `root` / empty-password. On a permissive MySQL instance this succeeds silently, giving the application superuser access to the database with no indication that anything is wrong.

**How to fix:** Throw a startup error when the credentials are absent rather than silently defaulting to insecure values:

```ts
const user = process.env.DB_USERNAME;
const password = process.env.DB_PASSWORD;
if (!user || password === undefined) {
  throw new Error('DB_USERNAME and DB_PASSWORD environment variables are required');
}
```

Useful? React with 👍 / 👎.

---

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>
Test-environment bootstrapping and `clearStorage` leak into the production app module**

`backend/src/index.ts` checks `process.env.NODE_ENV === 'test'` at module-load time and exports `clearStorage`:

```ts
// index.ts (shared between production server and all tests)
const isTest = process.env.NODE_ENV === 'test';

if (isTest) {
  const registry = createBackendRegistry();   // in-memory
  clearStorageFn = registry.clearStorage;
} else {
  const registry = createMysqlBackendRegistry(); // MySQL — connects at import time
}

export function clearStorage(): void { clearStorageFn?.(); }
export default honoApp;
```

Two concrete problems:
1. **Production bundle contains test infrastructure** — `clearStorage`, `InMemoryStorage`, and all in-memory repository code are reachable from production imports because both branches share one module.
2. **MySQL connection pool is created eagerly at import time** in non-test environments. Any module that imports `honoApp` (including tests that accidentally set `NODE_ENV` incorrectly) will attempt a DB connection.

**How to fix:** Push environment selection up to `server.ts` (the true composition root). `index.ts` should accept an already-constructed registry — or be eliminated. `clearStorage` should live only in the test helper layer.

Useful? React with 👍 / 👎.

---

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>
Three exported factory functions are missing explicit return types**

The TypeScript rules require explicit return types on all public (exported) functions. The following three exported functions are missing them:

| File | Function |
|------|----------|
| `infrastructure/hono-app.ts` | `createHonoApp(dependencies)` |
| `infrastructure/registry.ts` | `createBackendRegistry()` |
| `infrastructure/mysql-registry.ts` | `createMysqlBackendRegistry()` |

Without explicit return types, structural changes to the return value (adding/removing fields, changing the `app` type) are not caught at the call site until a downstream type error surfaces, which can be in a completely different file.

**How to fix:** Declare return types explicitly. For example:

```ts
import type { Hono } from 'hono';

export function createHonoApp(dependencies: HonoAppDependencies): Hono { ... }

type BackendRegistry = { app: Hono; clearStorage: () => void };
export function createBackendRegistry(): BackendRegistry { ... }
```

Useful? React with 👍 / 👎.

---

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>
Dual validation implementations (runtime vs Zod) can silently diverge**

Request validation is implemented **twice** with no linkage between the two:

- **`controllers/request-validation.ts`** — manual validation that is actually executed on every request (the real gate).
- **`controllers/schemas.ts`** — Zod schemas used only for OpenAPI documentation (`hono-openapi`). These are never invoked at runtime.

If a product requirement changes (e.g., max title length changes from 200 to 255), a developer may update `schemas.ts` (which is visible in the OpenAPI spec and test assertions) and forget `request-validation.ts`, or vice versa. The tests would pass because the integration tests exercise `request-validation.ts`, but the OpenAPI spec and actual behaviour would disagree.

**How to fix:** Drive runtime validation from the same Zod schema used for documentation. Replace the manual validators in `request-validation.ts` with `schema.safeParse(body)` calls using the schemas already defined in `schemas.ts`. This eliminates the duplication and makes the OpenAPI spec the single source of truth.

Useful? React with 👍 / 👎.

---

**<sub><sub>![P3 Badge](https://img.shields.io/badge/P3-blue?style=flat)</sub></sub>
Undocumented `as` type assertions are pervasive in test files**

The TypeScript rules state: *"Type assertions using `as` are prohibited. If an assertion is absolutely necessary, you must add an explanatory comment on the line immediately before it."*

Every test that parses a JSON response casts the result without a comment:

```ts
// tests/integrations/infrastructure/app.test.ts (representative sample)
const json = await res.json() as { data: Record<string, unknown>; success: boolean };
```

This pattern appears across `app.test.ts`, `todo.test.ts`, `helpers.ts`, `app-controller.test.ts`, `todo-controller.test.ts`, `hono-app.test.ts`, and `registry.test.ts` — dozens of occurrences.

**How to fix:** Either add a one-line comment explaining why the cast is safe (e.g., `// Response shape is guaranteed by the contract test above; casting for readable property access`), or introduce a typed response-parsing helper (e.g., using Zod's `parse`/`safeParse` with `SuccessResponseSchema`/`ErrorResponseSchema` from `schemas.ts`) to remove the need for `as` entirely.

Useful? React with 👍 / 👎.

---

**<sub><sub>![P3 Badge](https://img.shields.io/badge/P3-blue?style=flat)</sub></sub>
Soft-delete does not update `updatedAt`, making the timestamp semantically inconsistent**

When an app or todo is soft-deleted, `deletedAt` is set but `updatedAt` is left unchanged:

```ts
// app-interactor.ts — direct delete
const deletedApp: AppEntity = { ...app, deletedAt };   // updatedAt unchanged

// todo-interactor.ts — direct delete
const deletedTodo: TodoEntity = { ...todo, deletedAt: now() };  // updatedAt unchanged

// app-interactor.ts — cascade delete
await todoRepository.save({ ...todo, deletedAt });   // updatedAt unchanged
```

This means a deleted entity has `updatedAt < deletedAt` (sometimes by a significant margin), which can confuse consumers that track changes using `updatedAt` (e.g., a sync client polling for records modified after a cursor).

**How to fix:** Set `updatedAt` to the same timestamp as `deletedAt` on all soft-delete paths:

```ts
const deletedApp: AppEntity = { ...app, updatedAt: deletedAt, deletedAt };
```

Useful? React with 👍 / 👎.
