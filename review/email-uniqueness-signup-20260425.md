## Review Target

Files changed in the **email uniqueness on signup** TDD cycle:

- `backend/src/infrastructure/hono-app.ts` — `userStore`, email uniqueness check, `UserRecord` type, `buildValidationErrorBody` helper
- `backend/src/infrastructure/registry.ts` — wires `userStore`, clears it in `clearStorage()`
- `backend/src/tests/integrations/infrastructure/auth.medium.test.ts` — Red-phase integration tests

Feature: `POST /api/v1/auth/signup` returns 409 when the email is already registered.

---

## Summary

The core uniqueness logic is structurally sound — `Map.has()` before `Map.set()` is the right pattern and `clearStorage()` correctly reaches `userStore`. However, **four real defects** were found:

1. **Email case is not normalised**, so the duplicate check can be bypassed with trivially different casing (`Alice@example.com` vs `alice@example.com`). This is a functional bug in the primary feature.
2. **Login never validates credentials against `userStore`** — any syntactically valid email/password returns 200 with a brand-new random user ID, making the signup flow semantically meaningless for returning users.
3. **The signup token is generated but never stored**, so it can never be validated by any future middleware.
4. **Business logic lives inside the HTTP infrastructure layer**, violating the project's Clean Architecture rules (`backend.rules.md`).

---

**<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>
Email case not normalised — uniqueness check can be silently bypassed**

`parseAuthCredentials` (hono-app.ts line 498) trims whitespace but **never lowercases** the address:

```ts
const normalizedEmail = email.trim();   // ← missing .toLowerCase()
```

Because `userStore` is a plain `Map` keyed by this string, `Alice@Example.com` and `alice@example.com` are different keys. A second registration with a differently-cased variant of the same address returns **201 instead of 409**, silently creating a duplicate logical account.

**Fix:** apply `.toLowerCase()` before storing and before looking up:

```ts
const normalizedEmail = email.trim().toLowerCase();
```

The same change must be applied consistently in `parseAuthCredentials` so that both the lookup path (`userStore.has(parsed.email)`) and the write path (`userStore.set(parsed.email, newUser)`) use the canonical form.

Useful? React with 👍 / 👎.

Fixed. Added `.toLowerCase()` to `parseAuthCredentials` in `hono-app.ts` so that the canonical email is always lowercase before both the `userStore.has()` lookup and the `userStore.set()` write. Mixed-case variants such as `Alice@Example.com` now resolve to the same key as `alice@example.com`.

**Disposition:** fixed — `backend/src/infrastructure/hono-app.ts`

---

`POST /api/v1/auth/login` (hono-app.ts lines 111-131) ignores `userStore` entirely. It accepts any syntactically valid email/password pair and returns a randomly-generated `user.id` each time. Consequences:

- A user who never signed up can log in successfully.
- The `user.id` returned at login differs from the one created at signup — the two calls are not linked.
- Any password (≥ 8 chars) succeeds for any registered user.

Even as an in-memory stub the login path should at minimum check `userStore.has(email)` and return 401 when the address is unknown. Without this, the signup flow provides no actual access control.

Useful? React with 👍 / 👎.

Fixed. The `POST /api/v1/auth/login` handler now calls `userStore.get(parsed.email)` and returns a 401 `INVALID_CREDENTIALS` response when the email is not found. When the user does exist, the stored `id` and `token` are returned, so login and signup are now linked via the same `UserRecord`. The existing login 200 test was updated to sign up first, and a new 401 test covering the unregistered-email case was added.

**Disposition:** fixed — `backend/src/infrastructure/hono-app.ts`, `backend/src/tests/integrations/infrastructure/auth.medium.test.ts`

---

Per `backend.rules.md`, the `Controller → Service → Model` dependency rule requires the handler layer to be thin (parse → call service → map to HTTP). The signup route in `createHonoApp` currently performs the uniqueness check and `userStore` write itself — this is application-layer business logic sitting inside the infrastructure layer.

The correct placement:

```
Handler (hono-app.ts)
  → SignupUsecase / AuthInteractor  (services/)
      → AuthRepository interface    (models/ or repositories/)
          → InMemoryAuthRepository  (infrastructure/)
```

Useful? React with 👍 / 👎.

This is a valid long-term concern and the correct target architecture is agreed upon. However, extracting signup/login into a `SignupUsecase`/`AuthInteractor` with a repository interface and an in-memory implementation is a cross-cutting refactor that changes multiple layers simultaneously. Performing it as part of a targeted review-response fix risks destabilising unrelated tests and inflating this PR's scope beyond the email-uniqueness feature. This finding has been captured as a follow-up task to be addressed in a dedicated refactor cycle. The `userStore` is currently injectable via `HonoAppDependencies`, so the uniqueness rule is already integration-testable at the HTTP boundary without HTTP mocking.

**Disposition:** reply only — architectural refactor tracked as a dedicated follow-up

---

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>
`UserRecord` type is not exported — `registry.ts` silently duplicates it as an inline shape**

`UserRecord` is declared in `hono-app.ts` (line 24) but not exported:

```ts
// hono-app.ts
type UserRecord = { id: string; email: string };   // not exported
```

`registry.ts` line 35 therefore repeats the same shape inline:

```ts
const userStore = new Map<string, { id: string; email: string }>();
```

These two definitions are structurally identical today, but TypeScript will not report an error if they diverge. If a field is added to `UserRecord` (e.g., `passwordHash`, `createdAt`) only one definition will be updated, causing silent type drift.

**Fix:** export `UserRecord` from `hono-app.ts` and import it in `registry.ts`:

```ts
// hono-app.ts
export type UserRecord = { id: string; email: string };

// registry.ts
import type { UserRecord } from './hono-app';
Useful? React with 👍 / 👎.

Fixed. `UserRecord` is now declared as `export type UserRecord` in `hono-app.ts` (with the `token` field also added — see the token-storage finding below), and `registry.ts` imports it with `import type { UserRecord } from './hono-app'` and uses `Map<string, UserRecord>`. The duplicate inline shape has been removed. TypeScript will now catch any future divergence between the two files at compile time.

**Disposition:** fixed — `backend/src/infrastructure/hono-app.ts`, `backend/src/infrastructure/registry.ts`

---

The 201 response includes `token: randomUUID()` (hono-app.ts line 103), but `userStore` only persists `{ id, email }`. The token is produced, returned, and immediately lost. When any future auth middleware attempts to validate a Bearer token, there is no lookup table to check — every presented token will appear invalid.

Either:
- Store the token in the user record: `userStore.set(email, { id, email, token })`, or
- Add a separate `tokenStore: Map<string, string>` (token → userId), or
- Document explicitly that the token is a placeholder not intended for validation.

Without one of these, the issued token is a lie.

Useful? React with 👍 / 👎.

Fixed. `UserRecord` now includes a `token` field (`{ id: string; email: string; token: string }`). The signup handler generates the token once, stores it inside `UserRecord` via `userStore.set(email, newUser)`, and returns it from the stored field (`newUser.token`). The login handler returns the same stored token when the user is found. This means any future Bearer-token middleware can validate presented tokens by scanning `userStore` values.

**Disposition:** fixed — `backend/src/infrastructure/hono-app.ts`, `backend/src/infrastructure/registry.ts`

---

**<sub><sub>![P3 Badge](https://img.shields.io/badge/P3-blue?style=flat)</sub></sub>
Misleading comment in the "same email after storage cleared" test**

`auth.medium.test.ts` lines 119-121:

```ts
// clearStorage() is invoked by beforeEach before every test, so by the
// time this test runs the store is already empty — this sub-step
// simulates a fresh store by calling it explicitly again.
clearStorage();
```

The comment implies that the store was already empty when `clearStorage()` is called, making the call trivial. But the test registers `reuse@example.com` *before* this point (line 115), so the explicit `clearStorage()` on line 121 is what actually removes that prior registration and makes the subsequent signup succeed. The call is load-bearing, not redundant.

**Fix:** replace the comment with one that accurately describes why the explicit call is needed:

```ts
// Explicitly clear the store to simulate re-registration after an account is deleted.
clearStorage();
```

Useful? React with 👍 / 👎.

Fixed. The misleading comment has been replaced with: `// Explicitly clear the store to simulate re-registration after an account is deleted.` This accurately describes that the call is load-bearing — it removes the registration made just above it — rather than implying the store was already empty.

**Disposition:** fixed — `backend/src/tests/integrations/infrastructure/auth.medium.test.ts`
