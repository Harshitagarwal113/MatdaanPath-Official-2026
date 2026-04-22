# Phase 1: Security & Privacy Boundaries

As an election assistant, maintaining user trust and data privacy is paramount.

## 1. Data Collection & Privacy
- **No PII Storage (MVP):** The MVP will not store Personally Identifiable Information (PII) like names, Aadhaar numbers, EPIC (Voter ID) numbers, or exact home addresses.
- **Location Data:** If a user provides a location to check regional rules, it must be ephemeral (session-level only) or resolved at the edge using Google Maps Geocoding without storing the raw coordinate/address tied to an identity.
- **Reminders (Opt-In):** If Firebase Cloud Messaging is used for reminders, push tokens are anonymous. Explicit opt-in is required.
- **Chat History:** Chat logs used for analytics (to improve FAQs) must be scrubbed of any PII before being written to BigQuery.

## 2. Admin Security
- **Authentication:** The Admin panel must be secured via Firebase Authentication.
- **RBAC:** Implement Role-Based Access Control (Content Contributor vs. Approver).
- **Audit Logging:** Every content change (draft, approve, publish) must log the timestamp, the user ID, and the diff.

## 3. Infrastructure Security
- **Secrets Management:** No API keys, database URLs, or service account JSONs will be committed to the repository. Google Secret Manager will inject these at runtime in Cloud Run.
- **HTTPS:** All frontend traffic and API calls must be enforced over TLS/HTTPS.
- **CORS & Rate Limiting:** FastAPI backend must restrict CORS origins to the deployed Next.js frontend and enforce rate-limiting to prevent scraping or DoS attacks.
