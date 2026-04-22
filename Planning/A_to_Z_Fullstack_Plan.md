# A-to-Z Plan for Frontend, Backend, and Database

## Purpose
This document is the full engineering blueprint for building the Election Process Education Assistant from scratch. It covers architecture, folder design, API planning, schema planning, delivery order, security, testing, and launch preparation.

## A. Architecture Overview
### Recommended High-Level Architecture
- `Next.js` frontend for public app and admin UI
- `FastAPI` backend for APIs and business logic
- `PostgreSQL` as the source-of-truth relational database
- `Redis` for caching, sessions if needed, and background jobs
- `Firebase Hosting` for frontend hosting
- `Cloud Run` for backend hosting
- `Vertex AI Search` for grounded FAQ and semantic search
- `Firebase Cloud Messaging` for reminders
- `Secret Manager` for secrets

### Principles
- source-backed by default
- mobile-first by default
- accessibility-first for critical flows
- neutral and factual content only
- one-region MVP first

## B. Frontend Plan

## 1. Frontend Goals
- make the process understandable in under 3 minutes
- guide the user to the next best action
- keep interactions simple and low-friction
- make sources visible
- work well on mobile devices and low bandwidth

## 2. Frontend Tech Choices
- Next.js
- TypeScript
- CSS modules, Tailwind, or a structured design-token system
- React Hook Form or equivalent form handling
- Zod for client-side validation if aligned with backend schemas

## 3. Frontend Route Plan
### Public Routes
- `/`
- `/timeline`
- `/eligibility`
- `/deadlines`
- `/faq`
- `/glossary`
- `/sources`
- `/reminders`

### Admin Routes
- `/admin`
- `/admin/content`
- `/admin/elections`
- `/admin/regions`
- `/admin/review`
- `/admin/sources`
- `/admin/analytics`

## 4. Frontend Component Plan
### Shared Components
- header
- footer
- region selector
- source badge
- source panel
- info card
- action card
- status banner
- breadcrumb
- empty state
- error state
- loading skeleton

### Feature Components
- timeline rail
- stage detail panel
- eligibility question stepper
- deadline result card
- FAQ answer card
- glossary definition panel
- reminder subscription form

## 5. Frontend State Plan
### Local State
- current region
- selected stage
- current eligibility answers
- current FAQ query
- reminder form state

### Server State
- timeline data
- deadlines
- FAQ results
- glossary entries
- source metadata
- admin content lists

## 6. Frontend Accessibility Plan
- semantic landmarks
- accessible forms and labels
- strong focus states
- keyboard navigation
- ARIA only where needed
- readable font sizes
- contrast-compliant colors
- screen-reader friendly source and result sections

## 7. Frontend Event Tracking
### Key Events
- region_selected
- timeline_stage_viewed
- eligibility_started
- eligibility_completed
- deadline_checked
- faq_asked
- faq_source_clicked
- glossary_viewed
- reminder_opt_in
- reminder_unsubscribe

## 8. Frontend Folder Suggestion
```txt
frontend/
  app/
  components/
  features/
    timeline/
    eligibility/
    deadlines/
    faq/
    glossary/
    reminders/
    sources/
  lib/
  hooks/
  styles/
  types/
  tests/
```

## C. Backend Plan

## 1. Backend Goals
- provide clean, versioned APIs
- enforce source-backed responses
- encapsulate region logic and eligibility rules
- support admin publishing workflows
- support analytics and reminders

## 2. Backend Modules
- `auth`
- `users`
- `regions`
- `elections`
- `timeline`
- `deadlines`
- `eligibility`
- `faq`
- `glossary`
- `sources`
- `reminders`
- `admin_reviews`
- `analytics`

## 3. API Design Principles
- version APIs under `/api/v1`
- separate public and admin endpoints
- validate all inputs
- return structured errors
- include source metadata in relevant responses

## 4. Sample Public API Surface
### Regions
- `GET /api/v1/regions`
- `GET /api/v1/regions/{region_id}`

### Elections and Timeline
- `GET /api/v1/elections/current?region_id=...`
- `GET /api/v1/timeline?region_id=...`
- `GET /api/v1/timeline/{stage_id}`

### Eligibility
- `POST /api/v1/eligibility/check`

### Deadlines
- `GET /api/v1/deadlines?region_id=...`

### FAQ and Search
- `GET /api/v1/faq`
- `GET /api/v1/faq/search?q=...&region_id=...`

### Glossary
- `GET /api/v1/glossary`
- `GET /api/v1/glossary/{slug}`

### Reminders
- `POST /api/v1/reminders/subscribe`
- `POST /api/v1/reminders/unsubscribe`

## 5. Sample Admin API Surface
- `POST /api/v1/admin/login`
- `GET /api/v1/admin/content`
- `POST /api/v1/admin/content`
- `PATCH /api/v1/admin/content/{id}`
- `POST /api/v1/admin/content/{id}/submit-review`
- `POST /api/v1/admin/content/{id}/approve`
- `POST /api/v1/admin/content/{id}/publish`
- `GET /api/v1/admin/audit-logs`

## 6. Backend Service Layer Plan
### Services
- `RegionService`
- `ElectionService`
- `TimelineService`
- `EligibilityService`
- `DeadlineService`
- `FaqService`
- `GlossaryService`
- `SourceService`
- `ReminderService`
- `ReviewService`

### Responsibilities
- service layer handles business logic
- routers stay thin
- repositories handle data access
- background workers handle scheduled reminders and indexing jobs

## 7. Background Job Plan
- deadline reminder scheduling
- reminder delivery retries
- analytics aggregation jobs
- search index refresh jobs
- stale source alert jobs

## 8. Backend Folder Suggestion
```txt
backend/
  app/
    api/
    core/
    models/
    schemas/
    services/
    repositories/
    workers/
    integrations/
    tests/
  migrations/
```

## D. Database Plan

## 1. Database Goals
- keep public content strongly structured
- support region-specific rules
- support versioning and publishing
- support auditability
- avoid over-modeling too early

## 2. Core Tables
- `regions`
- `elections`
- `election_stages`
- `deadlines`
- `eligibility_rules`
- `faq_items`
- `glossary_terms`
- `sources`
- `content_versions`
- `admin_users`
- `review_actions`
- `reminder_subscriptions`
- `analytics_event_refs` if needed for server-side event tracking

## 3. Suggested Table Responsibilities
### `regions`
- supported region metadata
- names, codes, status, timezone

### `elections`
- election cycle per region
- election name, type, status, start and end windows

### `election_stages`
- ordered timeline stages
- title, description, current-state flag, action guidance

### `deadlines`
- region-linked dates
- deadline type, title, date, message, source reference

### `eligibility_rules`
- structured conditions
- region_id, minimum_age, citizenship condition, residence condition, notes

### `faq_items`
- question, answer, topic, region scope, status, source references

### `glossary_terms`
- term, slug, simple definition, examples, related terms

### `sources`
- source title, URL, source type, official flag, last verified timestamp

### `content_versions`
- versioning metadata for auditable publishing

### `review_actions`
- reviewer, action, timestamp, notes

### `reminder_subscriptions`
- region, reminder type, channel, consent timestamp, delivery status

## 4. Database Relationships
- one region has many elections
- one election has many stages and deadlines
- FAQs and glossary terms may be region-specific or global
- many content records can reference many sources

## 5. Database Design Decisions
- use PostgreSQL for relational integrity
- use join tables for source references
- index by `region_id`, `status`, and `published_at`
- use soft delete only where auditability matters
- keep content publishing explicit rather than overwriting live rows blindly

## 6. Search Strategy
### Recommended
- PostgreSQL for primary records
- Vertex AI Search for semantic FAQ/search experience

### Fallback
- keyword search in PostgreSQL for simple early dev

## E. Integrations Plan

## 1. Google Services Mapping
- `Firebase Hosting`: public frontend delivery
- `Cloud Run`: backend APIs
- `Vertex AI Search`: grounded FAQ and search
- `Firebase Cloud Messaging`: reminders
- `Google Analytics for Firebase`: event tracking
- `BigQuery`: deeper analytics
- `Google Maps Geocoding`: region normalization
- `Cloud Translation API`: multilingual support
- `Speech-to-Text`: voice questions
- `Text-to-Speech`: spoken answers
- `Secret Manager`: secrets

## 2. Integration Order
1. Cloud Run
2. Firebase Hosting
3. Secret Manager
4. Analytics
5. Maps Geocoding
6. Vertex AI Search
7. FCM
8. Translation
9. Speech services

## F. Security Plan
- secrets only in Secret Manager or secure env layers
- admin-only routes protected by RBAC
- validate and sanitize inputs
- rate limit public endpoints
- verify reminder consent
- avoid storing unnecessary PII
- audit all publish actions

## G. Testing Plan

## 1. Frontend Testing
- component tests
- accessibility tests
- end-to-end user flows

## 2. Backend Testing
- unit tests for services
- API contract tests
- permission tests
- reminder scheduling tests

## 3. Database Testing
- migration tests
- seed validation
- query performance checks
- rollback checks

## 4. Content Accuracy Testing
- compare answers with official sources
- ensure source links exist for public answers

## H. Delivery Order
1. project setup
2. schema and migrations
3. region and content admin foundations
4. timeline and deadlines
5. eligibility checker
6. glossary
7. FAQ assistant with grounded search
8. reminders
9. analytics and hardening
10. launch prep

## I. Suggested Milestones
### Milestone 1
- architecture approved
- repos ready
- schema created

### Milestone 2
- content admin working
- timeline and deadline flows working

### Milestone 3
- eligibility, glossary, FAQ complete
- sources visible in public UI

### Milestone 4
- reminders, analytics, testing, and launch readiness complete

## J. Definition of Done
- source-backed content is live
- one region is fully supported
- top user flows pass testing
- admin team can publish without code changes
- mobile experience is smooth
- accessibility review passes
- analytics and monitoring are live

## K. Recommended First Build Slice
If the team wants the best first implementation order, build this exact slice first:
1. region selection
2. timeline
3. deadlines
4. source rendering
5. admin content CRUD

This slice proves the core trust model early and gives a strong base for the eligibility checker and FAQ assistant.
