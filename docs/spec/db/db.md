# Database Design - TDD Todo App

## Overview

This document describes the database schema for the TDD Todo Application. The application manages Todo items and their associated App configurations.

**Database System**: MySQL  
**Character Set**: utf8mb4  
**Collation**: utf8mb4_unicode_ci

---

## Entity-Relationship (ER) Diagram

```
┌─────────────────┐          ┌────────────────┐
│      App        │          │      Todo      │
├─────────────────┤      1..N ├────────────────┤
│ id (PK, UUID)   │◇────────◇─│ id (PK, UUID)  │
│ name            │          │ appId (FK)     │
│ createdAt       │          │ title          │
│ updatedAt       │          │ completed      │
│ deletedAt       │          │ createdAt      │
└─────────────────┘          │ updatedAt      │
                             │ deletedAt      │
                             └────────────────┘
```

**Relationship**: One App has many Todos  
**Cardinality**: 1:N  
**Constraint**: Foreign Key (appId references App.id)

---

## Table Definitions

### 1. App Table

**Purpose**: Store application/workspace configurations  
**Soft Delete**: Yes (deletedAt column)

| Column    | Type         | Null | Default           | Constraint                  | Description                                |
| --------- | ------------ | ---- | ----------------- | --------------------------- | ------------------------------------------ |
| id        | CHAR(36)     | NO   | UUID()            | PRIMARY KEY                 | Unique identifier (UUID format)            |
| name      | VARCHAR(100) | NO   |                   | UNIQUE                      | Application name                           |
| createdAt | DATETIME     | NO   | CURRENT_TIMESTAMP |                             | Timestamp when App was created             |
| updatedAt | DATETIME     | NO   | CURRENT_TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Timestamp when App was last updated        |
| deletedAt | DATETIME     | YES  | NULL              |                             | Soft delete timestamp (NULL = not deleted) |

### 2. Todo Table

**Purpose**: Store individual Todo items  
**Soft Delete**: Yes (deletedAt column)

| Column    | Type         | Null | Default           | Constraint                  | Description                                     |
| --------- | ------------ | ---- | ----------------- | --------------------------- | ----------------------------------------------- |
| id        | CHAR(36)     | NO   | UUID()            | PRIMARY KEY                 | Unique identifier (UUID format)                 |
| appId     | CHAR(36)     | NO   |                   | FOREIGN KEY                 | Reference to App.id                             |
| title     | VARCHAR(200) | NO   |                   |                             | Title/description of the Todo item              |
| completed | BOOLEAN      | NO   | FALSE             |                             | Status flag (true = completed, false = pending) |
| createdAt | DATETIME     | NO   | CURRENT_TIMESTAMP |                             | Timestamp when Todo was created                 |
| updatedAt | DATETIME     | NO   | CURRENT_TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Timestamp when Todo was last updated            |
| deletedAt | DATETIME     | YES  | NULL              |                             | Soft delete timestamp (NULL = not deleted)      |

---

## Indexes

### App Table

```sql
PRIMARY KEY (id)
UNIQUE INDEX idx_app_name (name)
INDEX idx_app_deletedAt (deletedAt)
```

### Todo Table

```sql
PRIMARY KEY (id)
INDEX idx_todo_appId (appId)
INDEX idx_todo_app_active (appId, deletedAt, completed)
INDEX idx_todo_deletedAt (deletedAt)
```

---

## Foreign Key Constraints

```
Todo.appId → App.id
  - ON DELETE CASCADE
  - ON UPDATE CASCADE
```

---

## Soft Delete Strategy

Both tables use soft delete with `deletedAt` column:

- **Active Record**: `deletedAt IS NULL`
- **Deleted Record**: `deletedAt IS NOT NULL`

---

## Data Constraints & Rules

| Rule                       | Details                                                   |
| -------------------------- | --------------------------------------------------------- |
| **App Name Uniqueness**    | No two active Apps with same name (max 100 characters)    |
| **Todo Title Required**    | Every Todo must have non-empty title (max 200 characters) |
| **App Reference Required** | Every Todo must reference valid App                       |
| **Foreign Key Constraint** | Prevents orphaned Todos                                   |
