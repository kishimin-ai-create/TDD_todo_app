## Review Target

- `backend/src/infrastructure/hono-app.ts` — Commits `3f13b58` (guard-clause refactor) and `103a59c` (rename `elapsedTime` → `elapsedTimeMs`); removal of `LOG_API_REQUESTS` guard from `logErrorRequest()`
- `backend/src/tests/integrations/infrastructure/hono-app.medium.test.ts` — Commit `ed5da5a`: new `describe('Error logging always-on behavior (no LOG_API_REQUESTS env var)', ...)` block (5 test cases, lines 963–1091)

## Summary

The feature change is minimal and correct: one guard clause removed from `logErrorRequest()` makes error-response logging unconditional, matching the spec in `docs/spec/features/api-logging.md`. The `extractErrorDetails()` refactor to guard clauses is logically equivalent — De Morgan's laws applied cleanly. The `elapsedTimeMs` rename is applied consistently at both the declaration and the call-site. The 5 new tests cover the always-on contract from multiple angles and their `beforeEach`/`afterEach` env-var management is correct. Three low-priority issues remain: one test in the new block only spot-checks presence (not format), `console.warn` is not suppressed during the new tests, and a `mockClear()` in the 409 test operates on an empty spy without comment.

---

**<sub><sub>![P3 Badge](https://img.shields.io/badge/P3-blue?style=flat)</sub></sub>
Test 1 in the always-on block asserts presence only, not the log format**

`hono-app.medium.test.ts` — `should log 4xx error response even when LOG_API_REQUESTS is not set` (line 978)

The assertion only checks that the captured string contains `'ERROR'` and `'422'`:

```typescript
const errorLogCall = consoleLogSpy.mock.calls.find((call: unknown[]) =>
  typeof call[0] === 'string' &&
  call[0].includes('ERROR') &&
  call[0].includes('422')
);
expect(errorLogCall).toBeDefined();
```

Every other test in this block (tests 2–5) verifies at least the `→ ERROR <status>` fragment. A log message of `"ERROR: status 422 happened"` would satisfy the current assertion even though it doesn't match the spec format `[METHOD] path → ERROR status — code: message`. This makes test 1 weaker than its siblings and inconsistent within the same describe block.

**Suggested fix:** add a format check matching the other tests:

```typescript
const logMessage = errorLogCall![0] as string;
expect(logMessage).toMatch(/\[POST\].*→ ERROR 422/);
```

Useful? React with 👍 / 👎.

---

**<sub><sub>![P3 Badge](https://img.shields.io/badge/P3-blue?style=flat)</sub></sub>
`console.warn` is not suppressed in the new always-on describe block**

`hono-app.medium.test.ts` — `beforeEach` of `'Error logging always-on behavior (no LOG_API_REQUESTS env var)'` (line 967)

The `beforeEach` mocks only `console.log`:

```typescript
consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
```

`extractErrorDetails()` calls `console.warn()` on every extraction failure path (missing `error` property, wrong structure, JSON parse error, size guard). If any response returned by the integration tests ever has an unexpected body shape — even transiently, e.g., during a future refactor — those `console.warn` calls will leak into the test runner's output, cluttering CI logs and obscuring other test failures.

The existing `'API request/response logging middleware'` sibling block has the same gap. Consistent practice would be to also spy on `console.warn`:

```typescript
let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  delete process.env.LOG_API_REQUESTS;
  consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  consoleLogSpy.mockRestore();
  consoleWarnSpy.mockRestore();
  delete process.env.LOG_API_REQUESTS;
});
```

Useful? React with 👍 / 👎.

---

**<sub><sub>![P3 Badge](https://img.shields.io/badge/P3-blue?style=flat)</sub></sub>
`consoleLogSpy.mockClear()` in the 409 always-on test is a silent no-op**

`hono-app.medium.test.ts` — `should log 409 conflict error even when LOG_API_REQUESTS is not set` (line 1026)

```typescript
await req(app, 'POST', '/api/v1/auth/signup', {
  email: 'always-on@example.com',
  password: 'password123',
});
consoleLogSpy.mockClear();   // ← always empty; no-op
```

Because `LOG_API_REQUESTS` is intentionally absent, `logSuccessRequest()` returns early on the first 201 signup — `console.log` is never called. The `mockClear()` therefore operates on a spy with zero calls and provides no isolation benefit. Readers unfamiliar with this subtlety may assume the spy had captured something meaningful and wonder what is being cleared.

Options:
1. Remove the `mockClear()` call and add a brief comment explaining why it is not needed (`// 201 success is not logged without LOG_API_REQUESTS`).
2. Keep `mockClear()` but add the same comment so the intent is explicit.

Useful? React with 👍 / 👎.
