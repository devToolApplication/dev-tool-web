# AI Spec: KOC Campaign Review Workspace Redesign

## Requirements

### Scope Mode

The current implementation mode is frontend first. Backend integration is out of
scope for Phase P01, but FE mocks and services MUST preserve the target API
contract shape.

### REQ-001 Campaign Review Workspace

The KOC business flow MUST center on Campaign List, Campaign Review Workspace,
and Global Review Inbox. Starting a campaign MUST navigate to the campaign
review workspace.

### REQ-002 Create Campaign Steps

Create Campaign MUST use exactly three business steps: Campaign, Search
Requirements, and Review & Start.

It MUST NOT expose legacy wizard steps, audience ratio, agent, provider, CODE
rule, AI rule, condition key, evidence key, retry, timeout, node, or gateway
configuration.

### REQ-003 Campaign Goal

Campaign creation MUST capture campaign name, optional description, target
approved KOCs, and maximum candidates to find. Backend MAY generate code/id.

### REQ-004 Search Configuration Split

Search Requirements MUST separate deterministic structured scope from flexible
AI requirements.

Structured scope MAY include platforms, follower range, locations, languages,
and recent activity.

### REQ-005 Flexible AI Requirements

AI requirements MUST be arbitrary natural-language criteria with stable IDs,
title, description, importance, optional minimum confidence, and optional
minimum evidence. The implementation MUST NOT hard-code semantic requirement
enums such as parent, seller, child age, or content topic.

### REQ-006 Requirement Evaluation

AI evaluation MUST return structured results for campaign requirement IDs:
`PASS`, `FAIL`, or `UNKNOWN`, confidence, summary, and evidence IDs.

### REQ-007 Campaign Workflow Boundary

Campaign data MUST include a workflow reference but MUST NOT contain detailed
workflow execution configuration. BPMN/workflow owns execution details.

Runnable campaigns MUST pin a published workflow version reference, not only a
template ID.

### REQ-008 Review Domain Contract

Review data MUST separate candidate profile, AI evaluation, human review, posts,
evidence, and history. A selected candidate review context SHOULD be returned as
a consistent snapshot.

### REQ-009 Workspace Shell

Campaign Review Workspace MUST show campaign header metrics, summary cards,
filters, candidate list, master-detail selection, and deep-linkable selected
candidate state.

### REQ-010 Candidate Detail

Candidate detail MUST show profile, AI assessment, posts, evidence grouped by
requirement/criterion, review history, and human decision section.

### REQ-011 Individual Human Review

Human approval and rejection MUST be independent from AI recommendation.
Approve MAY include a note. Reject MUST require a reason. If reason is `OTHER`,
note MUST be required. Submitting a decision MUST prevent double submit and
select the next pending candidate when available.

Duplicate review submit MUST be treated as conflict unless the user explicitly
starts a re-review action.

### REQ-012 Bulk Review

Bulk review MUST require a non-empty selection. Bulk reject MUST require a
reason. The UI MUST warn when a bulk decision conflicts with AI recommendation.
Bulk reject payloads MUST include `reasonCode`; when reason is `OTHER`, note is
required.

### REQ-013 Global Review Inbox

Global Review Inbox MUST be cross-campaign only. Selecting an item MUST open the
Campaign Review Workspace with that candidate selected. It MUST NOT implement a
separate review detail page.

## Security Requirements

### SEC-001 Reviewer Identity

Frontend MUST NOT submit `reviewedBy` or `reviewedAt`. Backend MUST derive both
from authenticated context.

### SEC-002 Permissions

Frontend MUST hide or disable actions by permission, and backend MUST enforce
permissions independently. Proposed permissions are `AI_AGENT_KOC_READ`,
`AI_AGENT_KOC_REVIEW`, and `AI_AGENT_KOC_CAMPAIGN_WRITE`.

Exact permission constant names are deferred and are not required for Phase P01.

## Performance Requirements

### PERF-001 List Fetch Boundary

Candidate lists MUST use server-side pagination and MUST NOT fetch posts or
evidence for every row. Review context MUST load only for the selected
candidate.

### PERF-002 Incremental Updates

The workspace SHOULD update counters, rows, and selected context incrementally
through realtime events or a polling fallback. It MUST NOT reload the full
campaign after every review.

## Non-Functional Requirements

### NFR-001 Greenfield Replacement

The final implementation MUST remove replaced legacy routes, pages, services,
models, tests, styles, translation keys, and compatibility layers.

### NFR-002 State Ownership

Business state MUST live in stores/facades. Page components orchestrate. Leaf
components render and emit events only.
