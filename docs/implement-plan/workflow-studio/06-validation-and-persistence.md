# Phase 06 — Validation and Persistence

## Goal

Make workflow editing safe, validate graph integrity and persist workflow/editor state correctly.

## Tasks

### 1. Local Workflow Validator

Implement `WorkflowValidator` with rules including:

- exactly one START
- at least one END
- unique node IDs
- every edge source exists
- every edge target exists
- no invalid dangling connection
- no orphan executable node unless explicitly allowed
- AI_GATE required configuration
- CODE_GATE required handler
- LOGIC configuration validity
- branch/output validity according to the agreed edge contract

Validation result model:

```ts
interface WorkflowValidationIssue {
  code: string;
  severity: 'ERROR' | 'WARNING';
  nodeId?: string;
  edgeId?: string;
  field?: string;
  message: string;
}
```

### 2. Problems Panel

Display validation issues with:

- severity
- node/edge reference
- field when available
- message

Clicking an issue should:

```text
select node/edge
  -> center canvas
  -> open inspector
  -> focus relevant field when practical
```

### 3. Backend Validation

Frontend validation is for fast UX only.

Use or add a backend validation endpoint so the backend remains the source of truth before publish.

Recommended flow:

```text
local validation
  -> backend validation
  -> save latest definition
  -> publish
```

### 4. Persistence

Persist separately:

- workflow semantic definition
- runtime config
- editor metadata

Save/load must preserve:

- graph nodes/edges
- node configurations
- semantic edge information
- node positions
- viewport/zoom where required by the Phase 01 contract

### 5. Dirty State

Mark dirty on:

- node add/delete
- node move
- edge create/delete/reconnect
- inspector changes
- workflow metadata changes
- runtime changes
- editor metadata changes
- auto-layout

Integrate the existing unsaved-changes guard pattern.

## Pseudocode

```ts
async save(): Promise<void> {
  const payload = this.mapper.toUpsertRequest(this.editorStore.snapshot());
  this.editorStore.setSaving(true);
  try {
    const saved = await this.api.updateWorkflow(this.workflowId, payload);
    this.editorStore.loadSavedSnapshot(saved);
    this.editorStore.markSaved();
  } finally {
    this.editorStore.setSaving(false);
  }
}
```

## Tests

- validator requires START
- validator requires END
- duplicate node ID is rejected
- dangling edge is rejected
- invalid AI_GATE is reported
- invalid CODE_GATE is reported
- invalid LOGIC config is reported
- invalid branch semantics are reported
- failed save keeps dirty state
- successful save clears dirty state
- save/load preserves positions
- save/load preserves semantic graph
- publish cannot proceed when backend validation fails

## Acceptance Criteria

- Workflow survives refresh without losing graph, configuration or editor layout.
- Invalid graphs are clearly reported before publish.
- Backend validation is authoritative.
- Dirty state and unsaved-change protection work reliably.
