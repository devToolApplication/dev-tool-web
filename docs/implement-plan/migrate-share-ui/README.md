# Shared UI Fresh Implementation Plan

> Baseline: fresh review of current `master` after all previous Shared UI migration plans were removed.
> This document is the only implementation plan for `src/app/shared/ui` until explicitly replaced.

## 0. AI execution contract

The implementing AI MUST follow these rules:

1. Read this entire file before changing code.
2. Work in phase order. Do not skip a P0 issue to fix a later cosmetic issue.
3. Do not recreate `v2`, `legacy`, compatibility wrappers, duplicate components, or parallel implementations.
4. Modify the existing Shared UI implementation in place.
5. Preserve the architecture boundary:

```text
Feature Page
  -> Page/Layout composition
  -> UI Pattern
  -> Primitive
  -> Design Token
```

6. Shared UI may own:
   - rendering;
   - reusable interaction state;
   - presentation-only loading/error/empty state;
   - reusable validation/display behavior;
   - generic UI events.
7. Shared UI MUST NOT own:
   - feature/business permission policy;
   - feature routing policy;
   - API request orchestration;
   - application `BasePageResponse` models;
   - persistence to `localStorage`/session storage;
   - CSV/JSON download orchestration;
   - feature-specific OAuth/Keycloak/credential payloads;
   - feature CRUD orchestration.
8. Fix source code. Do not weaken tests or lint rules merely to make the gate green.
9. Do not add blanket `eslint-disable`, `@ts-ignore`, `@ts-nocheck`, `as any`, or broad file exclusions as a workaround.
10. Every architectural change needs behavioral tests, not only `should create` tests.
11. Do not mark an issue COMPLETE because code compiles. The acceptance tests/search gates must pass.
12. Before reporting a phase complete, run the full quality gate in section 10.
13. Keep commits focused by phase. Do not mix unrelated feature work into this migration.

---

## 1. Fresh issue baseline

| ID | Priority | Problem |
|---|---|---|
| SUI-001 | P0 | `ExpressionEngine` executes arbitrary JavaScript via `new Function()` |
| SUI-002 | P0 | Shared Table owns Router/query-param/API pagination orchestration |
| SUI-003 | P0 | Shared Table owns local persistence and CSV download |
| SUI-004 | P0 | Shared contracts contain permission policy and business-specific secret/OAuth models |
| SUI-005 | P0 | Shared Form exports navigation guard and discard-confirmation policy |
| SUI-006 | P1 | Public Form/Table contracts use excessive `any` |
| SUI-007 | P1 | Generic Form readonly mode is not actually rendered correctly |
| SUI-008 | P1 | Form primitives have inconsistent label/help/error/ARIA contracts |
| SUI-009 | P1 | Tree renderer is a god component |
| SUI-010 | P1 | FlowBuilder root owns too much orchestration and file I/O |
| SUI-011 | P1 | Overlay/menu implementations manually manage DOM/focus/portal behavior |
| SUI-012 | P1 | Accessibility rules/semantics are bypassed or patched in DOM |
| SUI-013 | P1 | `SharedModule` exports internal implementation renderers |
| SUI-014 | P2 | `FormInput` still owns DOM scrolling/focus and API-error concerns |
| SUI-015 | P1 | ESLint does not enforce typed safety/a11y/architecture strongly enough |
| SUI-016 | P2 | Critical Shared UI tests are too shallow in several areas |

---

# Phase 1 — Remove arbitrary JavaScript execution

## Scope

- `src/app/shared/ui/patterns/form-input/utils/expression.engine.ts`
- `src/app/shared/ui/patterns/form-input/utils/expression.engine.spec.ts`
- all Form/TableFilter callers of `ExpressionEngine`
- related model types only when required

## SUI-001

### Current problem

Do not keep any implementation equivalent to:

```ts
new Function('model', 'context', 'value', `return (${expression});`);
eval(expression);
```

Form/Table configuration must not be able to execute arbitrary JavaScript.

### Target design

Implement a restricted expression DSL or parser with an explicit whitelist.

Minimum supported expression capabilities should cover actual existing use cases only:

```text
literal values
model.foo / model.foo.bar
context.foo
value
=== !== > >= < <=
&& || !
parentheses
safe helper calls from a fixed helper registry
```

No access to:

```text
window
document
globalThis
Function
eval
constructor
prototype
__proto__
import
arbitrary function calls
assignment
new
```

### Pseudo-code

```ts
type ExpressionValue = string | number | boolean | null | undefined | object;

interface ExpressionContext {
  model: Record<string, unknown>;
  context: Record<string, unknown>;
  value?: unknown;
}

interface ExpressionEvaluator {
  evaluate(expression: string, ctx: ExpressionContext): unknown;
}

function evaluate(node: AstNode, ctx: ExpressionContext): unknown {
  switch (node.kind) {
    case 'literal':
      return node.value;
    case 'path':
      return safeReadPath(resolveRoot(node.root, ctx), node.segments);
    case 'binary':
      return evaluateBinary(node.operator, evaluate(node.left, ctx), evaluate(node.right, ctx));
    case 'helper-call':
      return allowedHelpers[node.name](...node.args.map(arg => evaluate(arg, ctx)));
    default:
      return undefined;
  }
}
```

### Tests required

Add tests proving:

- ordinary boolean expressions work;
- nested model/context paths work;
- tree validation helpers work;
- invalid syntax fails safely;
- `window.location`, `document`, `globalThis`, `constructor`, `Function`, `eval`, assignment and `new` cannot execute;
- expression errors do not mutate input model/context;
- TableFilter and Form validation still work with supported expressions.

### Search gate

```bash
rg "new Function|\beval\(" src/app/shared/ui
```

Expected: zero matches.

### Completion marker

`SUI-001 COMPLETE` only after tests and full gate pass.

---

# Phase 2 — Restore Shared/Feature ownership boundaries

## SUI-002 — Remove routing/API orchestration from Table

### Scope

- `src/app/shared/ui/patterns/table/component/table/base-paged-list.ts`
- `src/app/shared/ui/patterns/table/component/table/table-filter/table-filter.ts`
- `src/app/shared/ui/patterns/table/index.ts`
- feature consumers that currently extend/use `BasePagedList`

### Required result

Shared Table must not import:

```text
ActivatedRoute
Router
@core/http/base-response.model
```

Remove `BasePagedList` from Shared UI public API. Prefer moving feature/page orchestration to an application-level helper outside `shared/ui`, or directly into feature pages.

Table filter must become controlled presentation state:

```ts
@Input() value: TableFilterValue = {};
@Output() valueChange = new EventEmitter<TableFilterValue>();
@Output() search = new EventEmitter<TableFilterValue>();
@Output() reset = new EventEmitter<void>();
```

No route subscription and no `router.navigate()` inside Shared UI.

### Pseudo-code

```ts
// feature page
readonly filters = signal<TableFilterValue>(readFiltersFromRoute());

onFilterSearch(value: TableFilterValue): void {
  this.filters.set(value);
  this.syncRoute(value);
  this.loadPage();
}
```

```html
<app-table
  [data]="rows()"
  [loading]="loading()"
  [totalRecords]="total()"
  (pageChange)="onPageChange($event)"
  (sortChange)="onSortChange($event)"
></app-table>
```

### Tests required

- TableFilter works without Angular Router providers.
- Search/reset emit values only.
- No navigation side effect occurs from Shared Table components.
- Feature adapter/page tests own URL synchronization.
- Pagination loading/request tests move out of Shared UI when `BasePagedList` is moved/removed.

### Search gate

```bash
rg "ActivatedRoute|Router|BasePageResponse|@core/http" src/app/shared/ui/patterns/table
```

Expected: zero matches.

---

## SUI-003 — Remove persistence/export side effects from Table

### Required result

`TableComponent` must not directly call:

```text
localStorage
sessionStorage
URL.createObjectURL
new Blob
createElement('a')
```

Instead emit intent/state:

```ts
@Output() densityChange = new EventEmitter<TableDensity>();
@Output() columnVisibilityChange = new EventEmitter<string[]>();
@Output() exportRequested = new EventEmitter<TableExportRequest<TRow>>();
```

Feature/application layer owns persistence and download/export strategy.

### Tests required

- density/column state emits correctly;
- export emits a typed request;
- no browser storage/download side effect from table tests.

### Search gate

```bash
rg "localStorage|sessionStorage|createObjectURL|new Blob|createElement\(['\"]a['\"]" src/app/shared/ui/patterns/table
```

Expected: zero matches.

---

## SUI-004 — Remove business policy/models from generic Shared contracts

### Table permission

Delete permission ownership such as:

```ts
permissions?: readonly string[];
```

Feature code must resolve permission into presentation state:

```ts
{
  id: 'delete',
  visible: canDelete,
  disabled: !rowDeletable
}
```

Shared UI does not know permission names or permission services.

### Secret/OAuth field

Move/remove generic `secret-metadata` business model from FormConfig if it represents the current Keycloak/BASIC credential payload.

Shared UI should expose reusable primitives such as:

```text
text
password/select
group
array/record
```

Feature code composes those into credential editors.

Shared Form must not contain business constants/types such as:

```text
KEYCLOAK_AUTH
BASIC_AUTH
CLIENT_CREDENTIALS
PASSWORD
clientSecretId
passwordSecretId
tokenUrl
```

unless they are part of a deliberately generic auth library outside the generic Form pattern.

### Search gate

```bash
rg "permissions\?|KEYCLOAK_AUTH|BASIC_AUTH|CLIENT_CREDENTIALS|passwordSecretId|clientSecretId" src/app/shared/ui
```

Expected: zero business-policy matches in generic Shared UI.

---

## SUI-005 — Move unsaved-navigation policy out of Shared Form

Remove `unsavedChangesGuard` from the `form-input` public API and move navigation policy to an application/feature routing layer.

Shared UI may expose generic dirty state:

```ts
isDirty(): boolean;
@Output() dirtyChange = new EventEmitter<boolean>();
```

but must not own `CanDeactivateFn` or decide route discard behavior.

### Search gate

```bash
rg "CanDeactivateFn|unsavedChangesGuard" src/app/shared/ui
```

Expected: zero matches.

### Phase 2 completion

Only report:

`SHARED_BOUNDARY_PHASE_COMPLETE`

when SUI-002 through SUI-005 pass all tests/search gates.

---

# Phase 3 — Type-safe public contracts

## SUI-006

### Goals

Remove `any` from Shared public contracts first. Do not perform a blind search/replace that creates unsafe casts.

### Target generics

```ts
export interface TableConfig<TRow = unknown> { ... }
export interface TableColumn<TRow = unknown> { ... }
export interface TableAction<TRow = unknown> { ... }
export interface TableCellTemplateContext<TRow = unknown> { ... }

export interface FormContext<TUser = unknown, TExtra = unknown> {
  user: TUser | null;
  extra?: TExtra;
  mode?: 'create' | 'edit' | 'view';
}

export interface FieldState<TValue = unknown, TConfig extends FieldConfig = FieldConfig> {
  value: Signal<TValue>;
  setValue(value: TValue): void;
}
```

Use `unknown` at external boundaries and narrow it deliberately.

### Rules

- Do not replace `any` with `unknown as X` everywhere.
- Do not introduce `as any`.
- Callback row types must flow from `TRow`.
- Filter payload must use a named typed alias instead of `Record<string, any>`.
- Keep generics readable; avoid a type-system rewrite that makes consumers unusable.

### Tests

Add compile-time/type fixtures where useful to prove:

- wrong row property/type is rejected;
- action callbacks infer the row type;
- filter value type is not `any`;
- FormContext defaults safely to `unknown`.

### Search gate

```bash
rg "\bany\b" src/app/shared/ui/patterns/form-input src/app/shared/ui/patterns/table
```

Expected: no `any` in exported/public contracts; remaining implementation exceptions require explicit justification.

---

# Phase 4 — Rebuild FormField rendering foundation

## SUI-007 — Real readonly/detail mode

### Target

`readonlyMode` must render presentation output, not merely disabled controls.

Create/reuse a dedicated generic display path:

```html
@if (readonlyMode) {
  <app-value-display
    [value]="field.value()"
    [type]="readonlyType(field)"
  />
} @else {
  <app-field-control ... />
}
```

Complex types may delegate to dedicated readonly renderers, but the behavior must be explicit and tested.

### Tests

For text, number, date, boolean, select and JSON:

- view mode renders non-editable presentation;
- editor control is absent in true readonly/detail mode;
- `disabled-controls` layout mode still renders disabled editor when specifically configured.

---

## SUI-008 — One FormField shell contract

### Problem

Controls currently render label/help/error inconsistently.

### Target

Introduce a single presentation wrapper, for example:

```text
forms/form-field/
  form-field.component.ts
  form-field.component.html
  form-field.component.css
```

Responsibilities:

```text
label
required marker
help text
validation error
aria-describedby
invalid/disabled state styling
consistent spacing
```

Primitives such as InputText/InputNumber/Select should focus on the actual interactive control, not duplicate field chrome inconsistently.

### Pseudo-code

```html
<app-form-field
  [label]="field.label"
  [required]="field.required()"
  [helpText]="helpText"
  [errorMessage]="firstErrorMessage"
  [invalid]="showInvalid"
>
  <app-input-text
    [value]="field.value()"
    [disabled]="field.disabled()"
    [describedBy]="descriptionIds"
    (valueChange)="field.setValue($event)"
  />
</app-form-field>
```

### Tests

Behavioral contract tests for each supported scalar primitive:

- label visible and associated with control;
- required state rendered correctly;
- help text visible;
- validation error visible only when invalid;
- `aria-describedby` points to help/error elements;
- no duplicate label/error output.

`FieldRenderer` test must cover every supported scalar field family. `should create` alone is insufficient.

---

# Phase 5 — Decompose Tree pattern

## SUI-009

Do not rewrite tree behavior in one new god service.

### Target component/state boundaries

Recommended shape:

```text
field-tree-renderer/
  field-tree-renderer.ts        # composition only
  tree-field.state.ts           # generic tree state operations
  tree-toolbar/
  tree-node/
  tree-selection-panel/
  tree-picker/
  tree-detail/
  tree-json-editor/
```

Exact naming may differ, but responsibilities must be split.

### Root component acceptance

Root must not implement all of:

```text
search
selection propagation
picker orchestration
JSON editor
confirm workflow
node mutations
recursive view construction
keyboard/focus logic
```

### Confirmation policy

Tree may emit destructive intent:

```ts
clearRequested
removeNodeRequested
replaceNodeRequested
```

Do not hard-wire feature confirmation/persistence behavior into generic tree state.

### Tests

- tree state unit tests for selection, descendant propagation, filtering, move/replace;
- component tests for toolbar/picker/selection UI;
- readonly behavior;
- large tree operations do not mutate original inputs unexpectedly;
- destructive intent emits without hidden business side effects.

---

# Phase 6 — Decompose FlowBuilder and remove file I/O

## SUI-010

### Keep in Shared FlowBuilder

- graph editing interaction;
- selection;
- viewport interaction;
- node/edge render orchestration;
- generic command dispatch;
- generic history if it remains fully UI/domain-agnostic.

### Move out / emit intent

Remove direct browser file import/export from the root component:

```text
FileReader
Blob
URL.createObjectURL
download anchor creation
```

Expose typed intents/data instead:

```ts
@Output() exportRequested = new EventEmitter<FlowDefinition>();
@Output() importRequested = new EventEmitter<void>();

applyImportedDefinition(definition: FlowDefinition): void;
```

Application/feature code owns file selection/read/download.

### Decompose root orchestration

Extract focused state/controllers for:

```text
history
selection
command resolution
context menu
inspector updates
```

Do not hide everything inside one giant `FlowBuilderService`.

### Tests

Add a real `FlowBuilderComponent` spec covering:

- node add/move/delete;
- edge connect;
- selection;
- undo/redo;
- command enablement;
- readonly mode;
- inspector updates;
- export/import intent contracts.

### Search gate

```bash
rg "FileReader|createObjectURL|new Blob|createElement\(['\"]a['\"]" src/app/shared/ui/patterns/flow-builder
```

Expected: zero matches.

---

# Phase 7 — Normalize overlay infrastructure and accessibility

## SUI-011 — Use Angular CDK infrastructure

Project already contains Angular CDK. Prefer it for:

```text
overlay positioning
portal/attach-detach
focus trapping
focus restoration
outside click
scroll strategy
escape handling
```

Priority targets:

- `overlay/drawer`
- table action overflow menu
- reusable popup/dialog paths where manual portal behavior exists

### Forbidden implementation pattern

Do not leave multiple components each manually doing:

```ts
document.body.appendChild(...)
document.body.removeChild(...)
document.body.style.overflow = ...
getBoundingClientRect() + manual portal positioning
manual document tab loops
```

Direct DOM access may remain only where CDK/Angular cannot reasonably solve the operation, with tests and a narrow explanation.

---

## SUI-012 — Accessibility becomes a real gate

### Required fixes

- remove DOM hacks that delete `role` / `aria-labelledby` after rendering;
- repair the actual component semantics instead;
- custom select/menu/dialog interactions need correct roles and keyboard behavior;
- restore Angular template accessibility rules rather than disabling them globally.

### Tests

At minimum add keyboard/a11y tests for:

```text
FormField/input association
Select
Drawer/dialog
Table action menu
Tree interaction
```

---

# Phase 8 — Public API cleanup

## SUI-013

`SharedModule` must not export implementation-only renderer components merely because they need to be declared internally.

### Public candidates

Keep approved public APIs such as:

```text
FormInput
Form public models
TableComponent
Table public models
FlowBuilder public facade
layout components
feedback components
data-display components
approved primitives
```

### Internal candidates

Do not export internals such as:

```text
FieldRenderer
FieldArrayRenderer
FieldGroupRenderer
FieldRecordRenderer
FieldTreeRenderer
TableCellComponent
TableFilterComponent (unless explicitly intended as a public pattern)
```

Declare internal components but keep them out of public exports.

### Tests

- application build proves existing intended consumers still compile;
- add a simple architecture/API test if possible to prevent re-exporting known internals.

---

# Phase 9 — FormInput responsibility cleanup

## SUI-014

This is a targeted cleanup, not a rewrite of the whole form engine.

### DOM interaction

Replace broad calls such as:

```text
document.querySelector
document.getElementById
```

with Angular-owned references/directives or a focused scrolling/focus abstraction.

### API errors

Keep generic external field-error presentation, but separate application API response mapping from the Form component.

Preferred contract:

```ts
@Input() externalErrors: FormValidationError[] = [];
```

Application API adapters convert backend response -> `FormValidationError[]`.

Shared Form should not understand backend response shapes.

### Tests

- external errors map to fields and summary;
- focus/scroll targets the correct rendered field;
- no global selector collision when two forms exist on the same page.

---

# Phase 10 — Make lint/testing enforce the architecture

## SUI-015 — ESLint

Current real lint script must remain:

```json
"lint": "eslint .",
"typecheck": "tsc --noEmit"
```

Do not merge lint and typecheck into the same fake script.

### Typed lint target

Use type-aware TypeScript ESLint configuration for production Shared code.

Required protections should include appropriate forms of:

```text
no-explicit-any
no-unsafe-assignment
no-unsafe-argument
no-unsafe-call
no-unsafe-member-access
no-unsafe-return
no-floating-promises
no-misused-promises
consistent-type-imports
no-unused-vars
```

Use `projectService: true` or the supported equivalent for the installed toolchain.

### Architecture restrictions

Use `no-restricted-imports` or an equivalent architecture test to prevent Shared UI importing feature/auth/application API policy.

Do not invent aliases: inspect actual `tsconfig` paths first.

### Accessibility lint

Do not globally disable accessibility rules just to pass existing templates. Fix templates/components first; use narrow documented exceptions only when unavoidable.

---

## SUI-016 — Behavioral safety net

Every critical pattern must have meaningful behavior tests.

Minimum coverage groups:

```text
FormInput
FieldRenderer/FormField
Table
TableFilter
Tree
FlowBuilder
Drawer/Dialog
public API boundary
expression DSL
```

Avoid tests whose only assertion is:

```ts
expect(component).toBeTruthy();
```

Creation tests may remain, but they do not satisfy behavioral acceptance.

---

# 10. Mandatory quality gate

Before any phase is reported complete, run:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run build
npm test -- --watch=false
```

If Storybook files/components are changed, also run the repository's Storybook build/test command that applies to the modified scope.

AI MUST report the exact failing command if any gate fails.

Do not report `SHARED_UI_COMPLETE` while a required gate is unverified or failing.

---

# 11. Final architecture search gates

Run these before final completion:

```bash
rg "new Function|\beval\(" src/app/shared/ui
rg "ActivatedRoute|Router|BasePageResponse|@core/http" src/app/shared/ui/patterns/table
rg "localStorage|sessionStorage|createObjectURL|FileReader|new Blob" src/app/shared/ui
rg "CanDeactivateFn|unsavedChangesGuard" src/app/shared/ui
rg "KEYCLOAK_AUTH|BASIC_AUTH|CLIENT_CREDENTIALS|passwordSecretId|clientSecretId" src/app/shared/ui
rg "@features/|/features/|@core/auth/" src/app/shared/ui
rg "@ts-ignore|@ts-nocheck|as any" src/app/shared/ui
```

Every remaining match must be reviewed. A non-zero match is not automatically acceptable because tests pass.

---

# 12. Final acceptance checklist

AI may report `SHARED_UI_COMPLETE` only when all items below are true:

- [ ] SUI-001 arbitrary JS execution removed.
- [ ] SUI-002 Shared Table no longer owns Router/API page orchestration.
- [ ] SUI-003 Shared Table no longer owns persistence/download behavior.
- [ ] SUI-004 permission/business credential models removed from generic Shared contracts.
- [ ] SUI-005 navigation guard policy moved out of Shared Form.
- [ ] SUI-006 public Form/Table contracts are type-safe and no longer based on `any`.
- [ ] SUI-007 readonly/detail form mode has real behavior.
- [ ] SUI-008 FormField label/help/error/ARIA behavior is consistent.
- [ ] SUI-009 Tree is decomposed into testable responsibilities.
- [ ] SUI-010 FlowBuilder root is decomposed and browser file I/O removed.
- [ ] SUI-011 overlays/menus use shared/CDK infrastructure instead of repeated manual DOM portals.
- [ ] SUI-012 accessibility hacks are removed and a11y lint/tests pass.
- [ ] SUI-013 public exports expose intended APIs only.
- [ ] SUI-014 FormInput DOM/API-error responsibilities are cleaned up.
- [ ] SUI-015 typed ESLint + architecture rules are active.
- [ ] SUI-016 critical behavioral tests exist and pass.
- [ ] `npm run format:check` passes.
- [ ] `npm run lint` passes.
- [ ] `npm run typecheck` passes.
- [ ] `npm run build` passes.
- [ ] `npm test -- --watch=false` passes.
- [ ] final architecture search gates are reviewed and acceptable.

Final output format:

```text
SUI-001 PASS
SUI-002 PASS
...
SUI-016 PASS
QUALITY_GATE PASS
SHARED_UI_COMPLETE
```

If any item is incomplete, report `SHARED_UI_INCOMPLETE` and list only the remaining blockers. Do not claim completion based on commit messages, Vercel status, or weakened tests.
