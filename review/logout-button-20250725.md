## Review Target

Files created or modified during the Logout feature TDD cycle:

- `frontend/src/features/auth/hooks/useLogout.ts` *(new)*
- `frontend/src/features/auth/components/LogoutButton.tsx` *(new)*
- `frontend/src/features/auth/hooks/useLogout.small.test.ts` *(new)*
- `frontend/src/features/auth/components/LogoutButton.small.test.tsx` *(new)*
- `frontend/src/features/auth/components/LogoutButton.medium.test.tsx` *(new)*
- `frontend/src/App.tsx` *(modified)*
- `frontend/eslint.config.js` *(modified)*

## Summary

The logout implementation is functionally correct: `useLogout` clears both `authAtom` and `currentPageAtom`, and `atomWithStorage` properly persists `null` to `localStorage` so the cleared state survives a page reload. The test suite is thorough, covering boundary conditions (auth already null, multiple source pages) and integration via a real Jotai store. Four issues were found: `LogoutButton` is missing a required JSDoc comment that will fail the configured ESLint `jsdoc/require-jsdoc` rule; there is no server-side token revocation, leaving the JWT valid on the backend after client-side logout; `import/order: "off"` is applied to the entire test suite to accommodate a pattern that the real Vitest hoisting mechanism makes unnecessary; and one redundant test case adds noise without adding coverage.

---

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>
`LogoutButton` missing JSDoc — will fail the configured `jsdoc/require-jsdoc` lint rule**

`eslint.config.js` enforces `jsdoc/require-jsdoc` with `publicOnly: true` and `FunctionDeclaration: true` as an `"error"`. `LogoutButton.tsx` exports a named function declaration with no JSDoc comment, so any lint run will fail on this file.

Compare `useLogout.ts`, which does have the required comment:

```ts
/**
 * Hook that provides a logout function.
 * Clears the auth state and navigates to the login page.
 */
export function useLogout() { ... }
```

`LogoutButton` needs the same treatment:

```tsx
/**
 * Button component that logs the current user out.
 * Calls the logout function from useLogout on click.
 */
export function LogoutButton() { ... }
```

Useful? React with 👍 / 👎.

The JSDoc comment was already present in `LogoutButton.tsx` as part of a prior refactor commit (`refactor: improve logout feature code quality`). No additional code change was needed.

Disposition: **already fixed** — `frontend/src/features/auth/components/LogoutButton.tsx`

---

`useLogout` only clears client-side state. There is no call to a backend `/logout` endpoint, and a search of `backend/src/` confirms none exists. The JWT token stored under `localStorage['auth']` continues to be accepted by the server until its expiry.

If an attacker has already exfiltrated the token (via XSS, network interception, or shoulder-surfing), the user clicking "ログアウト" does nothing to invalidate that copy. The token is still a working credential for the full remainder of its lifetime.

Concrete mitigations (in priority order):
1. Implement a `POST /api/v1/auth/logout` endpoint that server-side revokes or blacklists the token, and call it from `useLogout` before clearing the atoms.
2. If stateless JWTs are required by architecture, set a short expiry (< 15 min) and issue refresh tokens with a server-managed revocation list.
3. At minimum, document the residual risk and ensure token expiry is short enough to bound the attack window.

Useful? React with 👍 / 👎.

Acknowledged. No backend `/logout` endpoint exists today, and implementing one is outside the scope of this TDD cycle. The residual risk is noted: the JWT issued at login remains valid on the server until its natural expiry even after the client clears local state. As mitigation, token expiry should be kept short (≤ 15 min). A follow-up task will be opened to implement `POST /api/v1/auth/logout` with server-side token revocation before the app goes to production.

Disposition: **reply only** — no code change; risk accepted as a tracked follow-up

---

`eslint.config.js` disables `import/order` for the entire test suite. The comment in `LogoutButton.small.test.tsx` explains the reason:

```ts
// Import after mock registration so the mocked version is used everywhere.
import { useLogout } from '../hooks/useLogout'
```

This is misleading. Vitest automatically **hoists** all `vi.mock()` calls to the top of the module at compile time (before any import is evaluated), regardless of where the `vi.mock()` call appears in source. The ordering of the `import { useLogout }` line relative to the `vi.mock()` call has no effect on whether the mock is active.

The real consequence of the broad `"off"` is that import ordering discipline is lost across every test file in the project — a growing surface area as the test suite expands.

**Fix:** Re-enable `import/order` in the test block and use an inline `// eslint-disable-next-line import/order` comment on the specific line where the rule would fire, co-located with a corrected explanation:

```ts
vi.mock('../hooks/useLogout', () => ({ useLogout: vi.fn() }))

// eslint-disable-next-line import/order -- placed here for readability; vi.mock is hoisted by Vitest regardless
import { useLogout } from '../hooks/useLogout'
```

Useful? React with 👍 / 👎.

Fixed. Removed the blanket `"import/order": "off"` override from the test files block in `eslint.config.js`. In `LogoutButton.small.test.tsx`, replaced the misleading comment with a targeted `// eslint-disable-next-line import/order` on the specific `useLogout` import line, with an updated explanation: `"placed here for readability; vi.mock is hoisted by Vitest regardless"`. Import ordering discipline is now enforced across the full test suite.

Disposition: **fixed** — `frontend/eslint.config.js`, `frontend/src/features/auth/components/LogoutButton.small.test.tsx`

---

`LogoutButton.small.test.tsx` contains two separate describe blocks:

```ts
describe('Rendering - Button Text', () => {
  it('...displays a button with text "ログアウト"', () => {
    expect(screen.getByRole('button', { name: 'ログアウト' })).toBeInTheDocument()
  })
})

describe('Rendering - Accessible Role', () => {
  it('...the element has the button role', () => {
    expect(screen.getByRole('button')).toBeInTheDocument()  // subset of above
  })
})
```

`getByRole('button')` succeeding is a strict subset of `getByRole('button', { name: 'ログアウト' })` succeeding. If the first test passes, the second is guaranteed to pass; if the first fails (e.g. the element is rendered as `<div>` instead of `<button>`), the second would also fail. The "Accessible Role" test provides zero independent signal.

**Fix:** Remove the `'Rendering - Accessible Role'` describe block. The text-name query already asserts the accessible role implicitly.

Useful? React with 👍 / 👎.

Fixed. Removed the `'Rendering - Accessible Role'` describe block from `LogoutButton.small.test.tsx`. The `getByRole('button', { name: 'ログアウト' })` query in the "Button Text" test already implicitly asserts the accessible role. All 93 small tests continue to pass.

Disposition: **fixed** — `frontend/src/features/auth/components/LogoutButton.small.test.tsx`

---

`LogoutButton.tsx` line 13:

```tsx
onClick={() => { logout() }}
```

`logout` is a `() => void` function that takes no arguments. Wrapping it in an arrow function creates a new function reference on every render for no benefit. The correct form is:

```tsx
onClick={logout}
```

If `logout` were ever made async, the wrapper would silently swallow the returned Promise rather than surfacing it (a subtle future footgun). Passing `logout` directly makes intent clear and avoids the closure allocation.

Useful? React with 👍 / 👎.

Fixed. Changed `onClick={() => { logout() }}` to `onClick={logout}` in `LogoutButton.tsx`. The arrow wrapper was also causing the "called with no arguments" test to pass for the wrong reason — with direct assignment React passes the SyntheticEvent to the handler — so the corresponding test assertion was updated from `toHaveBeenCalledWith()` (zero-args check) to `toHaveBeenCalled()` (presence check), which correctly captures the intent. All 93 small tests and 108 medium tests pass.

Disposition: **fixed** — `frontend/src/features/auth/components/LogoutButton.tsx`, `frontend/src/features/auth/components/LogoutButton.small.test.tsx`
