# KOC Campaign Review Workspace Redesign

```yaml
feature_id: 20260827-koc-campaign-review-workspace-redesign
feature_name: KOC Campaign Review Workspace Redesign
status: REQUIREMENTS_LOCKED
current_phase: P01
current_plan: 02-phases/01-campaign-domain-create-campaign/PLAN.md

requirements:
  user_spec: docs/01-product/features/koc-campaign-review-workspace-redesign/user-spec.md
  ai_spec: docs/02-ai-spec/features/koc-campaign-review-workspace-redesign/ai-spec.md
  status: LOCKED

design:
  status: READY_FOR_PHASE_PLANNING

phases:
  P01: Campaign domain and create campaign
  P02: Review domain and API contract
  P03: Campaign Review Workspace shell
  P04: Candidate review context
  P05: Human approval
  P06: Bulk review
  P07: Global Review Inbox
  P08: Realtime and hard legacy removal

local_validation:
  integration: PENDING
  live_e2e: PENDING
  regression: PENDING
  gate: PENDING
  validated_revision: null

cd_test:
  candidate_revision: null
  push_status: PENDING
  deploy_status: PENDING
  deployed_revision: null

test_environment_validation:
  integration: PENDING
  live_e2e: PENDING
  regression: PENDING
  gate: PENDING

uat:
  status: PENDING

final_audit:
  status: PENDING
```

## Source Docs

- `docs/implement-plan/koc-campaign-review-workspace-redesign-plan.md`
- `docs/implement-plan/koc-ui/BPMN_CAMPAIGN_REFACTOR_PLAN.md`

## Links

- Rough plan: `00-discovery/rough-plan.md`
- Grill Me: `00-discovery/grill-me.md`
- Open questions: `00-discovery/open-questions.md`
- User spec: `../../01-product/features/koc-campaign-review-workspace-redesign/user-spec.md`
- AI spec: `../../02-ai-spec/features/koc-campaign-review-workspace-redesign/ai-spec.md`
- Technical design: `01-design/technical-design.md`
- Decisions: `01-design/decisions.md`
- Traceability: `traceability.md`

## Current State

Requirements are locked for a frontend-first implementation. Phase P01 is the
next planning target: campaign domain model, FE create/edit flow, mocks, and
contract tests around the new payload shape.

## Validation Rule

`cd_test` MUST remain `PENDING` until `local_validation.gate = PASS`.
Any code change after a local PASS invalidates the local gate and requires local
re-validation before push/CD deployment.

## Current Blockers

- None for frontend-first Phase P01.
- Permission constant naming is deferred until permission work enters scope.
