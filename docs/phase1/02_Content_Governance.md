# Phase 1: Content Governance & Neutrality Rules

## Editorial Principles
1. **Plain Language:** Content must be easy to read (8th-grade reading level max). Avoid legalistic or overly bureaucratic jargon when a simpler term suffices.
2. **Strictly Neutral:** Information must be entirely factual. No candidate promotion, party references, or political persuasion.
3. **Source-Backed:** Every public-facing answer or timeline event must trace back to a verified source in the `sources.json` registry.
4. **No Speculation:** The assistant must not predict outcomes or give unsupported legal advice.
5. **Transparency:** When a user asks an out-of-scope question, clearly state the limitation and direct them to official portals.

## Content Publishing Workflow
All content (FAQs, Glossary terms, Timeline definitions) follows this state machine:

1. `Draft`: Created by a content editor. Not visible to the public or the AI.
2. `In Review`: Submitted for editorial and accuracy review.
3. `Approved`: Verified against an official source by a senior editor.
4. `Published`: Synchronized to Vertex AI Search and visible on the public frontend.
5. `Archived`: Replaced by newer rules or removed after an election cycle.

## Content Management Roles
- **Content Contributor:** Can create and edit `Draft` items.
- **Content Approver:** Can review `Draft` items and move them to `Approved` or `Published`. Can flag content for deprecation.
- **System Admin:** Manages users, regional configurations, and integration secrets.
