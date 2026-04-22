# Phase 3: MVP Feature Build and Google Integrations

## Phase Goal
Build the full MVP experience described in the PRD and connect the Google services that make the product useful, scalable, and trustworthy.

## Primary Outcomes
- users can learn the election process end to end
- users can check eligibility
- users can find deadlines by region
- users can search FAQ and glossary
- admins can update and publish verified content
- reminders and analytics are operational

## MVP Features

## 1. Guided Election Timeline
### Requirements
- show all stages in order
- highlight current stage
- explain what happens now
- explain what the user should do next
- attach sources to each stage

### Build Tasks
- timeline API
- timeline UI
- current-stage marker logic
- stage detail cards
- source citation block

## 2. Eligibility Checker
### Requirements
- ask simple region and age-related questions
- support first-region rule logic
- return clear explanation and next steps

### Build Tasks
- rule engine or decision tree
- eligibility API
- question flow UI
- explanation formatting
- “what to do next” section

## 3. Deadline and Reminder System
### Requirements
- show registration deadlines
- show voting day reminders
- show result announcement timing when relevant
- support reminder subscriptions

### Build Tasks
- deadline API
- date and timezone handling
- reminder subscription model
- scheduling jobs
- notification delivery tracking

## 4. FAQ Assistant
### Requirements
- answer common questions
- remain source-grounded
- avoid unsupported answers
- surface fallback links when confidence is low

### Build Tasks
- FAQ content ingestion
- search indexing
- prompt and retrieval guardrails
- source rendering
- unsupported-answer fallback

## 5. Glossary Mode
### Requirements
- explain civic and election terms simply
- show examples where useful
- keep terms consistent across app

### Build Tasks
- glossary schema
- glossary list page
- in-context term tooltips
- glossary API

## 6. Location-Aware Information
### Requirements
- detect or ask for location
- resolve the user to the correct region
- show correct local rules and deadlines

### Build Tasks
- region selection flow
- geocoding integration
- region validation and fallback
- location override control

## 7. Admin Content Management
### Requirements
- create and edit content
- link sources
- approve and publish content
- maintain history

### Build Tasks
- admin dashboard
- content forms
- review queue
- publish action
- audit history

## Google Services Used in This Phase

## 1. Vertex AI Search
### Purpose
- grounded FAQ and content search over approved data

### Use It For
- FAQ assistant
- source-backed answer retrieval
- semantic search over glossary and help content

### Guardrails
- only index approved content
- return source metadata with answers
- do not allow the model to invent region rules

## 2. Firebase Cloud Messaging
### Purpose
- send reminder notifications

### Use It For
- registration deadline reminders
- voting day reminders
- result announcement reminders

## 3. Google Maps Geocoding
### Purpose
- map user location input to supported region records

### Use It For
- region selection
- region normalization
- district or locality matching where needed

## 4. Cloud Translation API
### Purpose
- multilingual support once core content is stable

### Use It For
- translated content variants
- admin review drafts for translation workflows

## 5. Speech-to-Text and Text-to-Speech
### Purpose
- accessibility and optional voice mode

### Use It For
- voice questions
- spoken answers
- low-literacy or accessibility support

## Feature Completion Sequence
1. timeline
2. deadline lookup
3. eligibility checker
4. glossary
5. FAQ assistant
6. admin publishing
7. reminders
8. accessibility enhancements

## Acceptance Checks for This Phase
- a user can understand the process quickly
- a user can find region-specific deadlines
- answers are sourced and neutral
- admin users can change content without engineering work
- core pages work on mobile
- analytics events fire for key journeys

## Risks
- AI answers may sound more confident than the source supports
- region matching may be ambiguous
- notifications may be useful but noisy

## Mitigation
- require explicit source links in answers
- let users confirm or override detected region
- add clear reminder preferences and unsubscribe controls
