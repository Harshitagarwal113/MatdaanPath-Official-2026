# Testing Guide for MatdaanPath

This project includes a comprehensive testing suite to ensure reliability and performance.

## Backend Tests (Pytest)

The backend tests cover API endpoints, database models, and AI chat integration (mocked).

### Run Backend Tests:
```bash
cd backend
# Ensure virtual environment is active
pip install -r requirements.txt
$env:PYTHONPATH="."  # Windows (PowerShell)
pytest tests/
```

## Frontend Tests (Vitest)

The frontend tests verify component rendering, user interactions, and accessibility attributes.

### Run Frontend Tests:
```bash
cd frontend
npm install
npm test
```

## Coverage Goals
- **Backend:** 90%+ endpoint coverage.
- **Frontend:** Core interactive components (Chat, Timeline, Eligibility).
- **Accessibility:** 100% ARIA label and role validation in tests.
