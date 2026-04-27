# 🗳️ MatdaanPath

[![Deployment](https://img.shields.io/badge/Deploy-Cloud%20Run-blue?logo=google-cloud&logoColor=white)](https://matdaanpath-app-135105451054.asia-south1.run.app)
[![Framework](https://img.shields.io/badge/Frontend-Next.js%2015-black?logo=next.js)](https://nextjs.org/)
[![Backend](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![AI](https://img.shields.io/badge/AI-Gemini%202.0-orange?logo=google-gemini&logoColor=white)](https://ai.google.dev/)

**MatdaanPath** is an AI-powered election education platform designed to empower Indian citizens. It simplifies complex election processes, providing clear information on registration, eligibility, and official voting steps through a modern, intuitive interface.

🔗 **[Live Demo](https://matdaanpath-app-135105451054.asia-south1.run.app)**

---

## ✨ Key Features

- 🤖 **AI Chat Assistant**: Context-aware guidance on voting queries, powered by Gemini 2.0.
- 📅 **Interactive Timeline**: A step-by-step walkthrough of the election lifecycle.
- ⚖️ **Eligibility Checker**: Instant verification of voting requirements based on real-time backend rules.
- 📖 **Election Glossary**: A comprehensive database to demystify complex terminology.
- 📍 **Region-Aware Deadlines**: Stay updated with localized schedules and national fallbacks.
- 🔔 **Smart Reminders**: Integrated with Google Cloud Tasks for timely notifications.

---

## 🏗️ Architecture

MatdaanPath follows a **Cloud Native** architecture, deployed as a unified container on Google Cloud Run.

```mermaid
graph TD
    User([User Browser]) --> Nginx[Nginx Reverse Proxy]
    subgraph "Cloud Run Container"
        Nginx -->|Static Assets| NextJS[Next.js Frontend]
        Nginx -->|/api/*| FastAPI[FastAPI Backend]
        FastAPI --> SQLite[(SQLite / Cloud SQL)]
        FastAPI --> Gemini[Gemini AI Engine]
        FastAPI --> CloudTasks[Google Cloud Tasks]
    end
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Styling**: Vanilla CSS with modern Glassmorphism effects
- **Animations**: Framer Motion
- **Language**: TypeScript

### Backend
- **Core**: FastAPI
- **Data Access**: SQLModel (SQLAlchemy + Pydantic)
- **Migrations**: Alembic
- **Task Queue**: Google Cloud Tasks

### Infrastructure & DevOps
- **Cloud**: Google Cloud Platform (GCP)
- **Deployment**: Cloud Run
- **Observability**: Cloud Logging & Error Reporting
- **Secrets**: Google Secret Manager

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- Python 3.11+
- Google Cloud SDK (for deployment/cloud features)

### Quick Start (Local Development)
The easiest way to get started is using the provided PowerShell scripts in the `tools/` directory.

```powershell
# Initialize and start both Frontend & Backend
.\tools\start-local.ps1

# To stop all services
.\tools\stop-local.ps1
```

### Manual Setup

#### Backend
1. `cd backend`
2. `python -m venv venv && .\venv\Scripts\activate`
3. `pip install -r requirements.txt`
4. `alembic upgrade head`
5. `python scripts/seed_data.py`
6. `uvicorn app.main:app --reload --port 8000`

#### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev` (Frontend runs on `http://localhost:3000`)

---

## 📝 Environment Variables

### Backend (`.env`)
| Variable | Description |
| :--- | :--- |
| `GEMINI_API_KEY` | Your Google AI API Key |
| `GOOGLE_CLOUD_PROJECT` | GCP Project ID |
| `DATABASE_URL` | Connection string (Default: `sqlite:///./matdaanpath.db`) |
| `ADMIN_API_TOKEN` | Secure token for administrative operations |

---

## 🛡️ API Diagnostics

- `GET /health`: Basic liveness check.
- `GET /health/detailed`: Deep health check (DB, counts, observability).
- `GET /api/google-services/status`: Runtime status of Gemini and Cloud integrations.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request or open an issue for feature requests.

---

Developed with ❤️ by [Harshit Agarwal](https://github.com/Harshitagarwal113)
