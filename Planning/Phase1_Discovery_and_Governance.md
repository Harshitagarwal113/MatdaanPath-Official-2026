# Phase 1: Discovery, Governance, and Product Definition

## Phase Goal
Convert the PRD into a concrete, low-risk, source-backed implementation scope for a first launch in one region.

## Why This Phase Comes First
The biggest risks in this product are not visual or technical first. They are:
- incorrect election information
- unclear regional scope
- weak trust signals
- accidental bias
- inaccessible content

This phase reduces those risks before code is written.

## Primary Outcomes
- MVP region and election type selected
- official sources collected and verified
- product scope frozen for v1
- content governance rules approved
- accessibility baseline defined
- security and privacy boundaries documented

## Workstreams

## 1. Region and Scope Finalization
### Decisions to Make
- choose the first geography or region
- choose the election type to support first
- define whether the MVP covers only public education or also reminders and saved progress
- confirm whether guest users are enough for v1

### Deliverables
- region scope note
- election coverage matrix
- out-of-scope list

## 2. Source Collection and Verification
### Required Source Types
- election commission website
- official voter registration pages
- official deadline calendars
- official polling procedure pages
- official glossary or civic terminology references

### Rules
- every public answer in the app must map to a reviewed source
- every source must have `last_verified_at`
- unofficial blogs and social media posts cannot be primary sources

### Deliverables
- source registry spreadsheet or database seed
- source ownership list
- source review checklist

## 3. Content Governance and Neutrality Rules
### Editorial Principles
- plain language
- neutral and factual
- no political persuasion
- no speculative answers
- no unsupported advice
- always prefer source-backed explanations

### Content Workflow
1. draft content
2. review for factual accuracy
3. review for tone and neutrality
4. approve for publish
5. version and audit

### Deliverables
- editorial policy
- approval workflow
- content status definitions: `draft`, `in_review`, `approved`, `published`, `archived`

## 4. User Journey Definition
### Core User Flows
- learn the election process
- check eligibility
- find deadlines
- understand voting day steps
- search FAQ
- read glossary terms

### Deliverables
- journey maps
- edge-case list
- FAQ intent map

## 5. Accessibility Baseline
### Standards
- keyboard navigation
- semantic headings and landmarks
- readable contrast
- zoom support
- screen-reader friendly labels
- plain-language content
- large text support

### Optional Accessibility Enhancements Later
- voice input
- text to speech
- multilingual support

### Deliverables
- accessibility checklist
- accessibility acceptance criteria for all stories

## 6. Security and Privacy Definition
### Rules
- collect minimal personal data
- do not store sensitive identity documents in v1
- log admin actions
- secure all secrets outside code
- add explicit consent for reminders if reminders are supported

### Deliverables
- data classification note
- privacy boundary summary
- admin roles and permissions draft

## 7. Technical Decision Baseline
### Recommended Stack
- frontend: Next.js
- backend: FastAPI
- database: PostgreSQL
- cache and jobs: Redis
- public hosting: Firebase Hosting
- backend hosting: Cloud Run
- source-grounded Q&A: Vertex AI Search

### Deliverables
- architecture decision record
- environment strategy: `dev`, `staging`, `prod`
- integration shortlist for Google services

## Google Services Planned in Phase 1
- `Cloud Run`: backend hosting strategy
- `Firebase Hosting`: frontend delivery strategy
- `Vertex AI Search`: grounded FAQ/search feasibility
- `Google Maps Geocoding`: region detection strategy
- `Secret Manager`: secret storage plan

## Suggested Tasks Breakdown
1. define first launch region
2. collect official URLs and documents
3. model content categories and source relationships
4. write editorial and neutrality rules
5. map user journeys and FAQs
6. define accessibility checklist
7. document architecture and security boundaries

## Exit Criteria
- one-region MVP scope approved
- source registry exists
- content model drafted
- top 5 user flows validated
- accessibility checklist approved
- architecture baseline documented

## Risks in This Phase
- scope grows too early
- source quality is inconsistent
- legal or regional rules are more complex than expected

## Mitigation
- launch with one region only
- reject unsupported content
- define escalation path for ambiguous policy questions
