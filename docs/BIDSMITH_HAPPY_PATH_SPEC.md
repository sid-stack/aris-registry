# BidSmith Happy Path Implementation Spec

## Goal

Implement the core BidSmith product journey as a four-step flow:

1. Frictionless entry on the landing page
2. Fast teaser value before auth
3. Auth and payment only after value is visible
4. Full Bento-style intelligence dashboard as the destination

This spec maps that flow onto the current codebase so implementation can proceed without re-architecting the whole app.

## Product Flow

### 1. Entry

Route: `/`

User intent:
- Paste a SAM.gov URL
- Upload a PDF

Expected UX:
- Minimal, high-contrast hero
- One dominant CTA: `Audit a SAM.gov RFP`
- No auth wall
- No pricing wall before first input

### 2. Hook

Route: still `/`, but transitions into an inline processing experience

Expected UX:
- Skeleton dashboard shell appears immediately
- Backend parsing starts
- User sees progress copy while the backend ingests the document
- User gets one visible teaser insight before auth
- Full intelligence brief remains locked

Target teaser examples:
- `3 compliance risks found`
- `1 likely disqualifier detected`
- `CMMC Level 2 requirement found`
- `Bid probability currently estimated at 22%`

### 3. Auth + Monetization

Auth trigger:
- `Sign in to unlock full Intelligence Brief`

Expected UX:
- Clerk modal or embedded sign-in opens
- Audit session context is preserved across auth
- If entitlement is required, route into Stripe checkout after auth
- On Stripe success, resume the same audit session

Monetization modes:
- Free teaser only
- Paid single-use credit
- $499 pilot unlock
- Subscription entitlement

### 4. Dashboard

Routes:
- `/app`
- `/audit/:id`

Expected UX:
- Bento-style dashboard grid
- Parsed RFP summary
- Compliance matrix
- Intelligence brief
- Action plan
- Next steps
- Proposal support modules

The dashboard is the deliverable, not the first gate.

## Current Codebase Mapping

### Current Entry Surface

Primary component:
- [Landing.jsx](/Users/sid/Desktop/aris-core/src/pages/Landing.jsx)

Current strengths:
- Already supports pasted URL input
- Already supports PDF upload
- Already has progress/log simulation
- Already has a strong hero and CTA surface

Current gaps:
- `handleStartAnalysis()` and `handleFileChange()` immediately route into the app flow via `onAnalyze` / `onAnalyzeFile`
- There is no first-class teaser state
- The processing UI is terminal-style logs, not a productized skeleton dashboard
- The current CTA copy still pushes the user straight toward the full app

### Current Route Controller

Primary component:
- [App.jsx](/Users/sid/Desktop/aris-core/src/App.jsx)

Current strengths:
- Already routes `/` and `/app`
- Already supports auth gating with Clerk
- Already centralizes state transitions for the SPA shell

Current gaps:
- `handleAnalyze()` and `handleAnalyzeFile()` send users directly to `view = "app"`
- `/app` is currently the auth gate and workspace combined
- There is no route or view dedicated to a pre-auth teaser result
- No persistent audit session identifier is created before auth

### Current Deliverable Surface

Primary component:
- [GovConDashboardV2.jsx](/Users/sid/Desktop/aris-core/src/pages/GovConDashboardV2.jsx)

Current strengths:
- Already functions as the destination workspace
- Already contains loading overlays
- Already renders intelligence, compliance, and proposal surfaces
- Already stores and loads audit history

Current gaps:
- It assumes the user is already in the authenticated workspace
- It is not designed to support a locked teaser mode
- It loads demo data when no audit is present, which weakens the product flow

### Current Legacy Audit Surface

Secondary component:
- [Audit.jsx](/Users/sid/Desktop/aris-core/src/pages/Audit.jsx)

Role:
- Useful as inspiration for gated overlays and reveal patterns

Recommendation:
- Do not make this the main happy path
- Reuse patterns from it if needed, but keep `GovConDashboardV2` as the core deliverable

## Required State Machine

The happy path should be implemented as an explicit client state machine.

Required states:
- `idle`
- `input_received`
- `processing`
- `teaser_ready`
- `auth_required`
- `payment_required`
- `unlocked`
- `dashboard_ready`
- `failed`

Required invariants:
- Input must be captured before any auth gate appears
- Processing must preserve URL/PDF context
- Teaser must render before auth is requested
- Auth and payment must never discard the audit session
- Dashboard hydration must use the same audit session created during teaser generation

## Proposed Frontend Architecture

### New View Layer

Add a dedicated teaser/result route or view:
- Preferred route: `/audit/:id`
- Temporary SPA view alternative: `view === "teaser"`

Recommendation:
- Use `/audit/:id` as the canonical route
- Allow the same route to render in two modes:
  - locked teaser mode
  - unlocked full dashboard mode

### Proposed Route Behavior

`/`
- Landing page
- Accept URL or PDF
- Submit creates audit session
- Navigate to `/audit/:id`

`/audit/:id`
- If audit is still parsing: show skeleton dashboard + loading state
- If teaser is ready and user is unauthenticated: show teaser + locked cards
- If authenticated but not entitled: show payment gate
- If authenticated and entitled: show full Bento dashboard

`/app`
- Authenticated workspace index
- Shows user audit history and latest unlocked audits
- Can redirect to latest audit session

### Landing Refactor

Refactor [Landing.jsx](/Users/sid/Desktop/aris-core/src/pages/Landing.jsx) to:
- replace terminal log block with a skeleton dashboard preview
- submit to a real audit session creator
- stop calling `setView("app")` immediately after input
- route into `/audit/:id`

Keep:
- URL input
- PDF upload
- clear hero copy

Change:
- progress UI
- submit destination
- teaser transition

### Locked Teaser Screen

Implement a reusable teaser shell with:
- top summary card
- 1 unblurred insight card
- 2-4 blurred dashboard cards
- locked intelligence brief panel
- CTA to sign in

Visual rules:
- The user must believe the answer is already there
- The lock should obstruct details, not existence
- The deliverable should be partially visible behind the paywall

### Auth Gate

Current auth rendering is centralized in [App.jsx](/Users/sid/Desktop/aris-core/src/App.jsx).

Target behavior:
- Auth gate should be invoked from teaser state
- Clerk should open inline or modal without losing `/audit/:id`
- Redirect target should remain the active audit route

Required implementation detail:
- Preserve `auditId` in URL and local state
- After auth success, reload the active audit session rather than navigating to a blank workspace

### Payment Gate

Stripe currently exists via direct checkout links in [App.jsx](/Users/sid/Desktop/aris-core/src/App.jsx).

Target behavior:
- Entitlement check runs after auth
- If user lacks entitlement for this audit:
  - render pricing gate within `/audit/:id`
  - create Stripe checkout session tied to `auditId`
- After Stripe success:
  - return to `/audit/:id`
  - unlock full result

Do not:
- send users to a generic pricing page mid-flow
- force them to manually relocate their audit after checkout

## Proposed Backend Contract

### Current Situation

The current backend centers around synchronous audit generation from endpoints like:
- `/api/analyze-text`
- PDF analysis endpoints

This is not enough for the intended teaser-driven flow because the frontend needs a stable session and progressive reveal.

### New Audit Session Contract

Add or normalize around these endpoints:

`POST /api/audits`
- input: `{ samUrl }` or multipart PDF upload
- output: `{ auditId, status }`

`GET /api/audits/:id`
- output:
  - `status`
  - `teaser`
  - `fullResult`
  - `entitlement`
  - `updatedAt`

`POST /api/audits/:id/unlock`
- verifies auth + entitlement
- returns unlock state

Recommended statuses:
- `queued`
- `parsing`
- `teaser_ready`
- `ready`
- `failed`

### Teaser Payload Shape

Minimal teaser contract:

```json
{
  "auditId": "aud_123",
  "status": "teaser_ready",
  "teaser": {
    "headline": "3 compliance risks found",
    "subheadline": "1 likely disqualifier detected in Section J-4",
    "riskCount": 3,
    "disqualifierCount": 1,
    "primaryFinding": "CMMC Level 2 certification is mandatory before performance"
  }
}
```

### Full Result Payload

The full result should continue to match the dashboard shape already consumed by:
- [GovConDashboardV2.jsx](/Users/sid/Desktop/aris-core/src/pages/GovConDashboardV2.jsx)
- [IntelligenceBrief.jsx](/Users/sid/Desktop/aris-core/src/components/forge/IntelligenceBrief.jsx)
- [ProposalForge.jsx](/Users/sid/Desktop/aris-core/src/components/forge/ProposalForge.jsx)

That is the right direction. Do not create a second incompatible result schema.

## Entitlement Model

Each audit session needs an access policy:

- `public_teaser`
- `auth_required`
- `payment_required`
- `unlocked`

Rules:
- Teaser data is readable without auth
- Full result requires auth
- Premium result requires entitlement
- Entitlement must be resolvable from Clerk user + Stripe state

Recommended persistence fields:
- `audit_id`
- `owner_user_id`
- `source_type`
- `status`
- `teaser_payload`
- `full_payload`
- `entitlement_mode`
- `unlock_state`
- `stripe_checkout_session_id`

## Component Plan

### Components to Reuse

Reuse directly:
- [Landing.jsx](/Users/sid/Desktop/aris-core/src/pages/Landing.jsx)
- [GovConDashboardV2.jsx](/Users/sid/Desktop/aris-core/src/pages/GovConDashboardV2.jsx)
- [IntelligenceBrief.jsx](/Users/sid/Desktop/aris-core/src/components/forge/IntelligenceBrief.jsx)
- [ProposalForge.jsx](/Users/sid/Desktop/aris-core/src/components/forge/ProposalForge.jsx)
- [ComplianceMatrix.jsx](/Users/sid/Desktop/aris-core/src/components/dashboard/ComplianceMatrix.jsx)

### Components to Add

Add:
- `src/pages/AuditSession.jsx`
- `src/components/audit/AuditTeaserShell.jsx`
- `src/components/audit/AuditLockedCard.jsx`
- `src/components/audit/AuditProcessingSkeleton.jsx`
- `src/components/audit/UnlockGate.jsx`
- `src/components/audit/PaymentGate.jsx`

### Components to Modify

Modify:
- [App.jsx](/Users/sid/Desktop/aris-core/src/App.jsx)
- [Landing.jsx](/Users/sid/Desktop/aris-core/src/pages/Landing.jsx)
- [GovConDashboardV2.jsx](/Users/sid/Desktop/aris-core/src/pages/GovConDashboardV2.jsx)

## App-Level Implementation Plan

### Phase 1

Objective:
- establish the new flow without redesigning the backend

Steps:
- add `/audit/:id` route handling in [App.jsx](/Users/sid/Desktop/aris-core/src/App.jsx)
- add `AuditSession` page
- make landing submission create an audit session and navigate to `/audit/:id`
- render processing skeleton and teaser shell
- preserve `auditId` across auth

Success condition:
- user can paste a URL or upload a PDF and see a teaser before sign-in

### Phase 2

Objective:
- connect auth and payment cleanly

Steps:
- check Clerk auth inside `AuditSession`
- add entitlement decision layer
- route paid unlock through Stripe tied to `auditId`
- return from Stripe success to the same audit session

Success condition:
- auth and payment no longer break audit continuity

### Phase 3

Objective:
- land users in the full Bento deliverable

Steps:
- feed unlocked result into [GovConDashboardV2.jsx](/Users/sid/Desktop/aris-core/src/pages/GovConDashboardV2.jsx)
- remove demo-data fallback when a real audit session is present
- allow workspace tabs to render partial locked states if needed

Success condition:
- `/audit/:id` becomes the real product destination

## UX Rules

The following rules are mandatory:

- Do not ask for sign-in before showing value
- Do not route users into an empty workspace after submit
- Do not lose audit context across auth or checkout
- Do not show generic pricing pages in the middle of a live audit session
- Do not make teaser mode feel like fake data

The following rules are recommended:

- show at least one unblurred insight before the gate
- keep CTA copy singular and concrete
- treat `/audit/:id` as the canonical unit of work
- use the workspace itself as the teaser shell

## Technical Risks

### Risk 1

Current SPA routing is view-state-driven in [App.jsx](/Users/sid/Desktop/aris-core/src/App.jsx), not route-model-driven.

Impact:
- Audit session routes will be brittle if implemented only as `view` strings

Mitigation:
- move audit sessions onto explicit pathname handling

### Risk 2

Current backend endpoints are mostly synchronous and may not return a stable session object first.

Impact:
- Hard to support teaser-first UX and resume-after-auth flows

Mitigation:
- introduce audit session creation and polling

### Risk 3

Current workspace assumes authenticated access.

Impact:
- Reusing it in teaser mode could create accidental auth redirects

Mitigation:
- make data access and lock state explicit at the page level

## Acceptance Criteria

The implementation is complete when all of the following are true:

- A user can paste a SAM.gov URL on `/`
- The app immediately transitions into a processing skeleton
- The user sees a teaser insight before auth
- The user can sign in without losing the audit session
- The user can pay without losing the audit session
- The user lands on a full Bento dashboard for the same audit
- Reloading `/audit/:id` restores the correct state
- `/app` acts as the authenticated workspace index, not the initial tollbooth

## Recommended File Ownership

Frontend routing and happy path:
- [App.jsx](/Users/sid/Desktop/aris-core/src/App.jsx)
- [Landing.jsx](/Users/sid/Desktop/aris-core/src/pages/Landing.jsx)
- new `AuditSession.jsx`

Dashboard adaptation:
- [GovConDashboardV2.jsx](/Users/sid/Desktop/aris-core/src/pages/GovConDashboardV2.jsx)
- dashboard child components

Backend sessionization:
- [api/index.js](/Users/sid/Desktop/aris-core/api/index.js)
- audit persistence and entitlement endpoints

Payment and unlock:
- Stripe service and checkout return path handling

## Immediate Next Step

Implement Phase 1 first.

That means:
- create `/audit/:id`
- create an audit session on input submit
- render a processing skeleton
- render a locked teaser
- defer Clerk auth until teaser is visible

Do not start with pricing polish, dashboard redesign, or new copywriting. The state machine and route continuity are the hard part.
