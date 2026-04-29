# MatdaanPath Testing Guide

## Backend (Pytest)

```bash
cd backend
venv\Scripts\activate
python -m pytest -q
```

Coverage includes:
- API contract and edge-case handling
- Chat service behavior (mocked/unconfigured paths)
- Deadlines/region filtering logic
- Detailed health endpoint and cache-control behavior

## Frontend (Lint + Unit Tests + Type Check)

```bash
cd frontend
npm run lint
npm run test:safe
node .\node_modules\typescript\bin\tsc --noEmit
```

Coverage includes:
- Chat widget interactions
- Eligibility checker flow
- Region selector behavior
- Google services runtime panel rendering

## Manual Verification

After deploying, verify:

- `/api/timeline/` returns stage data.
- `/api/glossary/` returns glossary entries.
- `/api/deadlines/` returns deadline rows.
- `/api/eligibility/rules` returns configured questions.
- `/health/detailed` reports `database_connected: true`.
