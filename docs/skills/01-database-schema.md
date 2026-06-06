# Skill Management — Database Schema

## Tables

### `skills`

Stores a user's professional skills for career tracking and AI recommendations.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK → `users.id`; cascade delete when user is removed |
| `name` | VARCHAR(100) | Skill name, e.g. "Python", "Leadership" |
| `category` | VARCHAR(100) | Optional grouping, e.g. "Programming", "Soft Skills" |
| `proficiency` | ENUM | `beginner`, `intermediate`, `advanced`, `expert` |
| `description` | TEXT | Optional notes or context |
| `created_at` | TIMESTAMPTZ | Audit |
| `updated_at` | TIMESTAMPTZ | Audit |

## Enum: `proficiency_level`

PostgreSQL native enum for consistent proficiency values.

## Indexes

- `ix_skills_user_id` — fast lookup of all skills for a user

## Relationships

- Each skill belongs to exactly one `users` row.
- Deleting a user removes all of their skills (`ON DELETE CASCADE`).
