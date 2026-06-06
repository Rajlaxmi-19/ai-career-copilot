# Phase 1 — Auth Database Schema

## Tables

### `users`

Stores credentials and account state for JWT authentication.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key; never exposed in JWT as sole identifier without validation |
| `email` | VARCHAR(255) | Unique login identifier |
| `password_hash` | VARCHAR(255) | bcrypt hash; NULL for future OAuth-only accounts |
| `role` | ENUM | `user`, `premium`, `admin` |
| `is_active` | BOOLEAN | Soft disable without delete |
| `email_verified_at` | TIMESTAMPTZ | Optional; used later for verification flow |
| `created_at` | TIMESTAMPTZ | Audit |
| `updated_at` | TIMESTAMPTZ | Audit |

## Enum: `user_role`

PostgreSQL native enum keeps invalid roles out of the database.

## Indexes

- `ix_users_email` — unique index on `email` for fast login lookups

## Auth design notes

- Passwords are **never** stored in plain text; only `password_hash`.
- JWT will carry `sub` = user `id` (string UUID); backend validates user still exists and `is_active`.
- Refresh tokens are **not** in this migration; add `refresh_tokens` table in Phase 2 if needed.
