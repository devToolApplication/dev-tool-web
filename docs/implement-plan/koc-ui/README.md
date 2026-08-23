# KOC Management UI/UX + Frontend Implementation Plan

> Target repository: `devToolApplication/dev-tool-web`
> Target branch: `master`
> Feature root: `src/app/features/koc-management`
> Route root: `/ai-agent-mcrs/koc`

---

# 0. AI execution contract

The implementing AI MUST follow these rules before changing code.

1. Read this entire document before editing any file.
2. Implement phases in order. Do not skip architecture/UX requirements to build screens faster.
3. UI/UX and frontend responsibilities are separate:
   - UI/UX owns information architecture, user flow, layout, interaction, responsive behavior, states, accessibility and design QA.
   - FE owns Angular implementation, routes, API integration, state, validation, realtime, permissions and tests.
4. FE MUST NOT invent a different UX when a screen/state is defined here. If a design is technically impossible, keep the domain behavior and document the deviation.
5. KOC is a feature module. Do not put KOC business components into `src/app/shared/ui` unless the component is proven generic outside KOC.
6. Reuse existing Shared UI primitives/patterns and design tokens. Do not create a parallel KOC design system.
7. Do not add a new state-management framework only for this feature. Prefer Angular signals + RxJS/service state.
8. Do not add a new chart/graph framework. Reuse existing ECharts/JointJS infrastructure where applicable.
9. All user-facing labels MUST use translation keys. No hard-coded business text in templates.
10. All colors MUST use existing semantic/theme tokens. No hard-coded color values.
11. Every page/component MUST define and test: loading, empty, error, partial-data, disabled/permission and responsive states where applicable.
12. Do not weaken tests, ESLint, types or accessibility to make the build pass.
13. Do not introduce `as any`, `@ts-ignore`, `@ts-nocheck`, broad lint disables, or untyped HTTP payloads as shortcuts.
14. Filters that affect list content MUST be represented in URL query parameters so pages are bookmarkable/shareable.
15. REST is source of truth. WebSocket/STOMP is incremental realtime update only.
16. Infrastructure errors MUST NOT be rendered as candidate rejection/review.
17. Missing business evidence MUST NOT automatically reject a candidate. If no reject condition is proven, continue and eventually allow PASS according to campaign policy.
18. `agentCode + provider` is the AI execution selection boundary. The KOC UI MUST NOT expose or submit `model`, `reasoningEffort`, MCP config, skills, system prompt or runtime settings.
19. `provider` may be `codex` or `claude` because MCRS is allowed to choose runtime provider for the same agent capability.
20. Before reporting a phase complete, run the relevant unit/component tests plus project typecheck/build/lint gates.

---

# 1. Product goal and UX principles

KOC Management is an operations console, not a CRUD admin screen.

The operator must be able to answer these questions quickly:

```text
Is the campaign running?
How many candidates have been found/accepted?
Why was a candidate accepted/rejected?
What requires human review?
Is an infrastructure dependency blocking work?
After the dependency is fixed, is recovery automatic?
```

Information hierarchy MUST be:

```text
Status
  -> progress/problem
  -> business reason
  -> evidence
  -> technical execution detail
```

Technical IDs, task IDs, workflow node IDs and runtime metadata are drill-down information only.

Visual direction:

```text
enterprise operations UI
compact but scannable
table + section + drawer patterns
semantic status indicators
minimal decoration
business language first
technical detail second
```

Avoid nested card-heavy layouts.

---

# 2. Navigation and routing

## 2.1 Global navigation

Modify:

```text
src/app/app-shell/navigation/config/menu.config.ts
```

Add one global entry inside the `ai-agent-mcrs` group:

```text
KOC Management -> /ai-agent-mcrs/koc
```

Do NOT add Dashboard/Campaign/Candidate/Review/Incident as separate global sidebar items.

## 2.2 Feature routes

Create:

```text
src/app/features/koc-management/koc-management.routes.ts
src/app/features/koc-management/koc-management.routes.spec.ts
```

Required routes:

```text
/ai-agent-mcrs/koc
  -> redirect /dashboard

/ai-agent-mcrs/koc/dashboard
/ai-agent-mcrs/koc/campaigns
/ai-agent-mcrs/koc/campaigns/create
/ai-agent-mcrs/koc/campaigns/:campaignId
/ai-agent-mcrs/koc/campaigns/:campaignId/edit
/ai-agent-mcrs/koc/candidates
/ai-agent-mcrs/koc/candidates/:candidateId
/ai-agent-mcrs/koc/reviews
/ai-agent-mcrs/koc/reviews/:reviewId
/ai-agent-mcrs/koc/incidents
/ai-agent-mcrs/koc/incidents/:incidentId
/ai-agent-mcrs/koc/configuration/agents
/ai-agent-mcrs/koc/configuration/workflow-templates
/ai-agent-mcrs/koc/configuration/screening-templates
```

Integrate `kocManagementRoutes` and `KocManagementModule` into `AppFeatureModule` using the same feature pattern already used by service-management/workflow-studio.

## 2.3 Local KOC navigation

Create a feature-local navigation component:

```text
Overview | Campaigns | Candidates | Reviews | Incidents | Configuration
```

Desktop: horizontal local nav.
Tablet: horizontally scrollable or compact dropdown.
Mobile: compact menu; do not introduce a second fixed sidebar.

---

# 3. Frontend feature structure

Create:

```text
src/app/features/koc-management/
├── model/
│   ├── koc-campaign.model.ts
│   ├── koc-discovery.model.ts
│   ├── koc-candidate.model.ts
│   ├── koc-rule.model.ts
│   ├── koc-evidence.model.ts
│   ├── koc-review.model.ts
│   ├── koc-incident.model.ts
│   ├── koc-dependency.model.ts
│   ├── koc-agent.model.ts
│   ├── koc-workflow.model.ts
│   └── koc-common.model.ts
├── services/
│   ├── koc-dashboard-api.service.ts
│   ├── koc-campaign-api.service.ts
│   ├── koc-discovery-api.service.ts
│   ├── koc-candidate-api.service.ts
│   ├── koc-review-api.service.ts
│   ├── koc-incident-api.service.ts
│   ├── koc-agent-api.service.ts
│   ├── koc-workflow-api.service.ts
│   └── koc-realtime.service.ts
├── components/
│   ├── koc-navigation/
│   ├── status-badge/
│   ├── campaign-progress/
│   ├── agent-provider-selector/
│   ├── discovery-signal-editor/
│   ├── search-strategy-editor/
│   ├── rule-builder/
│   ├── rule-card/
│   ├── evidence-list/
│   ├── evidence-card/
│   ├── evidence-drawer/
│   ├── candidate-funnel/
│   ├── workflow-timeline/
│   ├── workflow-viewer/
│   ├── dependency-health/
│   └── incident-recovery-progress/
├── pages/
│   ├── koc-dashboard/
│   ├── campaign-list/
│   ├── campaign-form/
│   ├── campaign-detail/
│   ├── candidate-list/
│   ├── candidate-detail/
│   ├── review-queue/
│   ├── review-detail/
│   ├── incident-list/
│   ├── incident-detail/
│   ├── agent-list/
│   ├── workflow-template-list/
│   └── screening-template-list/
├── koc-management.module.ts
├── koc-management.routes.ts
├── koc-management.routes.spec.ts
└── index.ts
```

Page components own orchestration. KOC components own presentation/reusable feature interaction. Shared UI remains generic.

---

# 4. Domain and AI execution boundary

## 4.1 AI execution config

The frontend domain model MUST use:

```ts
export interface KocAiExecutionConfig {
  agentCode: string;
  provider?: 'codex' | 'claude';
}
```

The following fields MUST NOT exist in KOC campaign/rule/discovery DTOs:

```text
model
modelProfile
reasoningEffort
MCP config
toolProfile
skills
systemPrompt
runtimeHome
```

The runtime architecture is:

```text
KOC UI
  -> MCRS
      -> agentCode + provider + business input
          -> Codex SDK Service
              -> provider-specific agent config
                  -> model/reasoning/MCP/skills/instructions/runtime
```

## 4.2 Provider selector behavior

`AgentProviderSelectorComponent` MUST:

1. Load/select an `agentCode` from MCRS agent catalog.
2. Show only providers supported by that agent.
3. Display provider health if returned by the backend.
4. Disable an unavailable provider but preserve an already persisted value for read-only/history rendering.
5. Never display physical model/reasoning configuration.

Example UI:

```text
Agent
[ Facebook Candidate Discovery                 v ]

Provider
(o) Codex   Healthy
( ) Claude  Healthy
```

---

# 5. Business evidence and decision semantics

The UI MUST preserve these distinctions:

```text
NO MATCHING BUSINESS EVIDENCE
  -> continue
  -> do not reject solely because information is absent

PROVEN REJECT CONDITION
  -> reject

INFRASTRUCTURE/TOOL FAILURE
  -> WAITING_DEPENDENCY
  -> not reject
  -> not business review
```

Candidate decision semantics:

```text
If no reject rule matches and no unresolved infrastructure wait exists,
the candidate may PASS/ACCEPT according to campaign finalization policy.
```

Evidence states should map to business-friendly labels:

```text
FOUND          -> Evidence found
NOT_FOUND      -> No matching evidence found
INSUFFICIENT   -> Insufficient evidence
UNKNOWN        -> Not determined
FETCH_ERROR    -> Data retrieval failed
UNSUPPORTED    -> Unsupported
```

`FETCH_ERROR` MUST never use the same visual/semantic meaning as a business `REJECTED` rule.

---

# 6. UI/UX design system rules

## 6.1 Typography hierarchy

Use existing typography tokens/styles. Visual hierarchy should roughly follow:

```text
Page title          24-28 / semibold
Section heading     16-18 / semibold
Primary content     14
Secondary metadata  12-13
Table                13-14
Technical IDs        monospace 12-13
```

Do not make technical identifiers visually dominant.

## 6.2 Semantic status

Use existing semantic theme tokens, never hard-coded colors.

```text
Accepted / Healthy / Completed -> success
Running / Active               -> primary/info
Waiting / Pending              -> neutral/info
Needs Review / Recovering      -> warning
Rejected                       -> danger with rejection icon/text
Infrastructure Blocked         -> danger with dependency/error icon/text
Disabled                       -> neutral
```

Color is never the sole status indicator; include text and icon.

## 6.3 Surface/layout

Desktop content should use near-full available width because candidate/incident tables need space.

Recommended page padding:

```text
>= 1440px  24px
768-1439   16px
< 768      12px
```

Avoid repeated nested cards. Prefer section separators and drawers.

## 6.4 Standard interactions

```text
row click                 -> detail
secondary row actions     -> ... menu
evidence detail           -> right drawer
destructive operation     -> confirmation dialog
filters                    -> URL query params
tabs                       -> route/query state
wizard progress           -> backend draft where supported
technical metadata        -> collapsible detail
```

---

# 7. Dashboard design

Create `KocDashboardComponent`.

The dashboard must answer within seconds:

```text
How many campaigns are active?
How many KOCs are accepted?
What needs attention?
Are core dependencies healthy?
```

Desktop layout:

```text
┌──────────────────────────────────────────────────────────────┐
│ KOC Management                              + New Campaign    │
├──────────┬──────────┬──────────┬──────────┬──────────────────┤
│ Running  │ Accepted │ Review   │ Waiting  │ Active incidents │
├──────────────────────────────┬───────────────────────────────┤
│ Campaign progress            │ System health                 │
├──────────────────────────────┼───────────────────────────────┤
│ Candidate funnel             │ Requires attention            │
└──────────────────────────────┴───────────────────────────────┘
```

Metric cards MUST be actionable where sensible:

```text
Review -> /reviews?status=PENDING
Waiting -> /candidates?executionStatus=WAITING
Active incidents -> /incidents?status=OPEN
```

Use existing ECharts integration for funnel/rejection charts.

Required dashboard states:

```text
loading skeleton
no campaigns
healthy/no incidents
active incident
partial metrics
API error
realtime disconnected
```

---

# 8. Campaign list design

Use a table, not a card grid.

Toolbar:

```text
Campaigns
[ Search campaign... ] [Status v] [More filters]        [+ New campaign]
```

Recommended columns:

```text
Campaign
Status
Progress / accepted target
Discovered
Screened
Waiting
Last activity
```

Row action menu:

```text
Open
Edit
Pause
Resume
Clone
Stop
```

Do not render 5-6 action buttons on every row.

Running/published campaigns should be versioned by backend; UI should not imply destructive in-place mutation of historical versions.

---

# 9. Campaign create/edit wizard

Use four steps:

```text
1 General
2 Discovery
3 Screening
4 Review & Start
```

Sticky footer:

```text
[Cancel]                       [Back] [Save draft] [Continue]
```

Use unsaved-changes behavior consistent with existing app routing policy.

## 9.1 General

Fields:

```text
name (required)
code (required, unique)
description
target accepted > 0
maximum discovered >= target
maximum screened >= target
```

Advanced technical workflow settings should be collapsed and minimal.

## 9.2 Discovery

Sections:

```text
Execution
Discovery signals
Search strategies
```

Execution only exposes:

```text
Agent
Provider
```

Discovery signals are business signal rows with enabled/weight controls. Do not expose JSON editing.

Search strategy editor supports:

```text
name
enabled
priority
keywords/tags
max queries
max candidates
```

Use collapsible strategy sections; optional reorder drag handle may update explicit priority.

## 9.3 Screening

Use grouped rule sections:

```text
Hard filters
Candidate qualification
Exclusions
Engagement
```

Do not require campaign users to edit raw JSON.

Rule templates may include generic templates such as:

```text
numeric/profile threshold
date/lookback condition
recent promotion
child/parent evidence
education/achievement evidence
post engagement
comment quality
custom AI rule
```

Templates are generic; do not hard-code one campaign's criteria into the component architecture.

### CODE rule card

Expose business condition + missing-data action + reject/continue action.

### AI rule card

Expose:

```text
Agent
Provider
business parameters (lookback, threshold, evidence key, etc.)
when evidence matches
when evidence does not match / not found
```

Infrastructure failure behavior is fixed by platform policy and should render as `WAIT FOR DEPENDENCY`; do not allow the user to map DB/MCP/provider failures to ACCEPT/REJECT.

### Missing-data guardrail

If a configuration attempts to reject solely because evidence is missing, show a warning and require explicit policy if backend supports it.

Default UX should reflect:

```text
no evidence + no proven reject condition -> continue
```

## 9.4 Review & Start

Show a read-only summary:

```text
Campaign target
Discovery agent/provider
Discovery strategies
Screening rule count/grouping
Execution limits
Validation/health summary
```

If a required runtime dependency is currently unavailable:

```text
allow Save Draft
prevent Start when backend says start is unsafe
show the exact blocking dependency
```

---

# 10. Campaign detail

Header:

```text
campaign name
status
accepted / target
version
created/updated metadata
Pause/Resume/More actions
```

Tabs:

```text
Overview | Discovery | Candidates | Rules | Activity
```

Overview metrics:

```text
Discovered
Unique
Screened
Rejected
Review
Accepted
Waiting
```

Show top rejection reasons with drill-down to filtered candidates.

Candidate funnel chart clicks should navigate/filter the candidate list.

---

# 11. Discovery runtime UX

Campaign Detail -> Discovery must show strategy efficiency.

Table:

```text
Strategy | Runs | Found | New | Duplicate | Yield | Status
```

Low-yield state:

```text
Duplicate rate high
Consecutive low-yield runs
```

Actions may include:

```text
Pause strategy
Resume strategy
```

Do not make operators manually retry normal discovery tasks one by one.

Discovery run detail may show:

```text
agent
provider
queries/search summary
found/new/duplicate count
duration
status
```

Never show private chain-of-thought. Only show operational inputs/results/tool summaries explicitly returned by backend.

---

# 12. Candidate list

Primary business statuses:

```text
ACCEPTED
REJECTED
REVIEW
SCREENING
WAITING
```

Do not use technical states like `WAITING_DEPENDENCY` as the primary row label; show them in detail/tooltip.

Filters:

```text
search
campaign
decision
execution status
reject reason
follower range (if available)
```

Quick chips:

```text
All
Accepted
Rejected
Needs review
Waiting
```

Recommended columns:

```text
Candidate
Campaign
Decision
Followers
Screening progress
Reason
Updated
```

All list filters must sync to URL query parameters.

---

# 13. Candidate detail and evidence UX

Candidate detail is business-decision first.

Header:

```text
candidate name
primary decision
profile source link
summary metrics such as followers when available
```

Screening result table/list:

```text
Rule
Result
Evidence summary
```

Clicking an evidence cell opens a right-side evidence drawer instead of navigating away.

Evidence drawer should show:

```text
business fact/result
source type
observed date
excerpt/fact
source link
coverage
agent
provider
```

Technical execution metadata belongs in collapsed `Execution details`.

Evidence coverage must distinguish:

```text
No match found with sufficient coverage
vs
Unknown because retrieval failed/coverage insufficient
```

Do not mirror/display an entire Facebook timeline unless the backend explicitly returns approved evidence excerpts.

---

# 14. Workflow visualization

Default candidate UX uses a simple execution timeline:

```text
Discovery             ✓
Cheap filter          ✓
Basic research        ✓
Rules                  ✓
Engagement research   Running
Finalize              Pending
```

Provide a secondary `View technical workflow` action for detailed graph/debug view using existing JointJS/workflow patterns.

Technical node detail:

```text
node name
status
agent
provider
attempt
duration
error code/dependency if any
```

Physical model/reasoning is not primary KOC UI information.

---

# 15. Review queue UX

Review Queue contains only business ambiguity/manual policy review.

Examples:

```text
evidence conflict
borderline comment quality
manual policy review
```

It MUST NOT contain:

```text
MCP unavailable
DB unavailable
Codex/Claude runtime unavailable
auth expired
network outage
```

Desktop should use a triage master/detail layout when practical:

```text
candidate queue | selected candidate evidence + decision controls
```

Manual decision actions:

```text
Accept
Reject
Continue/Resolve according to backend contract
```

Manual override must capture reviewer, reason and timestamp.

---

# 16. Incident and dependency recovery UX

Incident management is a first-class feature.

Incident list prioritizes active incidents and shows impact:

```text
Dependency
Status
Waiting workflows
Affected campaigns
Provider/agent scope when relevant
Started time
```

Incident detail must show:

```text
stable error code
dependency key
status: BLOCKED / RECOVERING / HEALTHY
business impact
affected agents/providers
first/last failure time
operator actions
incident timeline
```

Primary actions:

```text
Test connection
Mark issue fixed
```

Do NOT add `Retry every candidate`.

Recovery UX:

```text
BLOCKED
  -> operator fixes external problem
  -> Mark issue fixed / Test connection
  -> RECOVERING
  -> health verification
  -> HEALTHY
  -> automatic resume progress
```

Recovery progress should show bounded counts:

```text
Recovered
Running
Queued
Failed
```

The operator must clearly see that waiting workflows resume automatically.

## 16.1 Global incident banner

For an active critical dependency issue affecting KOC, show one feature-level banner:

```text
Facebook MCP authentication unavailable.
128 workflows are waiting. New dependent tasks are paused.
View incident ->
```

Do not show one error banner/toast per candidate.

---

# 17. Agent catalog/configuration UX

Route:

```text
/configuration/agents
```

This is a read-oriented capability/health catalog, not a physical model editor.

Show:

```text
agent display name
agentCode
purpose/capability
supported providers
required dependencies
health
```

Do NOT expose:

```text
model
reasoning effort
MCP URL/config
skills
system prompt
runtime home
CLI flags
```

Those belong to Codex SDK agent configuration.

---

# 18. Screening/workflow templates

## Screening templates

Allow business users to reuse rule sets without editing JSON.

Template -> clone into campaign version -> campaign may customize its own copy.

## Workflow templates

Expose business-level workflow names only.

Do not duplicate Workflow Studio inside KOC campaign pages. Technical graph editing remains in the existing Workflow Studio feature.

---

# 19. Realtime behavior

Use REST for initial/load/reconciliation state.

Use existing STOMP/WebSocket infrastructure for incremental events such as:

```text
campaign counters
candidate decision/status
workflow progress
incident status
dependency recovery progress
```

If realtime disconnects:

```text
show a non-blocking reconnecting indicator
attempt reconnect
refresh authoritative state via REST when connection returns
```

Never rely on socket messages as the only persisted source of truth.

---

# 20. Translation and theme

All labels use translation keys, e.g.:

```text
layout.menu.kocManagement
koc.dashboard.title
koc.campaign.title
koc.campaign.create
koc.candidate.status.accepted
koc.incident.status.blocked
koc.rule.noData.continue
koc.provider.codex
koc.provider.claude
```

Use existing CSS/theme semantic variables. Do not define a separate KOC palette.

Dark/light modes must be covered by component visual QA.

---

# 21. Responsive UX

## >= 1440px

- full table layouts
- two-column dashboard
- review master/detail

## 1024-1439px

- two-column dashboard where practical
- hide secondary table columns
- preserve primary status/reason/progress

## 768-1023px

- local nav scroll/dropdown
- stacked table cell content for secondary metadata
- review list/detail as navigation rather than fixed split view

## < 768px

- convert dense rows into compact stacked list items
- actions in `...` menu
- no forced desktop-width tables
- evidence drawer may become full-screen sheet/page

Minimum touch target and focus behavior must meet existing accessibility rules.

---

# 22. Loading, empty and error UX

Use skeletons for dashboard/table structures instead of a page-centered spinner for every load.

Required empty states:

```text
No campaigns -> CTA Create campaign
No candidates yet -> explain discovery status
No reviews -> positive resolved state
No incidents -> healthy state
```

Map backend stable error codes to readable messages while preserving code in expandable technical detail.

Example:

```text
Facebook authentication has expired.
Technical code: FB_MCP_AUTH_EXPIRED
```

Do not show only `HTTP 500`/`HTTP 424` to operators.

---

# 23. Permission model

Integrate with existing Keycloak/application authorization. Do not create a second permission framework.

Suggested capabilities:

```text
KOC_VIEW
KOC_MANAGE_CAMPAIGN
KOC_REVIEW
KOC_INCIDENT_VIEW
KOC_INCIDENT_MANAGE
KOC_CONFIG_VIEW
KOC_CONFIG_MANAGE
```

Pages and actions must degrade correctly for read-only users.

Permission resolution belongs in the feature/application layer, not generic Shared UI components.

---

# 24. Service/API integration rules

Create dedicated API services. Components MUST NOT directly orchestrate raw `HttpClient` calls.

Expected backend capability groups:

```text
Dashboard
  summary / funnel / attention / health

Campaign
  list / get / create / update / start / pause / resume / clone

Discovery
  summary / strategy state / run detail

Candidate
  list / detail / rules / evidence / workflow

Review
  queue / detail / decision

Incident
  list / detail / test dependency / resolve / recovery progress

Agent
  supported agents / providers / health

Templates
  screening / workflow
```

Frontend MUST call MCRS for business operations. Do not call Codex SDK service directly from the browser.

Architecture:

```text
dev-tool-web
  -> ai-agent-mcrs
      -> campaign/candidate/incident APIs
      -> Codex SDK adapter
          -> codex-sdk-service
```

---

# 25. State management

Do not add NgRx solely for KOC.

Use:

```text
component signals       -> local UI state
feature store/service   -> shared feature state
RxJS                    -> HTTP/realtime composition
URL query params        -> list filter/navigation state
```

Suggested lightweight feature state services where needed:

```text
KocCampaignStore
KocCandidateStore
KocIncidentStore
```

Keep them typed and focused; avoid a single giant `KocStore`.

---

# 26. UI/UX vs FE ownership

## UI/UX responsibility

```text
information architecture
user flows
wireframes
visual hierarchy
interaction model
loading/empty/error/partial states
responsive behavior
semantic wording
accessibility behavior
design QA
```

UI/UX MUST NOT own:

```text
HTTP orchestration
backend DTO implementation
Angular service architecture
business persistence
```

## FE responsibility

```text
Angular module/routes
components/pages
API services
state
forms/validation
realtime
permissions
i18n/theme integration
unit/component/E2E tests
```

FE MUST NOT silently change defined UX semantics.

---

# 27. Implementation phases

## Phase 1 — Foundation

Scope:

```text
feature module
routes
local navigation
menu entry
domain models
API service skeleton
translation namespace
status semantics
agent/provider selector skeleton
```

Acceptance:

```text
/ai-agent-mcrs/koc works
all child routes resolve
no model/reasoning fields in frontend KOC contracts
light/dark shell renders
route tests pass
```

## Phase 2 — Dashboard + Campaign List

Implement dashboard metrics, health summary, attention list and campaign list/filter/action UX.

Acceptance:

```text
dashboard states complete
campaign filtering encoded in URL
campaign rows navigate correctly
no hard-coded strings/colors
```

## Phase 3 — Campaign Wizard + Discovery

Implement General, Discovery, Search Strategy Editor, Agent/Provider Selector, Save Draft and Review summary skeleton.

Acceptance:

```text
campaign can be configured without raw JSON
provider choices follow selected agent
model/reasoning never appear
unsaved/draft behavior works
```

## Phase 4 — Screening Rule Builder

Implement rule groups, CODE/AI rule cards, templates, validation and no-data/infrastructure guardrails.

Acceptance:

```text
AI rules use only agentCode + provider
missing evidence does not default to reject
infrastructure failure is represented as WAIT, not decision
rule builder has loading/error/disabled states
```

## Phase 5 — Campaign Runtime

Implement Campaign Detail Overview/Discovery/Candidates/Rules/Activity plus funnel and discovery efficiency.

Acceptance:

```text
operator can understand campaign progress and top rejection reasons
low-yield discovery is visible
chart/table drill-down works
```

## Phase 6 — Candidate + Evidence

Implement candidate list/detail, evidence drawer, business/technical state separation and simple workflow timeline.

Acceptance:

```text
accepted/rejected/review/waiting are visually distinct
FETCH_ERROR never renders as business reject
no-evidence/no-reject can progress to pass
technical metadata is drill-down only
```

## Phase 7 — Review Queue

Implement review triage, evidence context and audited manual decision UI.

Acceptance:

```text
only business ambiguity enters review
infrastructure failures are absent from review queue
manual overrides require reason when applicable
```

## Phase 8 — Incident + Recovery

Implement incident list/detail, dependency health, global incident banner, Test Connection/Mark Fixed and recovery progress.

Acceptance:

```text
operator fixes a dependency once
UI shows RECOVERING -> HEALTHY
waiting executions resume automatically
no per-candidate retry workflow is required
```

## Phase 9 — Configuration + Templates

Implement agent catalog, screening templates and workflow template selection.

Acceptance:

```text
agent catalog is capability/health only
no physical model/runtime settings exposed
campaign can start from reusable templates
```

## Phase 10 — Production quality

Complete realtime, permissions, responsive behavior, accessibility, Storybook states, E2E, performance and design QA.

Acceptance: all gates in sections 28-30 pass.

---

# 28. Test plan

## Route tests

```text
all KOC routes resolve
invalid route -> existing 404 behavior
campaign/create/edit route guards work
```

## Component/unit tests

```text
agent provider filtering
provider unavailable state
campaign form validation
search strategy add/remove/reorder
rule CODE/AI rendering
missing-data -> continue semantics
FETCH_ERROR -> infrastructure visual state
candidate status rendering
evidence drawer coverage states
incident BLOCKED -> RECOVERING -> HEALTHY rendering
recovery progress rendering
permission-based action visibility
```

## Realtime tests

```text
socket event updates current state
reconnect does not duplicate counters
REST refresh reconciles after reconnect
stale events do not overwrite newer state if backend supplies version/generation
```

## Storybook/design states

At minimum create state stories/fixtures for:

```text
StatusBadge
AgentProviderSelector
RuleCard
EvidenceCard/Drawer
DependencyHealth
IncidentCard
RecoveryProgress
```

Each should cover normal/loading/error/disabled/dark-theme-relevant states.

## E2E flows

1. Create campaign -> configure discovery -> configure screening -> start.
2. Campaign running -> candidate discovered -> candidate accepted/rejected reason visible.
3. Candidate evidence -> open drawer -> source/coverage displayed.
4. Ambiguous candidate -> Review Queue -> manual decision.
5. Facebook/MCP dependency blocked -> incident banner -> incident detail -> mark fixed -> recovering -> auto resume.
6. Provider selection Codex/Claude persists correctly without physical model fields.
7. Read-only permission cannot mutate campaign/review/incident.

---

# 29. Accessibility checklist

Every screen/component must verify:

```text
keyboard navigation
visible focus
correct button/link semantics
dialog/drawer focus management
labels and field errors linked with ARIA
status not represented by color only
table headers/row semantics
screen-reader-friendly loading/error messages
mobile touch targets
contrast in light and dark themes
```

Do not patch focus/ARIA through arbitrary DOM manipulation when existing shared primitives can provide it.

---

# 30. Final acceptance checklist

The feature is complete only when all are true:

```text
[ ] KOC exists as a dedicated feature under /ai-agent-mcrs/koc
[ ] Global sidebar has only one KOC entry
[ ] Local KOC navigation works desktop/tablet/mobile
[ ] Campaign can be created without raw JSON
[ ] Discovery selects agentCode + provider only
[ ] AI rules select agentCode + provider only
[ ] No KOC request/model exposes model or reasoningEffort
[ ] Physical MCP/skill/system prompt/runtime config is not editable from KOC UI
[ ] Candidate reason/evidence is auditable
[ ] Missing data alone does not reject a candidate
[ ] If no reject condition is proven, candidate can continue/pass according to final policy
[ ] Infrastructure errors never become candidate reject/review
[ ] Dependency failures appear in Incidents
[ ] One dependency fix can recover all waiting workflows automatically
[ ] Recovery progress is visible
[ ] Codex and Claude provider health are distinguishable
[ ] No automatic provider fallback is introduced in v1
[ ] Filters are URL-addressable
[ ] REST remains source of truth; realtime is incremental
[ ] Translation keys are complete
[ ] Theme tokens are used; no KOC hard-coded palette
[ ] Light/dark modes work
[ ] Responsive layouts work
[ ] Permissions work
[ ] Accessibility checks pass
[ ] Unit/component/route tests pass
[ ] Storybook state coverage exists for critical components
[ ] E2E campaign/candidate/incident recovery flows pass
[ ] Typecheck/lint/build pass
```

---

# 31. Required implementation sequence for AI

When an AI agent starts this work, it must execute in this order:

```text
1. Read current master code and this plan.
2. Inspect existing Shared UI patterns before creating any new UI primitive.
3. Implement Phase 1 and run tests.
4. Implement each subsequent phase independently.
5. After every phase, review:
   - boundary violations
   - duplicate UI primitives
   - hard-coded translations/colors
   - model/reasoning leakage
   - business vs infrastructure status confusion
6. Add tests in the same phase as code.
7. Do not mark a phase complete with TODO placeholders for critical states.
8. Run final quality gates and compare implementation against section 30.
```

The core architectural invariant is:

```text
Business UI chooses WHAT agent capability and WHICH provider.
SDK owns HOW that agent executes.

Missing business evidence is not rejection.
Infrastructure failure is not business decision.
Dependency recovery is centralized and automatic.
```
