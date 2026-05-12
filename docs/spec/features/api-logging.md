# API Request/Response Logging Specification

## Overview

The TDD Todo App implements comprehensive request/response logging for API endpoints to support debugging, monitoring, and error tracking in production environments.

## Behavior

### Scope: Route Filtering

- **Logged**: Only `/api/*` routes (all API endpoints)
- **Not Logged**: Root route `/`, documentation routes `/doc`, and other non-API routes
- **Reason**: API logging focuses on business logic operations, not framework/documentation serving

### Success Response Logging (2xx Status)

**Log Format**: `[METHOD] path → status (Xms)`

**Examples**:
```
[GET] /api/v1/apps → 200 (2ms)
[POST] /api/v1/apps → 201 (5ms)
[PUT] /api/v1/apps/abc-123 → 200 (3ms)
[DELETE] /api/v1/apps/abc-123 → 200 (1ms)
```

**Components**:
- `[METHOD]`: HTTP method in uppercase, enclosed in square brackets
- `path`: Full request path including any parameters
- `→`: Arrow separator (right arrow character)
- `status`: HTTP status code (200, 201, etc.)
- `(Xms)`: Response time in milliseconds, enclosed in parentheses

### Error Response Logging (4xx, 5xx Status)

**Log Format**: `[METHOD] path → ERROR status — code: message`

**Examples**:
```
[POST] /api/v1/auth/signup → ERROR 409 — EMAIL_ALREADY_EXISTS: User with this email already exists
[POST] /api/v1/auth/login → ERROR 401 — INVALID_CREDENTIALS: Invalid email or password
[GET] /api/v1/apps/invalid-id → ERROR 404 — NOT_FOUND: Resource not found
[POST] /api/v1/apps → ERROR 422 — VALIDATION_ERROR: Invalid input: expected string, received undefined
```

**Components**:
- `[METHOD]`: HTTP method in uppercase, enclosed in square brackets
- `path`: Full request path including any parameters
- `→`: Arrow separator (right arrow character)
- `ERROR`: Literal keyword to indicate error response
- `status`: HTTP status code (4xx or 5xx)
- `—`: Double dash separator (em dash character)
- `code`: Error code from response body (e.g., `VALIDATION_ERROR`, `NOT_FOUND`)
- `message`: Human-readable error message from response body

### Fallback Error Logging

When error details cannot be extracted from the response body, use simplified format:

**Fallback Format**: `[METHOD] path → ERROR status`

**When Fallback is Used**:
- Malformed JSON in response body
- Response body missing `error` object
- Error object missing `code` or `message` properties
- Non-string values for `code` or `message`
- Response body too large (> 10KB)

**Example**:
```
[GET] /api/v1/apps/unknown → ERROR 404
```

## Environment Control

### Enabling/Disabling Logging

API logging is controlled via the `LOG_API_REQUESTS` environment variable:

- **`LOG_API_REQUESTS=true`**: Logging is enabled (string comparison)
- **`LOG_API_REQUESTS` not set or any other value**: Logging is disabled
- **Default**: Disabled (no logging)

**Usage**:
```bash
# Enable logging in development
export LOG_API_REQUESTS=true
npm run dev

# Disable logging in production (default)
npm run build && npm start
```

### Rationale

Operators can control logging verbosity without code changes or redeployment:
- In development: Enable to debug request/response flow
- In production: Disable by default to reduce log noise
- Can be toggled at runtime on some container platforms

## Expected Response Structure

The logging middleware expects error responses to follow this structure:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
```

**Notes**:
- The middleware clones and parses the response body for every error response
- If the structure differs, the fallback format is used
- Warning logs are emitted to stderr when extraction fails (for debugging)

## Side Effects and Performance

### Response Body Parsing

- The response body is **cloned** once per request (does not affect the original response sent to client)
- Parsing is only done for **error responses** (4xx, 5xx status codes)
- **Size guard**: If response body exceeds 10KB, extraction is skipped and fallback format is used

### Logging Output

- All logs are written to `console.log()` (stdout)
- Can be captured and redirected by container orchestration platforms
- Warning logs for extraction failures are written to `console.warn()` (stderr)

## Rationale and Use Cases

### Debugging
- Developers can trace API request/response flow during development
- Error details are logged for quick debugging of production issues

### Monitoring
- Operators can track API performance via response times
- Error responses are captured for alerting and monitoring systems

### Error Tracking
- All error responses are logged with context (method, path, status, code, message)
- Enables quick triage of production issues

### Audit Trail
- Complete record of API activity when logging is enabled
- Can be analyzed for security and compliance purposes

## Implementation Details

### Location
- `backend/src/infrastructure/hono-app.ts` — Logging middleware and helper functions

### Helper Functions
- `shouldLogPath(path)` — Determines if path should be logged (filters for `/api/*`)
- `isSuccessStatus(status)` — Checks if status is 2xx
- `isErrorStatus(status)` — Checks if status is 4xx or 5xx
- `logSuccessRequest()` — Outputs success log
- `logErrorRequest()` — Outputs error log with extracted details
- `extractErrorDetails()` — Safely extracts error code and message from response

### Testing
- Integration tests in `backend/src/tests/integrations/infrastructure/hono-app.medium.test.ts`
- Tests verify logging format, route filtering, error details extraction, and edge cases
- 51 test cases covering happy paths, boundary cases, and error scenarios
