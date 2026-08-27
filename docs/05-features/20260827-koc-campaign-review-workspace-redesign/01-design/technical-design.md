# Technical Design

## Goal

Replace the current KOC campaign/review UI with a greenfield Campaign Review
Workspace. Campaign setup describes business intent; BPMN/workflow owns the
execution logic; Workflow Run remains the runtime source of truth.

The current implementation track is frontend first. Build the FE domain,
stores, screens, mock services, and contract shape before backend integration.

## Boundaries

- Campaign owns goal, search scope, flexible AI requirements, and workflow
  reference.
- BPMN/workflow owns agent/provider/rules/gateway/retry/timeout execution
  details.
- Review workspace owns business review of candidates, posts, evidence, AI
  assessment, and human decision.
- Technical workflow details can exist behind a debug/technical view, not in the
  main business UI.

## Create Campaign

Replace the old `General -> Discovery -> Screening -> Review` wizard with three
steps:

1. Campaign: name, description, target approved KOCs, maximum candidates.
2. Search Requirements: deterministic scope plus free-form AI requirements.
3. Review & Start: business summary and workflow reference.

Do not expose agent, provider, rule, condition key, evidence key, audience
ratio, retry, timeout, node, or gateway fields.

## Campaign Requirement Model

Requirements are generic natural-language criteria with stable IDs:

```ts
interface CampaignRequirement {
  id: string;
  title: string;
  description: string;
  importance: 'REQUIRED' | 'PREFERRED';
  minimumConfidence?: number;
  minimumEvidence?: number;
}
```

The same `requirementId` flows through campaign config, AI evaluation, evidence,
candidate review UI, and human decision context.

Runnable campaigns pin a published workflow version reference. Do not rely on a
template ID alone once a campaign can be started.

## Review Domain

The review domain separates:

- candidate profile;
- AI evaluation and per-requirement criteria;
- human review decision;
- posts;
- evidence;
- audit/history.

Use a `review-context` endpoint for selected candidate detail so the frontend
loads a consistent snapshot without orchestrating multiple calls in a page
component.

## Frontend Shape

New primary areas:

- `campaign-list`
- `campaign-create`
- `campaign-edit`
- `campaign-review`
- `global-review-inbox`

Stores:

- `CampaignEditorStore` owns draft, validation, save, and start.
- `CampaignReviewStore` owns campaign, query, candidates, selected context,
  approve/reject, bulk review, next pending selection, and realtime/poll updates.

Leaf components do not call APIs directly.

## API Shape

Expected endpoints:

- `POST /koc/campaigns`
- `PUT /koc/campaigns/{campaignId}`
- `POST /koc/campaigns/{campaignId}/start`
- `GET /koc/campaigns/{campaignId}/candidates`
- `GET /koc/campaigns/{campaignId}/candidates/{candidateId}/review-context`
- `POST /koc/campaigns/{campaignId}/candidates/{candidateId}/review`
- `POST /koc/campaigns/{campaignId}/candidates/review-bulk`

Frontend must not send `reviewedBy` or `reviewedAt`. Backend derives them from
authentication context.

For frontend-first work, mocks should expose domain errors for campaign/candidate
mismatch, invalid candidate, stopped campaign, duplicate decision, and
permission denied. This keeps the UI behavior testable before backend alignment.

## Legacy Removal

The source plan intentionally does not preserve compatibility. The replacement
scope removes legacy pages, routes, services, models, translation keys, styles,
and tests only after their new equivalents pass.

Legacy areas named for removal:

- `campaign-wizard`
- `campaign-detail`
- `candidate-list`
- `candidate-detail`
- `review-queue`
- `review-detail`
- compatibility mappers/adapters for old review/candidate/wizard models

Legacy routes do not get redirect compatibility.

## Testing

Minimum gates:

- Unit: campaign editor store, review store, human decision validation.
- Component: create campaign hides technical fields; requirement editor accepts
  arbitrary natural language; review workspace interactions work.
- API integration: reviewer spoofing rejected, reviewedAt generated,
  campaign/candidate mismatch rejected, unauthorized returns 403, requirement ID
  stability.
- E2E: create campaign, start, open workspace, review candidate, approve,
  auto-next, reject, filter, global inbox.

## Performance

- Candidate list uses server pagination.
- Do not fetch posts/evidence for all list rows.
- Fetch review context only when a candidate is selected.
- Cancel stale context requests when users click quickly.
- Avoid full campaign reload after each review.
- Add virtual scroll only when campaigns reach thousands of candidates.
