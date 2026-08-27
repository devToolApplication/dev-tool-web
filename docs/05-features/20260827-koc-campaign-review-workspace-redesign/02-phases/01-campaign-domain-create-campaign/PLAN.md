# KOC Campaign Domain and Create Campaign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the frontend-first KOC campaign editor that captures business goals, structured search scope, flexible AI requirements, and a pinned workflow version reference.

**Architecture:** Add a new campaign editor model and signal store beside the current KOC module, then route create/edit to a new page. Use a tiny in-memory contract service for FE-first work; later backend integration replaces only that service. Keep review workspace work to a placeholder route so Start Campaign has the correct navigation target.

**Tech Stack:** Angular 21 NgModule, TypeScript strict mode, signals, RxJS `Observable`, existing shared `app-*` controls, Vitest through Angular CLI.

---

## Required Skills

- `test-driven-development`
- Conditional if root cause is unclear: `systematic-debugging`
- Conditional if review feedback requires changes: `receiving-code-review`

## Context To Read

- `docs/05-features/20260827-koc-campaign-review-workspace-redesign/README.md`
- `docs/05-features/20260827-koc-campaign-review-workspace-redesign/01-design/technical-design.md`
- `docs/05-features/20260827-koc-campaign-review-workspace-redesign/02-phases/01-campaign-domain-create-campaign/phase-spec.md`
- `src/app/features/koc-management/koc-management.routes.ts`
- `src/app/features/koc-management/koc-management.module.ts`
- `src/app/features/koc-management/pages/campaign-wizard/campaign-wizard.component.ts`
- `src/app/features/koc-management/model/koc-campaign-wizard.model.ts`
- `src/app/core/i18n/features/koc-management.i18n.json`

## File Structure

- Create: `src/app/features/koc-management/model/koc-campaign-editor.model.ts`
- Create: `src/app/features/koc-management/model/koc-campaign-editor.model.spec.ts`
- Create: `src/app/features/koc-management/services/koc-campaign-editor-api.service.ts`
- Create: `src/app/features/koc-management/services/koc-campaign-editor-api.service.spec.ts`
- Create: `src/app/features/koc-management/stores/campaign-editor.store.ts`
- Create: `src/app/features/koc-management/stores/campaign-editor.store.spec.ts`
- Create: `src/app/features/koc-management/pages/campaign-editor/campaign-editor.component.ts`
- Create: `src/app/features/koc-management/pages/campaign-editor/campaign-editor.component.html`
- Create: `src/app/features/koc-management/pages/campaign-editor/campaign-editor.component.css`
- Create: `src/app/features/koc-management/pages/campaign-editor/campaign-editor.component.spec.ts`
- Create: `src/app/features/koc-management/pages/campaign-review/campaign-review.component.ts`
- Create: `src/app/features/koc-management/pages/campaign-review/campaign-review.component.html`
- Create: `src/app/features/koc-management/pages/campaign-review/campaign-review.component.css`
- Create: `src/app/features/koc-management/pages/campaign-review/campaign-review.component.spec.ts`
- Modify: `src/app/features/koc-management/koc-management.routes.ts`
- Modify: `src/app/features/koc-management/koc-management.routes.spec.ts`
- Modify: `src/app/features/koc-management/koc-management.module.ts`
- Modify: `src/app/core/i18n/features/koc-management.i18n.json`
- Delete after replacement passes: `src/app/features/koc-management/pages/campaign-wizard/*`
- Delete after replacement passes: `src/app/features/koc-management/model/koc-campaign-wizard.model.ts`
- Delete after replacement passes: `src/app/features/koc-management/model/koc-campaign-wizard.model.spec.ts`

---

### Task 1: Campaign Editor Domain Model

**Files:**

- Create: `src/app/features/koc-management/model/koc-campaign-editor.model.ts`
- Create: `src/app/features/koc-management/model/koc-campaign-editor.model.spec.ts`

- [ ] **Step 1: Write failing model tests**

Cover these cases:

```ts
it('creates a three-step draft without legacy execution fields');
it('validates campaign goal fields');
it('preserves arbitrary natural-language requirement content');
it('keeps requirement ids stable when requirement text changes');
it('maps draft to a payload without agent provider or rule fields');
```

Run:

```bash
npx ng test dev-tool-web --runner vitest --watch=false --include src/app/features/koc-management/model/koc-campaign-editor.model.spec.ts
```

Expected: FAIL because the model file does not exist.

- [ ] **Step 2: Add the model contract**

Implement these exports:

```ts
export type CampaignEditorStepId = 'campaign' | 'searchRequirements' | 'reviewStart';

export interface CampaignGoal {
  targetApproved: number;
  candidateLimit: number;
}

export interface CampaignSearchScope {
  platforms: string[];
  minFollowers: number | null;
  maxFollowers: number | null;
  locations: string[];
  languages: string[];
  recentActivityDays: number | null;
}

export interface CampaignRequirement {
  id: string;
  title: string;
  description: string;
  importance: 'REQUIRED' | 'PREFERRED';
  minimumConfidence: number | null;
  minimumEvidence: number | null;
}

export interface CampaignWorkflowRef {
  workflowDefinitionId: string;
  workflowVersionId: string;
  workflowVersion: number | null;
  workflowName: string;
}

export interface CampaignEditorDraft {
  name: string;
  description: string;
  goal: CampaignGoal;
  search: {
    instructions: string;
    scope: CampaignSearchScope;
    requirements: CampaignRequirement[];
  };
  workflow: CampaignWorkflowRef;
}

export interface CampaignEditorPayload {
  name: string;
  description?: string;
  goal: CampaignGoal;
  search: {
    instructions?: string;
    scope: Partial<CampaignSearchScope>;
    requirements: CampaignRequirement[];
  };
  workflow: {
    workflowDefinitionId: string;
    workflowVersionId: string;
    workflowVersion: number;
  };
}
```

- [ ] **Step 3: Add pure helpers**

Implement:

```ts
export function createDefaultCampaignEditorDraft(): CampaignEditorDraft;
export function createCampaignRequirement(seed?: Partial<CampaignRequirement>): CampaignRequirement;
export function validateCampaignEditorDraft(draft: CampaignEditorDraft): CampaignEditorValidationIssue[];
export function toCampaignEditorPayload(draft: CampaignEditorDraft): CampaignEditorPayload;
```

Rules:

- name is required;
- `goal.targetApproved > 0`;
- `goal.candidateLimit >= goal.targetApproved`;
- at least one requirement is required before start;
- workflow definition/version/version number are required before start;
- do not require campaign code;
- do not emit agent/provider/rule/discovery execution fields.

- [ ] **Step 4: Verify model tests pass**

Run:

```bash
npx ng test dev-tool-web --runner vitest --watch=false --include src/app/features/koc-management/model/koc-campaign-editor.model.spec.ts
```

Expected: PASS.

---

### Task 2: FE-First Campaign Editor Contract Service

**Files:**

- Create: `src/app/features/koc-management/services/koc-campaign-editor-api.service.ts`
- Create: `src/app/features/koc-management/services/koc-campaign-editor-api.service.spec.ts`

- [ ] **Step 1: Write failing service tests**

Cover:

```ts
it('saves a new draft and assigns an id');
it('loads a saved draft by id');
it('updates an existing draft');
it('starts a saved campaign and returns RUNNING status');
it('does not accept reviewedBy or reviewedAt fields on save payload');
```

Run:

```bash
npx ng test dev-tool-web --runner vitest --watch=false --include src/app/features/koc-management/services/koc-campaign-editor-api.service.spec.ts
```

Expected: FAIL because the service does not exist.

- [ ] **Step 2: Implement the in-memory service**

Create `KocCampaignEditorApiService` with methods:

```ts
getCampaign(campaignId: string): Observable<CampaignEditorSavedCampaign>;
createCampaign(payload: CampaignEditorPayload): Observable<CampaignEditorSavedCampaign>;
updateCampaign(campaignId: string, payload: CampaignEditorPayload): Observable<CampaignEditorSavedCampaign>;
startCampaign(campaignId: string): Observable<CampaignEditorSavedCampaign>;
```

Use a private `Map<string, CampaignEditorSavedCampaign>`.

Add one code comment before the storage:

```ts
// ponytail: in-memory FE-first contract; replace the method bodies with HTTP calls when backend endpoints are ready.
```

- [ ] **Step 3: Keep the contract strict**

The saved campaign type should include:

```ts
export interface CampaignEditorSavedCampaign {
  campaignId: string;
  status: 'DRAFT' | 'RUNNING';
  payload: CampaignEditorPayload;
  createdAt: string;
  updatedAt: string;
}
```

Do not add `reviewedBy`, `reviewedAt`, agent, provider, screening rule, discovery
signal, search strategy, or execution config.

- [ ] **Step 4: Verify service tests pass**

Run:

```bash
npx ng test dev-tool-web --runner vitest --watch=false --include src/app/features/koc-management/services/koc-campaign-editor-api.service.spec.ts
```

Expected: PASS.

---

### Task 3: Campaign Editor Store

**Files:**

- Create: `src/app/features/koc-management/stores/campaign-editor.store.ts`
- Create: `src/app/features/koc-management/stores/campaign-editor.store.spec.ts`

- [ ] **Step 1: Write failing store tests**

Cover:

```ts
it('initializes create mode with a clean default draft');
it('updates goal and marks the draft dirty');
it('adds edits and removes a natural-language requirement');
it('blocks save when validation fails');
it('saves a valid draft and clears dirty state');
it('starts a valid campaign and returns the campaign id');
```

Run:

```bash
npx ng test dev-tool-web --runner vitest --watch=false --include src/app/features/koc-management/stores/campaign-editor.store.spec.ts
```

Expected: FAIL because the store does not exist.

- [ ] **Step 2: Implement store signals**

Expose signals:

```ts
readonly draft: Signal<CampaignEditorDraft>;
readonly activeStepId: Signal<CampaignEditorStepId>;
readonly loading: Signal<boolean>;
readonly saving: Signal<boolean>;
readonly error: Signal<string | null>;
readonly validationIssues: Signal<CampaignEditorValidationIssue[]>;
readonly dirty: Signal<boolean>;
readonly savedCampaignId: Signal<string | null>;
readonly canGoBack: Signal<boolean>;
readonly canContinue: Signal<boolean>;
```

Use private writable signals internally.

- [ ] **Step 3: Implement store actions**

Implement:

```ts
initialize(campaignId?: string | null): void;
setStep(stepId: CampaignEditorStepId): void;
back(): void;
continue(): void;
updateDraft(partial: Partial<CampaignEditorDraft>): void;
updateGoal(goal: Partial<CampaignGoal>): void;
updateScope(scope: Partial<CampaignSearchScope>): void;
updateInstructions(instructions: string): void;
addRequirement(): void;
updateRequirement(requirementId: string, partial: Partial<CampaignRequirement>): void;
removeRequirement(requirementId: string): void;
saveDraft(): Promise<CampaignEditorSavedCampaign | null>;
startCampaign(): Promise<CampaignEditorSavedCampaign | null>;
hasUnsavedChanges(): boolean;
issueFor(path: string): string | null;
```

Store must not inject `Router`; the page handles navigation after start.

- [ ] **Step 4: Verify store tests pass**

Run:

```bash
npx ng test dev-tool-web --runner vitest --watch=false --include src/app/features/koc-management/stores/campaign-editor.store.spec.ts
```

Expected: PASS.

---

### Task 4: Campaign Editor Page

**Files:**

- Create: `src/app/features/koc-management/pages/campaign-editor/campaign-editor.component.ts`
- Create: `src/app/features/koc-management/pages/campaign-editor/campaign-editor.component.html`
- Create: `src/app/features/koc-management/pages/campaign-editor/campaign-editor.component.css`
- Create: `src/app/features/koc-management/pages/campaign-editor/campaign-editor.component.spec.ts`

- [ ] **Step 1: Write failing component tests**

Cover:

```ts
it('renders the three business steps');
it('does not render legacy technical workflow fields');
it('lets a user add an arbitrary AI requirement');
it('saves a valid draft through the store');
it('starts and navigates to the campaign review route');
```

The technical-field absence assertion must include these texts:

```ts
[
  'agent',
  'provider',
  'conditionKey',
  'evidenceKey',
  'maxQueries',
  'screeningRules',
  'discoveryExecution',
]
```

Run:

```bash
npx ng test dev-tool-web --runner vitest --watch=false --include src/app/features/koc-management/pages/campaign-editor/campaign-editor.component.spec.ts
```

Expected: FAIL because the component does not exist.

- [ ] **Step 2: Implement the component class**

Use `CampaignEditorStore`, `ActivatedRoute`, `Router`, and `PermissionService`.

Rules:

- route data `mode` controls create/edit copy;
- route param `campaignId` loads edit data;
- `saveDraft()` delegates to store;
- `startCampaign()` delegates to store, then navigates to:

```ts
['/ai-agent-mcrs/koc/campaigns', saved.campaignId, 'review']
```

- [ ] **Step 3: Implement template**

Render the steps:

```text
Campaign
Search Requirements
Review & Start
```

Use existing shared controls:

- `app-input-text` for name, locations, languages, platforms;
- `app-input-area` for description, search instructions, requirement description;
- `app-input-number` for target approved, candidate limit, followers, recent
  activity, confidence, evidence;
- `app-select` or existing select primitive for requirement importance;
- `app-button` for add/remove/back/save/start.

Do not use visible explanatory text about keyboard shortcuts or implementation
details.

- [ ] **Step 4: Implement CSS**

Keep layout quiet and operational:

- max width constrained editor;
- stable 3-step nav;
- responsive two-column form grid on desktop;
- one-column mobile layout;
- no nested cards.

- [ ] **Step 5: Verify component tests pass**

Run:

```bash
npx ng test dev-tool-web --runner vitest --watch=false --include src/app/features/koc-management/pages/campaign-editor/campaign-editor.component.spec.ts
```

Expected: PASS.

---

### Task 5: Review Placeholder Route and Route Surface

**Files:**

- Create: `src/app/features/koc-management/pages/campaign-review/campaign-review.component.ts`
- Create: `src/app/features/koc-management/pages/campaign-review/campaign-review.component.html`
- Create: `src/app/features/koc-management/pages/campaign-review/campaign-review.component.css`
- Create: `src/app/features/koc-management/pages/campaign-review/campaign-review.component.spec.ts`
- Modify: `src/app/features/koc-management/koc-management.routes.ts`
- Modify: `src/app/features/koc-management/koc-management.routes.spec.ts`
- Modify: `src/app/features/koc-management/koc-management.module.ts`

- [ ] **Step 1: Write failing route and placeholder tests**

Route tests should assert:

```ts
create route component === CampaignEditorComponent
edit route component === CampaignEditorComponent
review route exists at 'ai-agent-mcrs/koc/campaigns/:campaignId/review'
candidate deep-link route exists at 'ai-agent-mcrs/koc/campaigns/:campaignId/review/:candidateId'
create/edit route still use serviceManagementUnsavedChangesGuard
```

Placeholder component test should assert it reads `campaignId`.

- [ ] **Step 2: Implement review placeholder**

Create a minimal component that renders through `app-koc-page-frame` and reads:

```ts
readonly campaignId = this.route.snapshot.paramMap.get('campaignId') ?? '';
readonly candidateId = this.route.snapshot.paramMap.get('candidateId');
```

Do not implement candidate list or decision UI in this phase.

- [ ] **Step 3: Update routes**

In `koc-management.routes.ts`:

- import `CampaignEditorComponent`;
- import `CampaignReviewComponent`;
- use `CampaignEditorComponent` for create/edit;
- add review routes before `:campaignId` detail route so Angular matches them
  first.

- [ ] **Step 4: Update module declarations**

In `koc-management.module.ts`:

- add `CampaignEditorComponent`;
- add `CampaignReviewComponent`;
- remove `CampaignWizardComponent` after Task 6 deletes it.

- [ ] **Step 5: Verify route tests pass**

Run:

```bash
npx ng test dev-tool-web --runner vitest --watch=false --include src/app/features/koc-management/koc-management.routes.spec.ts --include src/app/features/koc-management/pages/campaign-review/campaign-review.component.spec.ts
```

Expected: PASS.

---

### Task 6: i18n and Legacy Wizard Removal

**Files:**

- Modify: `src/app/core/i18n/features/koc-management.i18n.json`
- Delete: `src/app/features/koc-management/pages/campaign-wizard/campaign-wizard.component.ts`
- Delete: `src/app/features/koc-management/pages/campaign-wizard/campaign-wizard.component.html`
- Delete: `src/app/features/koc-management/pages/campaign-wizard/campaign-wizard.component.css`
- Delete: `src/app/features/koc-management/pages/campaign-wizard/campaign-wizard.component.spec.ts`
- Delete: `src/app/features/koc-management/model/koc-campaign-wizard.model.ts`
- Delete: `src/app/features/koc-management/model/koc-campaign-wizard.model.spec.ts`

- [ ] **Step 1: Add editor i18n keys**

Add keys under the existing KOC i18n file for:

```text
koc.campaignEditor.step.campaign
koc.campaignEditor.step.searchRequirements
koc.campaignEditor.step.reviewStart
koc.campaignEditor.field.name
koc.campaignEditor.field.description
koc.campaignEditor.field.targetApproved
koc.campaignEditor.field.candidateLimit
koc.campaignEditor.field.platforms
koc.campaignEditor.field.minFollowers
koc.campaignEditor.field.maxFollowers
koc.campaignEditor.field.locations
koc.campaignEditor.field.languages
koc.campaignEditor.field.recentActivityDays
koc.campaignEditor.field.instructions
koc.campaignEditor.requirement.add
koc.campaignEditor.requirement.remove
koc.campaignEditor.requirement.title
koc.campaignEditor.requirement.description
koc.campaignEditor.requirement.importance
koc.campaignEditor.requirement.minimumConfidence
koc.campaignEditor.requirement.minimumEvidence
koc.campaignEditor.workflow.version
koc.campaignEditor.action.saveDraft
koc.campaignEditor.action.start
koc.campaignReview.title
```

- [ ] **Step 2: Remove wizard imports and files**

After Task 5 is green, delete the old wizard files and remove any imports in:

```text
src/app/features/koc-management/koc-management.module.ts
src/app/features/koc-management/koc-management.routes.ts
src/app/features/koc-management/koc-management.routes.spec.ts
```

- [ ] **Step 3: Dependency scan**

Run:

```bash
rg -n "CampaignWizard|campaign-wizard|koc-campaign-wizard|KOC_CAMPAIGN_WIZARD|KocCampaignWizard" src/app/features/koc-management
```

Expected: no output.

- [ ] **Step 4: Focused KOC tests**

Run:

```bash
npx ng test dev-tool-web --runner vitest --watch=false --include src/app/features/koc-management/model/koc-campaign-editor.model.spec.ts --include src/app/features/koc-management/services/koc-campaign-editor-api.service.spec.ts --include src/app/features/koc-management/stores/campaign-editor.store.spec.ts --include src/app/features/koc-management/pages/campaign-editor/campaign-editor.component.spec.ts --include src/app/features/koc-management/pages/campaign-review/campaign-review.component.spec.ts --include src/app/features/koc-management/koc-management.routes.spec.ts
```

Expected: PASS.

---

### Task 7: Phase Verification

**Files:**

- Modify only if verification exposes gaps.

- [ ] **Step 1: Typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 2: Build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 3: Full KOC focused regression**

Run:

```bash
npx ng test dev-tool-web --runner vitest --watch=false --include src/app/features/koc-management/koc-management.routes.spec.ts --include src/app/features/koc-management/pages/campaign-list/campaign-list.component.spec.ts --include src/app/features/koc-management/model/koc-campaign-list.config.spec.ts --include src/app/features/koc-management/model/koc-ai-execution-contract.spec.ts
```

Expected: PASS.

- [ ] **Step 4: Diff check**

Run:

```bash
git diff --check -- src/app/features/koc-management src/app/core/i18n/features/koc-management.i18n.json docs/05-features/20260827-koc-campaign-review-workspace-redesign
```

Expected: no whitespace errors.

- [ ] **Step 5: Commit**

Commit only after all commands pass:

```bash
git add src/app/features/koc-management src/app/core/i18n/features/koc-management.i18n.json docs/05-features/20260827-koc-campaign-review-workspace-redesign docs/01-product/features/koc-campaign-review-workspace-redesign docs/02-ai-spec/features/koc-campaign-review-workspace-redesign
git commit -m "feat(koc): add frontend campaign editor"
```

---

## Plan Self-Review

- Spec coverage: P01 covers REQ-002, REQ-003, REQ-004, REQ-005, REQ-007,
  SEC-001, and NFR-002.
- Explicitly skipped: backend implementation, review workspace shell, candidate
  review, bulk review, global inbox, realtime, permission constant rename.
- No new dependency.
- Old candidate/review pages stay until their replacement phases exist.
