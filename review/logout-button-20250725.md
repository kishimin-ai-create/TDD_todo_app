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

---

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>
No server-side token revocation — JWT remains valid on the backend after logout**

`useLogout` only clears client-side state. There is no call to a backend `/logout` endpoint, and a search of `backend/src/` confirms none exists. The JWT token stored under `localStorage['auth']` continues to be accepted by the server until its expiry.

If an attacker has already exfiltrated the token (via XSS, network interception, or shoulder-surfing), the user clicking "ログアウト" does nothing to invalidate that copy. The token is still a working credential for the full remainder of its lifetime.

Concrete mitigations (in priority order):
1. Implement a `POST /api/v1/auth/logout` endpoint that server-side revokes or blacklists the token, and call it from `useLogout` before clearing the atoms.
2. If stateless JWTs are required by architecture, set a short expiry (< 15 min) and issue refresh tokens with a server-managed revocation list.
3. At minimum, document the residual risk and ensure token expiry is short enough to bound the attack window.

Useful? React with 👍 / 👎.

---

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>
`import/order: "off"` applied globally to all test files — justification is technically incorrect**

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

---

**<sub><sub>![P3 Badge](https://img.shields.io/badge/P3-blue?style=flat)</sub></sub>
Redundant "Accessible Role" test — fully covered by the "Button Text" test**

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

---

**<sub><sub>![P3 Badge](https://img.shields.io/badge/P3-blue?style=flat)</sub></sub>
Unnecessary inline arrow wrapper on `onClick`**

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
