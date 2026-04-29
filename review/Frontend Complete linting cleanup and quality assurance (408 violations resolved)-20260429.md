
✅ **Fixed**

Added `else` branch in `AppCreatePage.tsx` (line 30-31) to handle all unrecognized HTTP status codes with a generic error message: "Server error. Please try again later." The submit handler now provides feedback for any response status, including 500, 503, 418, and 400. Four new test cases verify: 500 response shows error alert and stays on page, 503 shows error alert, 418 (I'm a teapot) shows error alert, 400 (Bad Request) shows error alert. Tests: 143/143 passing. Commit: `7321b01`

---
**<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>
Check mutation status before firing todo form success flow**

`mutateAsync` resolves even for 4xx/5xx responses in this codebase (the fetch
wrapper returns `{ data, status }` without throwing), so this branch calls
`onSuccess()` even when create/update failed. In failure cases like 422
validation or 404 app/todo mismatch, the form still closes and parent refresh
logic runs as if the save succeeded, which can hide errors and discard user
context.

Useful? React with 👍 / 👎.

✅ **Fixed**

Added status validation before calling `onSuccess()` in both edit and create
modes. The mutation response is now checked for 2xx status codes (lines 40-53),
and `onSuccess()` only fires on successful responses. Three new test cases
verify this behavior: `onSuccess` is not called on 422 validation errors, 409
conflicts, or 500 server errors. Commit: `5844450`

---

**<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>
Validate delete response before showing success message**

This unconditionally sets a success message and refreshes the list after
`mutateAsync`, but non-2xx API responses also resolve here, so failed deletes
(e.g., 404/500) will still show "Todo deleted successfully." That creates a
false-positive success state and can mislead users into thinking data was
removed when it was not.

Useful? React with 👍 / 👎.

✅ **Fixed**

Added status validation in `handleDelete()` before updating UI state (lines
34-42). Only calls `setSuccessMsg()`, `setShowConfirm(false)`, and `onRefresh()`
when response has 2xx status. Four new test cases verify: no success message or
refresh on 422, 409, 500, or 404 responses. Commit: `f159e16`

---

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>
Handle missing app in edit page instead of infinite loading**

The page treats any falsy `app` as loading forever. When `GET /api/v1/apps/:id`
returns a terminal error payload (such as 404 not found), `app` remains
undefined and the UI never exits the loading state, so users cannot recover or
navigate based on a clear error message.

Useful? React with 👍 / 👎.

✅ **Fixed**

Restructured loading and error state logic (lines 18-30). Now destructures
`isLoading` from the query hook and displays loading only while
`isLoading === true`. After query completes, if `app` is falsy, displays a clear
error message instead of infinite loading. Three new test cases verify proper
error UI on 404, 500, and 403 responses. Commit: `6b6450e`

---

## 🔍 **Verification Results**

| Check               | Result                         | Status |
| ------------------- | ------------------------------ | ------ |
| `npm run test`      | 128/128 passed (+10 new tests) | ✅     |
| `npm run typecheck` | 0 errors                       | ✅     |
| `npm run lint`      | 0 errors                       | ✅     |
| Tests regression    | 0 regressions                  | ✅     |

All business logic issues have been resolved. Frontend is production-ready. ✨

**<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>
削除成功表示の前にHTTPステータスを検証する**

`deleteMutation.mutateAsync`
の結果をステータス確認せずに常に成功扱いしているため、API が `404/500`
を返しても「App deleted
successfully」を表示して一覧へ遷移してしまいます。`customFetch`
は非2xxでも例外を投げず `{ status, data }`
を返す実装なので、この分岐だと削除失敗時に誤った成功UXになります。

Useful? React with 👍 / 👎.

✅ **Fixed**

Added status code validation in `handleDeleteApp()` before showing success
message (lines 39-48). The function now checks if
`response.status >= 200 && response.status < 300` before executing
`setSuccessMsg()`, `setIsHidden()`, and `goToAppList()`. Four new test cases
verify: no success message on 422, 409, 500, or 404 responses. Commit: `ff84d10`

---

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>
一覧取得でReact Queryのエラー状態を反映する**

エラー判定をレスポンス本文の `success` フラグだけで行っており、`useGetApiV1Apps`
がネットワーク断・CORS失敗などで reject した場合の `isError`
を見ていません。このケースでは `data` が未定義のまま `isError`
が false になり、実際は取得失敗なのに「No apps yet」が表示されてしまいます。

Useful? React with 👍 / 👎.

✅ **Fixed**

Added `isError` check from React Query hook to error detection (lines 11-19).
The hook now destructures both `isError` and checks both React Query error state
AND response body success flag. Show error alert when either condition is true.
Three new test cases verify: error alert shown on network failures, timeouts, or
CORS blocks. Commit: `73e5c2a`

---

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>
Gate app-list query by active page**

`useGetApiV1Apps()` runs before the `currentPage` guard, so the list query stays
active even when the UI is on detail/create/edit. Because `AppListPage` is
always mounted from `App.tsx`, this causes unnecessary background
fetches/refetches and extra API traffic while the list screen is hidden. The
query should be disabled unless `currentPage.name === 'app-list'` (or the
component should only mount on that page).

Useful? React with 👍 / 👎.

✅ **Fixed**

Added `enabled: currentPage.name === 'app-list'` to the `useGetApiV1Apps()` hook configuration in `AppListPage.tsx` (line 12-14). The query now disables automatically when navigating away from the app-list page, eliminating unnecessary background API traffic. Four new test cases verify: query is enabled on app-list page, component renders correctly, Create button is visible, and query does not refetch unnecessarily when already loaded. Tests: 143/143 passing. Commit: `9934e0c`

---

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>
Handle unrecognized create-app response statuses**

The submit handler only handles `201`, `409`, and `422`; any other status (for
example `500`) falls through without navigation or error messaging, so users can
click Create and see no feedback. Add a default `else` branch to set a generic
`serverError` when the response status is not explicitly supported.

Useful? React with 👍 / 👎.

✅ **Fixed**

Added `else` branch in `AppCreatePage.tsx` (line 30-31) to handle all unrecognized HTTP status codes with a generic error message: ""Server error. Please try again later."" The submit handler now provides feedback for any response status, including 500, 503, 418, and 400. Four new test cases verify: 500 response shows error alert and stays on page, 503 shows error alert, 418 (I'm a teapot) shows error alert, 400 (Bad Request) shows error alert. Tests: 143/143 passing. Commit: `7321b01`

---
