# Feature: API Logging

## Overview

The API logging feature provides structured, real-time logging of HTTP requests and responses. This enables developers and operations teams to debug issues, monitor API usage, track errors, and audit system behavior.

## Rationale

- **Debugging**: Quickly identify which API routes are being called and with what success/failure outcome
- **Monitoring**: Track API response times and status distributions to detect anomalies
- **Error Tracking**: Automatically log error responses with detailed error codes and messages for investigation
- **Audit Trail**: Maintain a record of API activity for security and compliance purposes

## Specification

### Routes Logged

Only /api/* routes are logged. Other routes such as /, /doc, and other static paths are excluded from logging.

### Successful Response Logging (2xx Status)

**Condition**: HTTP response status is 200-299

**Format**: `[METHOD] path → status (Xms)`

**Example**: `[GET] /api/v1/apps → 200 (5ms)`

**Components**:
- `[METHOD]`: HTTP method in uppercase (GET, POST, PUT, DELETE, etc.)
- `path`: Request URL path (e.g., `/api/v1/apps`, `/api/v1/apps/:id`)
- `status`: HTTP status code (e.g., 200, 201)
- `Xms`: Elapsed time in milliseconds

### Error Response Logging (4xx and 5xx Status)

**Condition**: HTTP response status is 400-599

**Format**: `[METHOD] path → ERROR status — code: message`

**Example**: `[POST] /api/v1/apps → ERROR 422 — VALIDATION_ERROR: Name is required`

**Components**:
- `[METHOD]`: HTTP method in uppercase
- `path`: Request URL path
- `status`: HTTP error status code (e.g., 404, 422, 500)
- `code`: Machine-readable error code from response body (e.g., `VALIDATION_ERROR`, `NOT_FOUND`, `CONFLICT`)
- `message`: Human-readable error message from response body

**Fallback Format** (if error details cannot be extracted):
When the response body does not contain a properly structured error object with `code` and `message` properties:

**Format**: `[METHOD] path → ERROR status`

**Example**: `[GET] /api/v1/apps/invalid-id → ERROR 400`

### Response Body Parsing

Error details (`code` and `message`) are extracted from the response JSON body using the following structure:

`json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE_HERE",
    "message": "Human readable message"
  }
}
`

**Edge Cases**:
- If the response body is not valid JSON, error logging falls back to the simple format
- If the response body is too large (> 10KB), parsing is skipped to avoid performance degradation
- If the `error` object is missing or does not contain both `code` and `message` properties, the fallback format is used
- If `code` or `message` values are not strings, the fallback format is used

### Environment Control

Logging is controlled by the `LOG_API_REQUESTS` environment variable:

- **Enabled**: When `process.env.LOG_API_REQUESTS === 'true'`
- **Disabled**: When `process.env.LOG_API_REQUESTS` is not set, `null`, `undefined`, or any value other than `'true'`

This allows operators to control logging verbosity without code changes.

### Implementation Details

- **Middleware**: Logging is implemented as an HTTP middleware in the Hono app
- **Console Output**: All logs are written to `console.log()` for successful requests and error responses
- **Warnings**: If error detail extraction fails (malformed JSON, etc.), a warning is logged via `console.warn()`
- **Timing**: Response time is measured from middleware entry to exit (includes application processing time)

## Non-Goals

- Structured logging (JSON format) — currently plain text
- Log aggregation or storage — logged to stdout only
- Request/response body logging — only metadata (status, code, message)
- Authentication token logging — excluded for security
