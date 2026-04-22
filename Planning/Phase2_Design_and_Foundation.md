# Phase 2: Design, UX, and Engineering Foundation

## Phase Goal
Turn the approved scope into a production-grade foundation with working UI flows, service skeletons, environments, and content structures.

## Primary Outcomes
- mobile-first UI designed
- app and admin information architecture finalized
- engineering repos and environments ready
- backend and frontend skeletons deployed
- database schema and content workflow foundations created

## Workstreams

## 1. Product Design and UX
### Screens to Design
- home / start here
- election timeline
- eligibility checker
- deadline lookup
- FAQ assistant
- glossary
- sources and trust center
- admin login
- admin content management

### UX Principles
- low cognitive load
- very clear next actions
- source visibility
- readable on small screens
- progressive disclosure instead of dense pages

### Deliverables
- wireframes
- design system tokens
- responsive layout specs
- empty, loading, and error states

## 2. Frontend Foundation
### Recommended Setup
- Next.js app router
- TypeScript
- component library with reusable primitives
- route structure for public app and admin area
- analytics event hooks
- accessibility utilities

### Core Frontend Modules
- timeline components
- card-based step explainer
- question input and quick actions
- source citation display
- region selector
- reminder opt-in UI

### Deliverables
- frontend repository structure
- base pages and layouts
- shared UI component library
- form validation patterns

## 3. Backend Foundation
### Recommended Setup
- FastAPI
- Pydantic schemas
- versioned REST APIs
- background jobs using Celery or a lighter job runner
- auth and admin RBAC

### Initial Backend Modules
- health and readiness endpoints
- auth module
- region module
- content module
- timeline module
- FAQ module
- glossary module
- reminders module

### Deliverables
- FastAPI project skeleton
- API versioning rules
- error response standard
- audit logging pattern

## 4. Database and Content Model
### Main Entities
- region
- election
- stage
- deadline
- eligibility_rule
- faq
- glossary_term
- source
- content_version
- admin_user
- reminder_subscription

### Deliverables
- ERD
- migration plan
- seed strategy
- indexing strategy for common lookups

## 5. Admin and Content Workflow
### Must Support
- draft creation
- review queue
- publish and rollback
- source linking
- version history

### Deliverables
- admin workflows
- moderation screens
- publishing permissions

## 6. DevOps and Delivery
### Environment Setup
- local environment
- staging environment
- production environment

### Pipeline Requirements
- lint
- type check
- tests
- build
- deploy to staging

### Google Services Used Here
- `Firebase Hosting` for the web frontend
- `Cloud Run` for backend deployment
- `Secret Manager` for API keys and environment secrets
- `Firebase Authentication` optionally for lightweight admin auth

## Suggested Sprint Breakdown
### Sprint 1
- finalize wireframes
- create repo scaffolding
- set up CI
- create base frontend layout
- create FastAPI skeleton

### Sprint 2
- create database schema
- build admin auth
- implement region and content APIs
- connect staging deployment

### Sprint 3
- implement design system
- build timeline and FAQ UI shells
- add source citation pattern
- seed staging data

## Exit Criteria
- public and admin UI shells exist
- staging environment works
- schema and migrations are stable
- basic content CRUD works
- secrets are managed securely
- design system and accessibility conventions are documented

## Risks
- UI becomes too content-heavy
- admin tools are under-designed
- schema changes late and causes churn

## Mitigation
- prototype early with sample content
- keep public UI simple and admin UI structured
- review schema before building feature logic
