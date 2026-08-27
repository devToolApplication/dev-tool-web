# Workflow BPMN Import/Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `.bpmn` import and export actions to the Workflow Studio edit canvas toolbar.

**Architecture:** Keep all browser file behavior in `WorkflowBuilderPageComponent`, which already owns toolbar commands and the BPMN XML store bridge. Use native browser `File.text()`, `Blob`, and object URLs; do not add dependencies or backend APIs.

**Tech Stack:** Angular 21, signals, existing shared `app-button`, native browser file APIs, Jasmine/Karma Angular component tests.

---

### Task 1: Page Tests

**Files:**

- Modify: `src/app/features/workflow-studio/pages/workflow-builder-page.component.spec.ts`

- [ ] **Step 1: Add failing tests**

Add tests that construct a `File`, call `component.importBpmnFile(file)`, and assert `store.bpmnXml()` updates for valid `.bpmn`. Add readonly and export tests using spies for `document.createElement`, `URL.createObjectURL`, and `URL.revokeObjectURL`.

- [ ] **Step 2: Run test to verify RED**

Run: `npm test -- --watch=false --include src/app/features/workflow-studio/pages/workflow-builder-page.component.spec.ts`

Expected: FAIL because `importBpmnFile`, `exportBpmnFile`, and related helpers do not exist.

### Task 2: Page Implementation

**Files:**

- Modify: `src/app/features/workflow-studio/pages/workflow-builder-page.component.ts`
- Modify: `src/app/features/workflow-studio/pages/workflow-builder-page.component.html`
- Modify: `src/app/core/i18n/features/workflow-studio.i18n.json`

- [ ] **Step 1: Add import/export methods**

Add methods on `WorkflowBuilderPageComponent`:

```ts
openBpmnImport(fileInput: HTMLInputElement): void;
async onBpmnImportSelected(event: Event): Promise<void>;
async importBpmnFile(file: File): Promise<void>;
exportBpmnFile(): void;
```

Use `this.store.updateBpmnXml(xml)` for import and native `Blob` download for export.

- [ ] **Step 2: Add toolbar buttons and hidden input**

Add two icon buttons near existing canvas controls:

```html
<app-button icon="pi pi-upload" ...></app-button>
<app-button icon="pi pi-download" ...></app-button>
<input #bpmnFileInput type="file" accept=".bpmn,.xml,application/xml,text/xml" hidden ... />
```

- [ ] **Step 3: Add i18n keys**

Add Vietnamese and English keys:

```json
"workflowStudio.bpmn.import": "Import BPMN",
"workflowStudio.bpmn.export": "Export BPMN",
"workflowStudio.bpmn.importEmpty": "BPMN file is empty",
"workflowStudio.bpmn.importInvalidExtension": "Only .bpmn and .xml files are supported"
```

- [ ] **Step 4: Run tests to verify GREEN**

Run: `npm test -- --watch=false --include src/app/features/workflow-studio/pages/workflow-builder-page.component.spec.ts`

Expected: PASS.

### Task 3: Verification

**Files:**

- Verify only.

- [ ] **Step 1: Typecheck**

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 2: Build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/app/features/workflow-studio/pages/workflow-builder-page.component.ts src/app/features/workflow-studio/pages/workflow-builder-page.component.html src/app/features/workflow-studio/pages/workflow-builder-page.component.spec.ts src/app/core/i18n/features/workflow-studio.i18n.json docs/superpowers/plans/2026-08-27-workflow-bpmn-import-export.md
git commit -m "feat(workflow): add BPMN import export actions"
```
