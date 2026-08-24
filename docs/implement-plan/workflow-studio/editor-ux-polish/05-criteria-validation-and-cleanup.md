# Phase 5 - Criteria Editor, Validation Navigation, and Cleanup

## Goal

Finish the Edit Workflow UX by reducing remaining raw JSON dependence, making invalid input impossible to miss, and tightening responsibilities/tests after the previous phases.

## Main files

```text
src/app/features/workflow-studio/inspector/workflow-node-inspector.model.ts
src/app/features/workflow-studio/inspector/workflow-node-form-inspector.base.ts
src/app/features/workflow-studio/inspector/ai-gate-inspector.component.ts
src/app/features/workflow-studio/inspector/fields/workflow-json-object-editor/*
src/app/features/workflow-studio/problems/*
src/app/features/workflow-studio/pages/workflow-builder-page.component.ts
src/app/features/workflow-studio/store/workflow-editor.store.ts
src/app/features/workflow-studio/**/*spec.ts
```

## 1. Generic structured Criteria editor

Do not hard-code KOC concepts such as parent/child/grade into Workflow Studio.

V1 should support generic object-like criteria:

```text
CRITERIA

Key                 Type       Value
parentRequired      boolean    true
minGrade            number     1
maxGrade            number     5

+ Add criterion
```

Suggested supported primitive types:

- string;
- number;
- boolean;
- null;
- JSON for nested/advanced values when needed.

A generic feature-local component can be named `workflow-json-object-editor` or similar.

Suggested API:

```ts
@Input() value: JsonValue = {};
@Input() readonly = false;
@Output() readonly valueChange = new EventEmitter<JsonValue>();
```

Reject duplicate/empty keys visibly. Do not silently overwrite entries.

## 2. Advanced raw JSON mode

Criteria should follow the same pattern as Input Mapping:

```text
CRITERIA
  structured editor...

> Advanced
    Edit raw JSON
```

Structured and raw modes must share one model and one validation path.

Do not remove raw JSON completely because nested/complex criteria may not fit the V1 structured editor.

## 3. Eliminate silent invalid JSON failure

Current patch creation may return `null` for invalid JSON and the form change is then ignored. That is not sufficient UX.

Required behavior:

```text
invalid field draft
  -> visible field error
  -> inspector/form invalid state
  -> no successful node patch
  -> user draft remains visible for correction
```

Do not simply `return` without user-visible feedback.

Use existing form JSON validation support where possible. If the shared form already exposes validation state/events, wire them through instead of duplicating JSON parsing errors in the inspector.

Pseudo principle:

```ts
formValueChange(value): void {
  if (!this.formState.valid) {
    return; // error is already visible and draft remains in form state
  }

  const patch = workflowNodePatchFromInspectorValue(this.node, value);
  if (!patch) {
    this.reportConversionError();
    return;
  }

  this.nodePatch.emit(patch);
}
```

Conversion failure after a supposedly valid form should be treated as an explicit validation/configuration problem, not ignored.

## 4. Validation problem -> exact section

Build on Phase 3 navigation.

Required V1:

```text
problem -> select/reveal element -> open drawer
```

Preferred V2 in this phase:

```text
problem.field
  -> map field to inspector section
  -> expand that section
  -> focus/scroll field when supported
```

Example:

```text
AI_GATE.inputMapping invalid
  -> select AI Gate
  -> reveal node
  -> open drawer
  -> expand INPUT MAPPING
  -> focus mapping editor
```

Create a small field-to-section mapping local to inspector configuration rather than putting UI section IDs into the workflow domain model.

If the form framework has no safe focus API, implement section expansion/scroll first and leave exact focus as a documented follow-up. Do not use brittle DOM query hacks.

## 5. Clean responsibility boundaries

After Phases 1-4, review `WorkflowBuilderPageComponent` for accumulated logic.

Page may own:

- load/create workflow lifecycle;
- save/publish/run/version orchestration;
- selected element orchestration;
- global editor commands;
- drawer open/close;
- problem-to-canvas navigation.

Page should not own:

- agent catalog transformation;
- provider catalog transformation;
- criteria parsing;
- input mapping row conversion;
- node-specific field defaults;
- edge-specific form details.

Keep node-domain UI logic inside inspector components/helpers.

## 6. Shared UI boundary review

Before moving anything into `src/app/shared/ui` ask:

1. Does another feature use this capability now?
2. Is the API domain-neutral?
3. Can it be documented/tested without mentioning Workflow Studio?

If no, keep it feature-local.

The section-navigation removal may require a shared FormInput capability because the renderer is generic; InputMapping/Criteria editors should remain Workflow Studio-local unless reused elsewhere.

## 7. Translation and theme review

- No visible hard-coded strings.
- Add translation keys for new commands, catalog states, error states, section labels, edge inspector labels, retry actions, and advanced/raw mode.
- Test at least English and Vietnamese key resolution where existing test conventions support it.
- No hard-coded colors; use app/theme tokens.
- Disabled/error/warning states must work in light and dark themes.

## 8. Final integration test scenarios

### Main AI Gate edit flow

```text
Open existing workflow
-> details are collapsed
-> select AI Gate
-> drawer opens
-> no navigation tabs/checkmarks
-> Agent/Prompt visible
-> expand Input Mapping
-> add mapping row
-> expand Criteria
-> edit criterion
-> save workflow
-> reload
-> values preserved
```

### Edge flow

```text
select edge
-> edge drawer opens
-> delete connection
-> edge removed
-> selection cleared
-> drawer closes
```

### Validation flow

```text
validate invalid workflow
-> Problems expands
-> click issue
-> element selected/revealed
-> drawer opens
-> relevant section expands
```

### Readonly flow

```text
open published/readonly version
-> view commands work
-> node/edge inspector readable
-> no graph/config mutation action enabled
```

## Tests/checklist

- [ ] Criteria structured editor round-trips object values.
- [ ] String/number/boolean values preserve type.
- [ ] Duplicate/empty criteria key is visibly invalid.
- [ ] Advanced Criteria JSON remains synchronized with structured mode.
- [ ] Invalid Criteria JSON remains visible and does not patch the node.
- [ ] Invalid Input Mapping JSON follows the same rule.
- [ ] No silent `patch === null` path remains without visible validation.
- [ ] Validation issue opens the correct element drawer.
- [ ] Relevant section expands for field-aware validation where supported.
- [ ] WorkflowBuilderPage responsibilities remain page-level only.
- [ ] New visible text uses translation keys.
- [ ] New styles use theme tokens.
- [ ] Unit/component tests pass.
- [ ] Main integration scenarios pass.

## Done when

Normal AI Gate editing no longer depends on raw JSON, errors are visible and navigable, and the resulting implementation remains cleanly separated between page orchestration, canvas, inspector, and form-field responsibilities.
