# 🗳️ MatdaanPath — AI-Powered Election Education Assistant

> **Empowering every Indian citizen to participate in democracy with confidence.**

MatdaanPath (मतदान पथ — *The Path to Voting*) is an AI-driven web application that guides users through the Indian election process in a simple, trustworthy, and accessible way.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Cloud%20Run-blue?style=for-the-badge&logo=google-cloud)](https://matdaanpath-app-135105451054.asia-south1.run.app)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **AI Chat Assistant** | Ask anything about Indian elections — powered by Gemini AI |
| 🗓️ **Election Timeline** | Step-by-step interactive election process visualization |
| ✅ **Eligibility Checker** | Find out if you're eligible to vote in seconds |
| 📖 **Glossary** | Searchable dictionary of election terms (EVM, VVPAT, Form 6, etc.) |
| 📅 **Important Dates** | Critical deadlines filtered by your region |
| 🧪 **90%+ Test Coverage** | Robust testing suite for both frontend (Vitest) and backend (Pytest) |
| 📊 **GCP Integration** | Full Google Cloud Logging, Error Reporting, and Analytics |

---

## 🏗️ Architecture

```
Browser
  └── Cloud Run (Single URL)
        └── nginx (port 8080)
             ├── /        → Next.js static frontend
             └── /api/*   → FastAPI backend (uvicorn on 127.0.0.1:8000)
```

**Stack:**
- **Frontend:** Next.js 16 + TypeScript + Framer Motion (Animations)
- **Backend:** FastAPI + SQLModel + Alembic
- **AI:** Google Gemini 2.0 Flash Lite via `google-genai` SDK
- **Google Services:** Cloud Logging, Error Reporting, Firebase Analytics
- **Testing:** Pytest (Backend), Vitest + React Testing Library (Frontend)
- **Deployment:** Google Cloud Run, Firebase Hosting

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+
- A [Gemini API key](https://aistudio.google.com/app/apikey) (starts with `AI`)

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt

# Create .env from example
copy .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Run migrations
alembic upgrade head

# Seed the database
python scripts/seed_data.py

# Start the server
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install

# For local dev (pointing to local backend)
echo NEXT_PUBLIC_API_URL=http://localhost:8000 > .env.local

npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🐳 Deploy to Cloud Run (Unified)

```bash
gcloud run deploy matdaanpath-app \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars "GEMINI_API_KEY=your_key,DATABASE_URL=sqlite:///./matdaanpath.db"
```

---

## 📁 Project Structure

```
MatdaanPath/
├── Dockerfile              # Unified multi-stage build
├── nginx.conf              # Reverse proxy config
├── supervisord.conf        # Process manager (nginx + uvicorn)
├── backend/
│   ├── app/
│   │   ├── api/            # FastAPI route handlers
│   │   ├── core/           # Database config
│   │   └── models/         # SQLModel ORM models
│   ├── alembic/            # Database migrations
│   └── scripts/            # DB seed scripts
├── frontend/
│   └── src/
│       ├── app/            # Next.js app router
│       ├── components/     # React UI components
│       └── lib/            # Shared utilities (API config)
└── Planning/               # Architecture & planning docs
```

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ | Gemini API key from AI Studio (starts with `AI`) |
| `DATABASE_URL` | ✅ | SQLite or PostgreSQL connection string |
| `GOOGLE_CLOUD_PROJECT` | Optional | GCP project ID for Vertex AI fallback |
| `GOOGLE_CLOUD_LOCATION` | Optional | GCP region (default: `asia-south1`) |

---

## 🧠 AI Chatbot Notes

The chatbot uses **Gemini 2.0 Flash Lite** with a free-tier API key. The free tier allows:
- 15 requests/minute
- 1,500 requests/day

The assistant enriches responses with verified context from the database (glossary terms, election stages) for accurate, grounded answers.

---

## 📜 License

MIT License — Built for the Google Cloud + AI Hackathon 2026.
