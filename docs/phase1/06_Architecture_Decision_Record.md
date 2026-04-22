# Phase 1: Architecture Decision Record (ADR)

## Context
MatdaanPath requires a tech stack that is scalable (handling election-day spikes), highly secure, capable of semantic search (for FAQs), and offers a smooth user experience.

## Decisions

### 1. Frontend: Next.js (React)
- **Why:** React offers a rich ecosystem for interactive UIs. Next.js provides App Router, SSR, and API routes if needed, making it SEO-friendly and highly performant.
- **Hosting:** Firebase Hosting (for fast, global CDN delivery).

### 2. Backend: FastAPI (Python)
- **Why:** Python is the best choice for AI integrations (Vertex AI). FastAPI is highly performant, auto-generates OpenAPI documentation, and enforces strict typing via Pydantic.
- **Hosting:** Google Cloud Run (serverless, scales to zero, handles high traffic automatically).

### 3. Database: PostgreSQL & Redis
- **Why:** PostgreSQL provides robust relational integrity for timelines, rules, and admin content workflow. Redis will be used for caching heavy requests and rate-limiting.
- **Hosting:** Google Cloud SQL (Postgres) and MemoryStore (Redis).

### 4. AI & Search: Google Vertex AI Search
- **Why:** The PRD mandates that answers must be source-backed. Vertex AI Search allows us to index the `sources.json` and approved content docs to provide Grounded Generation, preventing hallucinations and political bias.

### 5. Other Google Integrations
- **Maps API:** For resolving user zip codes or districts to the correct election state rules.
- **Firebase Cloud Messaging:** For scheduling and sending registration and polling day reminders.
- **Google Analytics for Firebase + BigQuery:** For analyzing user queries, drop-offs, and popular FAQ topics.
- **Google Secret Manager:** Secure storage for database credentials and API keys.

## Status
Approved for Phase 2 Implementation.
