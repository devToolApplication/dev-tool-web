# Rough Plan

## Input

The pulled campaign design asks for a greenfield KOC management redesign:

- Create Campaign captures business intent, not workflow execution details.
- Campaign stores goal, structured search scope, flexible AI requirements, and
  a workflow reference.
- Campaign Review Workspace becomes the central place to review candidates.
- AI recommendation and human decision are separate.
- Posts and evidence become first-class review context.
- Legacy KOC wizard/detail/review screens are removed, not adapted.

## Existing Frontend Evidence

Current code still exposes the old shape:

- `src/app/features/koc-management/koc-management.routes.ts` routes to
  `CampaignWizardComponent`, `CampaignDetailComponent`,
  `CandidateListComponent`, `CandidateDetailComponent`, `ReviewQueueComponent`,
  and `ReviewDetailComponent`.
- `src/app/features/koc-management/model/koc-campaign.model.ts` keeps
  `discoveryExecution`, `screeningExecution`, `discoverySignals`,
  `searchStrategies`, and `screeningRules`.
- `src/app/features/koc-management/model/koc-campaign-wizard.model.ts` defines
  old wizard steps `general`, `discovery`, `screening`, `review`, and serializes
  agent/provider/rule configuration into the campaign payload.

## First-Rung Check

This does need docs before code. The requested change is a domain replacement,
not a small UI patch. The laziest useful artifact is a focused feature
workspace with stable requirements, phase order, and traceability instead of
duplicating the long source plan.

## Recommended Sequence

1. Confirm open product/API decisions.
2. Lock `user-spec.md` and `ai-spec.md`.
3. Plan Phase 1 only: Campaign domain and Create Campaign.
4. Implement phase by phase with deletion in the same scope that replaces the
   legacy behavior.
5. Gate with unit, integration, E2E, permission, and API contract tests.
