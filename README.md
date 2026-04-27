# MatdaanPath

MatdaanPath is an AI-powered election education platform that helps Indian citizens understand registration, eligibility, deadlines, and official voting process steps.

[Live Demo](https://matdaanpath-app-135105451054.asia-south1.run.app)

## Core Features

- AI chat assistant grounded with local election context.
- Election timeline with step-by-step stage walkthrough.
- Eligibility checker driven by configurable backend rules.
- Searchable glossary for election terminology.
- Region-aware deadlines with national fallback.
- Google integrations: Gemini, Cloud Logging/Error Reporting, Firebase Analytics.

## Architecture

```text
Browser
  -> Cloud Run (single URL)
      -> nginx (port 8080)
          -> /         static Next.js frontend
          -> /api/*    FastAPI backend on 127.0.0.1:8000
```

## Tech Stack

- Frontend: Next.js 16, TypeScript, Framer Motion
- Backend: FastAPI, SQLModel, Alembic
- AI: Gemini (`google-genai`)
- Observability: Google Cloud Logging + Error Reporting
- Testing: Pytest, Vitest, React Testing Library
- Deployment: Google Cloud Run

## Local Development

### One-command local run (recommended)

```powershell
.\tools\start-local.ps1
```

This script:
- runs migrations + seed
- starts backend on `http://localhost:8000`
- starts frontend on `http://localhost:3000`
- auto-falls back to static frontend when local policy blocks Next.js worker spawn (`spawn EPERM`)

To stop both processes:

```powershell
.\tools\stop-local.ps1
```

Or run in one interactive terminal session that stays alive:

```powershell
.\tools\run-local.ps1
```

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
alembic upgrade head
python scripts/seed_data.py
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
echo NEXT_PUBLIC_API_URL=http://localhost:8000 > .env.local
npm run dev
```

## Environment Variables (Backend)

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Gemini API key (recommended for chat) |
| `GOOGLE_CLOUD_PROJECT` | Enables Vertex fallback and Cloud observability |
| `GOOGLE_CLOUD_LOCATION` | Vertex location, default `asia-south1` |
| `GEMINI_MODEL_ID` | Gemini model override, default `gemini-2.0-flash-lite` |
| `DATABASE_URL` | SQLite or PostgreSQL connection string |
| `CORS_ALLOW_ORIGINS` | Comma-separated allowed frontend origins |
| `DB_POOL_SIZE` | PostgreSQL base pool size |
| `DB_MAX_OVERFLOW` | PostgreSQL pool overflow limit |
| `RUN_DB_MIGRATIONS_ON_STARTUP` | Runs Alembic migration during container boot |
| `RUN_DB_SEED_ON_STARTUP` | Seeds baseline data during container boot |

## API Diagnostics

- `GET /health` basic liveness check
- `GET /health/detailed` database connectivity + table counts + observability status
- `GET /api/google-services/status` Gemini and Google runtime integration status

## Deployment Notes

The production container runs:
1. `alembic upgrade head`
2. `python scripts/bootstrap.py` (seed/migration orchestration)
3. FastAPI + nginx via `supervisord`

This ensures fresh instances come up with migrated and seeded data.
