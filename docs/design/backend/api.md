# API Design - TDD Todo App

## Overview

This document describes the REST API specifications for the TDD Todo Application. The API provides endpoints to manage Apps and Todos.

**Base URL**: `/api/v1`  
**Response Format**: JSON  
**Status Codes**: HTTP standard codes

---

## Response Format

### Success Response

```json
{
  "data": {},
  "success": true
}
```

### Error Response

```json
{
  "data": null,
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  }
}
```

### Notes

- GET responses do NOT include `deletedAt` field (soft delete is handled at DB level)
- Timestamps are in ISO 8601 format (e.g., "2026-04-12T10:30:00Z")

---

## App Management

### 1. Create App

**Endpoint**: `POST /api/v1/apps`

**Request Body**:

```json
{
  "name": "string (required, max 100 chars)"
}
```

**Response** (201 Created):

```json
{
  "data": {
    "id": "uuid",
    "name": "string",
    "createdAt": "ISO 8601 timestamp",
    "updatedAt": "ISO 8601 timestamp"
  },
  "success": true
}
```

**Error Cases**:

- 422: Invalid input (name missing or exceeds 100 chars)
- 409: App name already exists (UNIQUE constraint violation)

---

### 2. Get App List

**Endpoint**: `GET /api/v1/apps`

**Query Parameters**:

- None (returns all active Apps)

**Response** (200 OK):

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "createdAt": "ISO 8601 timestamp",
      "updatedAt": "ISO 8601 timestamp"
    }
  ],
  "success": true
}
```

---

### 3. Get App Detail

**Endpoint**: `GET /api/v1/apps/{appId}`

**Path Parameters**:

- `appId`: UUID of the App

**Response** (200 OK):

```json
{
  "data": {
    "id": "uuid",
    "name": "string",
    "createdAt": "ISO 8601 timestamp",
    "updatedAt": "ISO 8601 timestamp"
  },
  "success": true
}
```

**Error Cases**:

- 404: App not found

---

### 4. Update App

**Endpoint**: `PUT /api/v1/apps/{appId}`

**Path Parameters**:

- `appId`: UUID of the App

**Request Body**:

```json
{
  "name": "string (optional, max 100 chars)"
}
```

**Response** (200 OK):

```json
{
  "data": {
    "id": "uuid",
    "name": "string",
    "createdAt": "ISO 8601 timestamp",
    "updatedAt": "ISO 8601 timestamp"
  },
  "success": true
}
```

**Error Cases**:

- 422: Invalid input
- 404: App not found
- 409: App name already exists

---

### 5. Delete App (Soft Delete)

**Endpoint**: `DELETE /api/v1/apps/{appId}`

**Path Parameters**:

- `appId`: UUID of the App

**Response** (200 OK):

```json
{
  "data": {
    "id": "uuid",
    "name": "string",
    "createdAt": "ISO 8601 timestamp",
    "updatedAt": "ISO 8601 timestamp"
  },
  "success": true
}
```

**Behavior**: Sets `deletedAt` timestamp (soft delete). Cascades to delete all associated Todos.

**Error Cases**:

- 404: App not found

---

## Todo Management

### 1. Create Todo

**Endpoint**: `POST /api/v1/apps/{appId}/todos`

**Path Parameters**:

- `appId`: UUID of the App

**Request Body**:

```json
{
  "title": "string (required, max 200 chars)",
  "completed": "boolean (optional, defaults to false)"
}
```

**Response** (201 Created):

```json
{
  "data": {
    "id": "uuid",
    "appId": "uuid",
    "title": "string",
    "completed": false,
    "createdAt": "ISO 8601 timestamp",
    "updatedAt": "ISO 8601 timestamp"
  },
  "success": true
}
```

**Error Cases**:

- 422: Invalid input (title missing or exceeds 200 chars)
- 404: App not found

---

### 2. Get Todo List by App

**Endpoint**: `GET /api/v1/apps/{appId}/todos`

**Path Parameters**:

- `appId`: UUID of the App

**Query Parameters**:

- None (returns all active Todos for the App)

**Response** (200 OK):

```json
{
  "data": [
    {
      "id": "uuid",
      "appId": "uuid",
      "title": "string",
      "completed": boolean,
      "createdAt": "ISO 8601 timestamp",
      "updatedAt": "ISO 8601 timestamp"
    }
  ],
  "success": true
}
```

**Error Cases**:

- 404: App not found

---

### 3. Get Todo Detail

**Endpoint**: `GET /api/v1/apps/{appId}/todos/{todoId}`

**Path Parameters**:

- `appId`: UUID of the App
- `todoId`: UUID of the Todo

**Response** (200 OK):

```json
{
  "data": {
    "id": "uuid",
    "appId": "uuid",
    "title": "string",
    "completed": boolean,
    "createdAt": "ISO 8601 timestamp",
    "updatedAt": "ISO 8601 timestamp"
  },
  "success": true
}
```

**Error Cases**:

- 404: App not found or Todo not found

---

### 4. Update Todo

**Endpoint**: `PUT /api/v1/apps/{appId}/todos/{todoId}`

**Path Parameters**:

- `appId`: UUID of the App
- `todoId`: UUID of the Todo

**Request Body**:

```json
{
  "title": "string (optional, max 200 chars)",
  "completed": "boolean (optional)"
}
```

**Response** (200 OK):

```json
{
  "data": {
    "id": "uuid",
    "appId": "uuid",
    "title": "string",
    "completed": boolean,
    "createdAt": "ISO 8601 timestamp",
    "updatedAt": "ISO 8601 timestamp"
  },
  "success": true
}
```

**Error Cases**:

- 422: Invalid input
- 404: App not found or Todo not found

---

### 5. Delete Todo (Soft Delete)

**Endpoint**: `DELETE /api/v1/apps/{appId}/todos/{todoId}`

**Path Parameters**:

- `appId`: UUID of the App
- `todoId`: UUID of the Todo

**Response** (200 OK):

```json
{
  "data": {
    "id": "uuid",
    "appId": "uuid",
    "title": "string",
    "completed": boolean,
    "createdAt": "ISO 8601 timestamp",
    "updatedAt": "ISO 8601 timestamp"
  },
  "success": true
}
```

**Behavior**: Sets `deletedAt` timestamp (soft delete). Todo is logically removed.

**Error Cases**:

- 404: App not found or Todo not found

---

## HTTP Status Codes

| Code | Meaning                                                 |
| ---- | ------------------------------------------------------- |
| 200  | OK - Request successful                                 |
| 201  | Created - Resource successfully created                 |
| 404  | Not Found - Resource not found                          |
| 409  | Conflict - Constraint violation (e.g., duplicate name)  |
| 422  | Unprocessable Entity - Validation error (invalid input) |
| 500  | Internal Server Error                                   |

---

## Data Validation Rules

### App

- `name`: Required, String, max 100 characters, must be unique
- Cannot be empty or whitespace-only

### Todo

- `title`: Required, String, max 200 characters
- `completed`: Boolean, defaults to false
- Cannot be empty or whitespace-only
- Must be associated with a valid App (appId)
