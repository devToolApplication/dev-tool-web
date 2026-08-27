# User Spec: KOC Campaign Review Workspace Redesign

## Problem

KOC Management currently mixes campaign business setup with workflow execution
configuration and spreads review work across multiple legacy screens. Operators
need one campaign-centered workspace where they can see found candidates,
understand AI evidence, and make human decisions quickly.

## User Goals

- Create a campaign by describing the KOC audience and quota.
- Avoid configuring agents, providers, rules, gateways, or workflow internals in
  the campaign UI.
- Start a campaign and land in the campaign review workspace.
- Review candidates continuously without bouncing between pages.
- See profile, posts, evidence, AI recommendation, confidence, reviewer,
  review time, and decision history.
- Approve or reject one candidate, then move to the next pending candidate.
- Bulk review candidates with safeguards.
- Use a global inbox only as a cross-campaign entry point.

## In Scope

- Frontend-first implementation using mocks/contract-shaped services before
  backend integration.
- New Create/Edit Campaign flow.
- Flexible AI requirements.
- Campaign Review Workspace.
- Candidate review context.
- Individual approval/rejection.
- Bulk review.
- Global Review Inbox.
- Permission-aware actions.
- Realtime or fallback incremental updates.
- Hard removal of replaced legacy KOC review screens.

## Out of Scope

- Backend implementation in the first frontend phase.
- Legacy redirects.
- Compatibility adapters from old KOC wizard/review models.
- Parallel legacy and new service APIs.
- Keeping old Candidate Detail or Review Detail as fallback.
- Exposing workflow execution config in the business campaign UI.

## Acceptance Summary

The feature is accepted when a user can create a campaign with business-only
inputs, start it, review candidates in the workspace, inspect evidence by
requirement, approve/reject with audit, bulk review with guards, use the global
inbox, and the codebase has only one primary KOC review flow.

For the first frontend phase, acceptance is limited to the new FE campaign
domain, create/edit UI, mocks, payload contract shape, and navigation into the
future review workspace route.
