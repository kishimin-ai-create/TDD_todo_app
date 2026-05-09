## Review Target

Files created or modified during the Auth Pages TDD cycle:

- `frontend/src/shared/auth.ts`
- `frontend/src/shared/navigation.ts`
- `frontend/src/features/auth/hooks/useAuthForm.ts`
- `frontend/src/features/auth/pages/LandingPage.tsx`
- `frontend/src/features/auth/pages/LoginPage.tsx`
- `frontend/src/features/auth/pages/SignupPage.tsx`
- `frontend/src/features/auth/pages/LandingPage.test.tsx`
- `frontend/src/features/auth/pages/LoginPage.test.tsx`
- `frontend/src/features/auth/pages/SignupPage.test.tsx`
- `frontend/src/App.tsx`
- `frontend/src/App.test.tsx`

## Summary

The auth pages feature is well-structured overall. The `useAuthForm` hook correctly abstracts shared form logic, types are clean with no `any`, and the test suite covers the happy path and error path for both pages. However, there are **two real bugs**: (1) the submit button has no loading/disabled state, making double-submission possible, and (2) the navigation buttons in both LoginPage and SignupPage are missing an explicit `type="button"`, which can cause unintended form submissions in certain browser/framework combinations. Additionally, JWT tokens stored in `localStorage` are exposed to XSS, and `currentPageAtom` initialises to `'app-list'` instead of `'landing'`, creating a silent state inconsistency. Test coverage gaps exist for successful-login navigation and for network-failure scenarios.

---

**<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>
Double-submit possible — submit button never disabled during async request**

In `useAuthForm.ts` the `handleSubmit` handler fires `void submitAuthRequest()` and returns immediately. There is no `isLoading` / `isSubmitting` state, and the submit button is never disabled between the time the user clicks it and the response arrives. A user who double-clicks "Login" or "Sign Up" will fire two identical `POST` requests concurrently. If both succeed, `onSuccess` (and therefore `setAuth` + `goToAppList`) will be called twice, producing two Jotai state writes and two navigation side effects. If the first succeeds and the second races to a 401 (e.g. after a session is already created), the error handler can overwrite a valid `authAtom` back to an error UI.

**Fix:** Add an `isSubmitting` state to `useAuthForm`, set it to `true` before the fetch, `false` in the finally block, guard the handler early-return if already submitting, and pass `disabled={isSubmitting}` to both pages' submit buttons.

```ts
// useAuthForm.ts
const [isSubmitting, setIsSubmitting] = useState(false)

async function submitAuthRequest() {
  if (isSubmitting) return          // guard against re-entry
  setIsSubmitting(true)
  try { ... } catch { ... } finally { setIsSubmitting(false) }
}

return { ..., isSubmitting, handleSubmit }
```

Useful? React with 👍 / 👎.

Fixed. Added `isSubmitting` state to `useAuthForm`. The guard (`if (isSubmitting) return`) prevents re-entry, `setIsSubmitting(true)` fires before the fetch, and `setIsSubmitting(false)` runs in a `finally` block. Both `LoginPage` and `SignupPage` now destructure `isSubmitting` and pass `disabled={isSubmitting}` to their submit buttons. The button label also switches to `'Logging in…'` / `'Signing up…'` while in flight, giving the user clear visual feedback.

Disposition: **fixed** — `useAuthForm.ts`, `LoginPage.tsx`, `SignupPage.tsx`

---

Both `LoginPage.tsx` (line 56) and `SignupPage.tsx` (line 57) render a navigation button **outside** the `<form>` element, but without an explicit `type` attribute:

```tsx
<button onClick={goToSignup} ...>Sign Up</button>   // LoginPage
<button onClick={goToLogin}  ...>Login</button>      // SignupPage
```

The HTML specification defaults `<button>` to `type="submit"`. While a button outside a `<form>` element cannot submit that form, React's synthetic event system and certain test environments (and some third-party form libraries or portals) can re-parent elements in ways that break this assumption. The safer, semantically correct choice is always to be explicit. More concretely, if the DOM structure is ever reorganised to place these buttons inside the form (e.g. during a layout change), they will silently become submit triggers.

**Fix:** Add `type="button"` to both navigation buttons.

```tsx
<button type="button" onClick={goToSignup} ...>Sign Up</button>
```

Useful? React with 👍 / 👎.

Fixed. Added `type="button"` to the navigation button in `LoginPage.tsx` (the "Sign Up" link) and `SignupPage.tsx` (the "Login" link). Both buttons were outside `<form>`, but the explicit attribute eliminates the risk entirely and makes intent unambiguous for future layout changes.

Disposition: **fixed** — `LoginPage.tsx`, `SignupPage.tsx`

---

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>
JWT token stored in `localStorage` — full exposure to XSS**

`authAtom` uses `atomWithStorage('auth', null)`, which writes the JWT to `localStorage`. Any JavaScript executing on the page — including injected scripts from a DOM XSS vulnerability — can read `localStorage.getItem('auth')` and exfiltrate the token. This is the well-known `localStorage` vs `httpOnly cookie` tradeoff.

The spec explicitly requires `atomWithStorage` for E2E seed compatibility, so a full migration to cookies would require co-ordination with the backend. However the risk should be documented, and the team should ensure:

1. All user-supplied content is sanitised before rendering to prevent stored/reflected XSS.
2. A `Content-Security-Policy` header is configured on the backend to restrict inline scripts.
3. Tokens have short expiry times to limit the blast radius of theft.

Useful? React with 👍 / 👎.

Acknowledged. The spec requires `atomWithStorage` for E2E seed compatibility, so migration to `httpOnly` cookies is deferred. The three mitigations listed (content sanitisation, CSP header, short token expiry) have been noted for the team. No code change applied here — this is a tracked risk.

Disposition: **reply only** — spec constraint prevents full mitigation; risk acknowledged and documented.

---

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>
`currentPageAtom` initialises to `'app-list'` — silent inconsistency for unauthenticated users**

`navigation.ts` line 12:

```ts
export const currentPageAtom = atom<Page>({ name: 'app-list' })
```

On first load, an unauthenticated user has `currentPage.name === 'app-list'`. The auth gate in `App.tsx` catches this and correctly falls through to `<LandingPage />`. However the atom value says "app-list" while the rendered page is "landing" — two things are out of sync. Any code that reads `currentPageAtom` to make decisions (e.g. analytics, breadcrumbs, back-navigation logic) will get a wrong answer on initial render.

Additionally, if a future developer adds a case `if (currentPage.name === 'landing') ...` in the auth gate, an unauthenticated user will fall through to `<LandingPage />` silently rather than being explicitly routed.

**Fix:** Change the initial value to `{ name: 'landing' }` to make state honest:

```ts
export const currentPageAtom = atom<Page>({ name: 'landing' })
```

The auth gate already renders `<LandingPage />` as the final fallback, so this change does not alter runtime behaviour for unauthenticated users; it only makes the atom truthful.

Useful? React with 👍 / 👎.

Fixed. `currentPageAtom` initial value changed from `{ name: 'app-list' }` to `{ name: 'landing' }` in `navigation.ts`. Since `AppListPage` gates its own render on `currentPage.name === 'app-list'`, the downstream `AppListPage.test.tsx` tests (which relied on the old default) were updated to pass `initialPage: { name: 'app-list' }` explicitly. `App.test.tsx`'s authenticated route test was updated similarly. The `renderWithProviders` helper now implements the previously declared `initialPage` option using the `Page` type from navigation.

Disposition: **fixed** — `navigation.ts`, `renderWithProviders.tsx`, `AppListPage.test.tsx`, `App.test.tsx`

---

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>
No client-side validation before fetch — empty credentials silently reach the server**

`useAuthForm` submits the form with whatever `email` and `password` values are in state, including both being empty strings. The `<input type="email">` element provides browser-level validation only when the form is native-submitted; because `handleSubmit` calls `e.preventDefault()`, browser validation fires but React's controlled input path makes this inconsistent across browsers. An empty password is never caught by the browser since `type="password"` has no built-in format constraint.

The result: clicking "Login" or "Sign Up" with empty fields triggers an unnecessary network round-trip, and the user sees whatever generic error the backend returns (e.g. "Invalid credentials") rather than a clear "Password is required" message.

**Fix:** Add minimal guards in `submitAuthRequest` (or expose a `validate` function):

```ts
if (!email.trim() || !password) {
  setError('Email and password are required')
  return
}
```

Useful? React with 👍 / 👎.

Fixed. Added minimal guards at the top of `submitAuthRequest` in `useAuthForm.ts`: if `email.trim()` is empty or `password` is empty, `setError('Email and password are required')` is called and the function returns immediately — no fetch is made. This sits alongside the `isSubmitting` re-entry guard added for the P1 finding.

Disposition: **fixed** — `useAuthForm.ts`

---

**<sub><sub>![P3 Badge](https://img.shields.io/badge/P3-blue?style=flat)</sub></sub>
Tests do not cover successful login/signup → navigation to app-list**

`LoginPage.test.tsx` and `SignupPage.test.tsx` both assert that `authAtom` is populated after a successful response, but neither test asserts that `currentPageAtom` becomes `{ name: 'app-list' }`. The `onSuccess` callback calls `goToAppList()` — if that call were accidentally removed or if navigation were broken, no test would catch it.

**Fix:** Add a navigation assertion to the happy path tests:

```ts
await waitFor(() => {
  expect(store.get(currentPageAtom)).toEqual({ name: 'app-list' })
})
```

Useful? React with 👍 / 👎.

Fixed. The two separate happy-path tests in both `LoginPage.test.tsx` and `SignupPage.test.tsx` were merged into a single test that (a) asserts the full `authAtom` object with `toEqual` and (b) asserts `currentPageAtom` equals `{ name: 'app-list' }` in the same `waitFor` block, directly addressing this finding and the navigation coverage gap.

Disposition: **fixed** — `LoginPage.test.tsx`, `SignupPage.test.tsx`

---

**<sub><sub>![P3 Badge](https://img.shields.io/badge/P3-blue?style=flat)</sub></sub>
No test for network failure (fetch throws) — the `catch` branch is untested**

`useAuthForm.ts` has a `catch` block that sets `error` to `'An unexpected error occurred'` when the `fetch` itself rejects (e.g. DNS failure, network timeout, CORS pre-flight error). Neither `LoginPage.test.tsx` nor `SignupPage.test.tsx` covers this path. MSW can simulate a network error with `HttpResponse.error()`:

```ts
server.use(
  http.post('/api/v1/auth/login', () => HttpResponse.error()),
)
// then submit and assert role="alert" is shown
```

Without this test, a regression in the catch handler (e.g. a thrown expression that re-throws instead of setting state) would go undetected.

Useful? React with 👍 / 👎.

Fixed. Added a `'when the network request fails, then an error alert is displayed'` test to both `LoginPage.test.tsx` and `SignupPage.test.tsx`. Each test uses `HttpResponse.error()` via MSW to force a fetch rejection, then asserts that `role="alert"` appears, exercising the `catch` branch of `submitAuthRequest`.

Disposition: **fixed** — `LoginPage.test.tsx`, `SignupPage.test.tsx`

---

**<sub><sub>![P3 Badge](https://img.shields.io/badge/P3-blue?style=flat)</sub></sub>
Two near-identical happy path tests per page — merge into one assertion**

`LoginPage.test.tsx` contains two separate test cases for a successful login: one checks `auth?.token` and one checks `auth?.user.email`. Both have identical Arrange and Act sections (same MSW handler, same typing, same click). These would be cheaper as a single test that asserts the full auth object:

```ts
await waitFor(() => {
  expect(store.get(authAtom)).toEqual({
    token: 'test-token',
    user: { id: 'user-1', email: 'test@example.com' },
  })
})
```

The same duplication exists in `SignupPage.test.tsx`. Splitting by sub-property provides no additional safety coverage and doubles the maintenance cost.

Useful? React with 👍 / 👎.

Fixed. The two separate happy-path tests in `LoginPage.test.tsx` (`'authAtom is set with token'` and `'authAtom contains the correct user email'`) were merged into a single test `'when valid credentials are submitted, then authAtom is populated and page navigates to app-list'`. It asserts the complete `authAtom` value with `toEqual` and also asserts `currentPageAtom` becomes `{ name: 'app-list' }`. The same merge was applied to `SignupPage.test.tsx`. This eliminates the duplicated Arrange/Act sections while simultaneously covering the navigation gap (P3 above).

Disposition: **fixed** — `LoginPage.test.tsx`, `SignupPage.test.tsx`
