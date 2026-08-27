# Phase 01 - Campaign Domain and Create Campaign

## Goal

Build the frontend-first campaign creation/editing flow around the new business
campaign domain: goal, structured search scope, flexible AI requirements, and a
published workflow version reference.

## Requirement IDs

- REQ-002
- REQ-003
- REQ-004
- REQ-005
- REQ-007
- SEC-001
- NFR-002

## Dependencies

- Source design:
  `docs/implement-plan/koc-campaign-review-workspace-redesign-plan.md`
- Locked user answers in:
  `docs/05-features/20260827-koc-campaign-review-workspace-redesign/00-discovery/grill-me.md`
- Existing KOC module, routes, shared form controls, and i18n file.

## Expected Deliverables

- New campaign editor model and validation.
- New frontend-first campaign editor mock/contract service.
- New `CampaignEditorStore`.
- New `campaign-editor` page for create/edit.
- Minimal `campaign-review` placeholder route for post-start navigation.
- Route/module/i18n updates.
- Legacy `campaign-wizard` removed from create/edit route surface.
- Focused unit/component/route tests.

## Architecture Boundaries

- Campaign editor state belongs in `CampaignEditorStore`.
- Page/component code orchestrates UI and navigation only.
- Leaf controls render values and emit events.
- Campaign editor payload must not contain agent/provider/rule/execution fields.

## Integration Boundaries

- Backend is not implemented in this phase.
- The FE service may use an in-memory mock while preserving the target contract
  shape.
- Permission constant renaming is deferred.
- Review workspace functionality beyond the route placeholder is deferred.

## Out Of Scope

- Full Campaign Review Workspace shell.
- Candidate review context.
- Individual approve/reject.
- Bulk review.
- Global Review Inbox.
- Realtime updates.
- Removing candidate/review legacy pages that still lack replacements.

## Acceptance Criteria

- [ ] Create Campaign shows exactly Campaign, Search Requirements, Review & Start.
- [ ] Create Campaign does not show campaign code, agent, provider, discovery
      signals, search strategies, screening rules, condition key, evidence key,
      retry, timeout, node, gateway, or audience ratio.
- [ ] User can add/edit/remove arbitrary natural-language AI requirements.
- [ ] Requirement IDs remain stable through draft updates and payload mapping.
- [ ] Payload contains goal, search scope, requirements, and workflow version
      reference.
- [ ] Payload excludes legacy execution fields.
- [ ] Start Campaign navigates to
      `/ai-agent-mcrs/koc/campaigns/:campaignId/review`.
- [ ] Existing route tests no longer expect `CampaignWizardComponent`.
- [ ] Focused tests, typecheck, and build pass.

## Risks

- Replacing create/edit while leaving legacy candidate/review pages can create
  temporary mixed architecture. The scope fence is intentional and should be
  cleaned in later phases.
- Mock service can drift from backend if contract tests are not kept strict.
- Deleting the old wizard too early can break imports; run dependency scan
  before final verification.
