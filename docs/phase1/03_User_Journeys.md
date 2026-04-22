# Phase 1: User Journeys & Flows

## Top 3 Prioritized User Flows for MVP

### Flow 1: First-Time Voter Learning the Process
**Goal:** Understand what an election is and how it unfolds.
1. **Entry:** User lands on the Home page.
2. **Action:** Clicks "Learn the Election Timeline".
3. **View:** A vertical, interactive timeline showing stages (e.g., Announcement -> Nomination -> Campaigning -> Polling Day -> Counting).
4. **Interaction:** User taps "Polling Day" to expand a card explaining EVMs and VVPATs.
5. **Exit:** User clicks "Check Eligibility" as their next recommended step.

### Flow 2: Checking Eligibility & Registration
**Goal:** Find out if they can vote and how to register.
1. **Entry:** User opens the Assistant (chat interface) or clicks "Am I Eligible?".
2. **Interaction:** Assistant asks "Are you an Indian citizen?" and "Will you be 18 or older by January 1st of the election year?".
3. **Response:** User answers "Yes".
4. **Resolution:** Assistant confirms eligibility and provides the link/steps to register via Form 6 on the NVSP portal.

### Flow 3: Resolving a Specific Query (FAQ)
**Goal:** Get a quick answer without reading a long document.
1. **Entry:** User types into the search/chat: "What documents do I need to vote if I don't have a Voter ID?"
2. **Action:** Vertex AI Search queries the approved source documents.
3. **Resolution:** Assistant returns a bulleted list of the 12 alternative photo identity documents approved by the ECI (e.g., Aadhaar, PAN card, Passport), citing the official ECI circular.

## FAQ Intent Map (High Priority)
- Registration (How to apply, Form 6, checking status)
- Voting Process (How to use EVM, polling station timings)
- Alternatives/Exceptions (Lost voter ID, voting from another state/NRI)
- Deadlines (When does registration close?)
