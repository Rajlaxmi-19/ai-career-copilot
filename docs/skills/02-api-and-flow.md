# Skill Management — API & Flow

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/skills` | List skills; optional `?user_id=` filter |
| `GET` | `/api/skills/{id}` | Get one skill |
| `POST` | `/api/skills` | Create a skill |
| `PUT` | `/api/skills/{id}` | Update a skill (partial body) |
| `DELETE` | `/api/skills/{id}` | Delete a skill |

### Create request body

```json
{
  "user_id": "00000000-0000-0000-0000-000000000001",
  "name": "Python",
  "category": "Programming",
  "proficiency": "advanced",
  "description": "5 years backend development"
}
```

## End-to-end flow

```mermaid
sequenceDiagram
    participant UI as React SkillsPage
    participant API as FastAPI /api/skills
    participant DB as PostgreSQL

    UI->>API: GET /api/skills?user_id=...
    API->>DB: SELECT skills WHERE user_id = ...
    DB-->>API: rows
    API-->>UI: JSON list

    UI->>API: POST /api/skills
    API->>DB: INSERT INTO skills
    DB-->>API: new row
    API-->>UI: 201 + skill JSON

    UI->>API: PUT /api/skills/{id}
    API->>DB: UPDATE skills
    API-->>UI: updated skill JSON

    UI->>API: DELETE /api/skills/{id}
    API->>DB: DELETE FROM skills
    API-->>UI: 204 No Content
```

## Local setup

1. Start database: `docker compose up -d`
2. Run migrations: `cd backend && alembic upgrade head`
3. Seed demo user: `python -m scripts.seed_demo_user` (from `backend/`)
4. Start API: `uvicorn app.main:app --reload --app-dir backend` or from `backend/`: `uvicorn app.main:app --reload`
5. Start UI: `cd frontend && npm install && npm run dev`

Open http://localhost:5173/skills
