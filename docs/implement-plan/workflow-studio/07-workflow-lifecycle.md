# Phase 07 — Workflow Lifecycle

## Goal

Implement the end-user workflow management lifecycle: list, create/edit, save, validate, version, publish and run.

## Tasks

### 1. Workflow List

Route:

```text
/ai-agent-mcrs/workflows
```

Suggested columns:

- Workflow
- Status
- Version
- Updated At
- Last Run
- Actions

Actions:

- Edit
- Run
- Publish
- View Runs

Clicking a workflow should open the builder directly rather than a generic CRUD detail page.

### 2. Workflow Builder Page

Routes:

```text
/ai-agent-mcrs/workflows/create
/ai-agent-mcrs/workflows/:workflowId/edit
```

Layout:

```text
Header
Palette | Canvas | Inspector
Problems Panel
```

Header actions:

- Validate
- Save
- Versions
- Publish
- Run

Save should update state in place and must not require a full page reload.

### 3. Version UI

Display available versions and their state/metadata.

Published workflow/version should use readonly canvas behavior where required.

Do not create a separate graph renderer for version preview.

If backend cannot load a specific historic definition yet, keep the initial version UI scoped to available metadata and document the required backend endpoint before adding fake client behavior.

### 4. Run Dialog

Allow the user to provide workflow input using the existing JSON/CodeMirror capabilities in the project.

Call the workflow start API and navigate to run detail after success.

### 5. Route Integration

Register workflow routes following the current feature route conventions.

Reuse existing shared list/form/dialog/pagination components where appropriate; do not bypass the shared UI migration architecture.

## Pseudocode

```ts
async publish(): Promise<void> {
  const local = this.validator.validate(this.editorStore.snapshot());
  if (local.hasErrors) {
    this.problems.open(local.issues);
    return;
  }

  await this.ensureSaved();
  await this.backendValidator.validate(this.workflowId);
  const detail = await this.api.publishWorkflow(this.workflowId);
  this.editorStore.loadWorkflow(detail);
}
```

```ts
async run(input: unknown): Promise<void> {
  const run = await this.api.startWorkflow(this.workflowId, { input });
  await this.router.navigate(['/ai-agent-mcrs/workflow-runs', run.id]);
}
```

## Tests

- workflow list loads and paginates
- create route initializes an empty workflow correctly
- edit route loads workflow detail
- unsaved guard protects dirty builder
- save updates builder state
- publish runs validation before API publish
- publish handles backend validation errors
- version selection uses readonly mode when applicable
- run dialog validates JSON input
- successful run navigates to run detail

## Acceptance Criteria

- User can manage a workflow from list through publish/run.
- Lifecycle logic remains outside canvas presentation components.
- No duplicate graph implementation is introduced for versions.
- All routes follow existing app conventions.
