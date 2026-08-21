# Shared UI Final Execution Plan + Clean Code Gate — 2026-08-22

Baseline when this plan was created: `master` at `06c7f42ad1ff2ef44d35dae84439f2eb9340c3a7`.

This document is the executable work order for completing the original shared-UI migration requirements and cleaning the implementation. It supplements the existing F01-F08 files and is mandatory for the next remediation pass.

## Execution rules

Do not create parallel implementations.

Forbidden:

```text
FooV2
NewFoo
LegacyFoo
compatibilityMode
useNewUi
old + new public contracts living together
long-lived compatibility adapters
```

Required change sequence:

```text
inspect current master
-> impact map
-> change contract
-> migrate every consumer
-> delete old contract/code
-> add behavior tests
-> run quality gates
-> run search gates
-> review diff
-> COMPLETE or INCOMPLETE
```

A successful build or Vercel deploy is not proof that a phase is complete.

---

# CLEAN-01 — Mandatory clean-code requirement for every phase

CLEAN-01 is not a final cleanup phase. It must pass after every F01-F08 change.

## Checklist

- [ ] Do not add `any` to shared public/core contracts.
- [ ] Remove existing `any` when the touched contract can be typed safely.
- [ ] No unused imports, variables, methods, inputs or outputs.
- [ ] No dead compatibility properties after migration.
- [ ] No fake fallback such as `|| true` to preserve removed behavior.
- [ ] No deleted assertion replaced only by a comment.
- [ ] No test that bypasses the Angular/component contract it claims to test.
- [ ] No business permission/confirm/export/routing policy inside shared presentation components.
- [ ] No `DoCheck` or JSON-stringification reactivity hacks.
- [ ] No direct `document.body` overlay/focus infrastructure where Angular CDK provides the primitive.
- [ ] Extract pure algorithms from Angular components when they do not require Angular.
- [ ] Keep a component focused on one primary responsibility.
- [ ] Split large mixed-responsibility components instead of growing conditional branches.
- [ ] Public API exposes only supported consumer contracts.
- [ ] Naming uses one concept for one meaning; do not keep both `danger` and `destructive`, or `severity` and `variant`, for the same behavior.
- [ ] Tests assert behavior, state and integration contracts rather than internal implementation details.

## Mandatory lint/tooling target

`package.json` must use real ESLint:

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

Required dependencies/configuration should include compatible Angular/TypeScript tooling, for example:

```text
eslint
typescript-eslint
@angular-eslint/eslint-plugin
@angular-eslint/eslint-plugin-template
@angular-eslint/template-parser
eslint.config.mjs
```

Minimum policy:

```text
unused imports/vars
prefer-const
eqeqeq
Angular naming
Angular template accessibility
no new explicit any in shared core/public contracts
```

## CLEAN-01 search gate

```bash
rg "implements .*DoCheck|ngDoCheck" src/app/shared/ui
rg "engineRevision|inputRevision|lastContextSignature" src/app/shared/ui
rg "defaultDangerConfirm|actionSeverity" src/app/shared/ui
rg "LEGACY_|Legacy|V2|compatibilityMode|useNewUi" src/app/shared
rg "PermissionService" src/app/shared/ui
```

Remaining matches must be zero for forbidden patterns or explicitly justified for non-forbidden domain data names.

---

# F01 — Close all P0 blockers

Do not start F02 while any F01 item fails.

## F01.1 — Real projected form-action integration tests

### Required implementation

Use a real Angular HostComponent. Do not append an arbitrary DOM node to `fixture.nativeElement`.

Pseudo-code:

```ts
@Component({
  template: `
    <app-form-input
      [config]="config"
      [context]="context"
      [initialValue]="model"
      [loading]="loading"
      [submitting]="submitting"
      (formSubmit)="onSubmit($event)"
    >
      <div form-actions>
        <button type="button" data-testid="cancel" (click)="onCancel()">Cancel</button>
        <button type="submit" data-testid="save">Save</button>
      </div>
    </app-form-input>
  `
})
class FormHostComponent {
  loading = false;
  submitting = false;
  submitSpy = vi.fn();
  cancelSpy = vi.fn();

  onSubmit(value: unknown): void {
    this.submitSpy(value);
  }

  onCancel(): void {
    this.cancelSpy();
  }
}
```

### Checklist

- [ ] Exactly one Save renders.
- [ ] Exactly one Cancel renders.
- [ ] Save is projected through Angular content projection.
- [ ] Invalid form emits zero submit events.
- [ ] Valid form emits exactly one submit event.
- [ ] `submitting=true` blocks duplicate submit.
- [ ] `loading=true` blocks submit.
- [ ] Cancel invokes consumer handler.
- [ ] Dirty/reset coverage is restored.
- [ ] Remove unused test variables.
- [ ] Remove dead `showSubmit` API if no consumer exists.

### Concrete tests

```ts
it('projects exactly one cancel and save action', () => {
  expect(fixture.nativeElement.querySelectorAll('[data-testid="cancel"]').length).toBe(1);
  expect(fixture.nativeElement.querySelectorAll('[data-testid="save"]').length).toBe(1);
});
```

```ts
it('does not submit an invalid form', () => {
  fixture.nativeElement.querySelector('[data-testid="save"]').click();
  expect(host.submitSpy).not.toHaveBeenCalled();
});
```

```ts
it('submits a valid form exactly once', () => {
  setRequiredFieldValue('Ready');
  fixture.detectChanges();
  fixture.nativeElement.querySelector('[data-testid="save"]').click();
  expect(host.submitSpy).toHaveBeenCalledTimes(1);
});
```

```ts
it('invokes consumer cancel handler', () => {
  fixture.nativeElement.querySelector('[data-testid="cancel"]').click();
  expect(host.cancelSpy).toHaveBeenCalledTimes(1);
});
```

```ts
it.each([
  ['loading', true],
  ['submitting', true]
] as const)('blocks submit when %s', (property, value) => {
  setRequiredFieldValue('Ready');
  host[property] = value;
  fixture.detectChanges();
  fixture.nativeElement.querySelector('[data-testid="save"]').click();
  expect(host.submitSpy).not.toHaveBeenCalled();
});
```

---

## F01.2 — Readonly/detail renderer for every supported field

Readonly/detail mode must display data, not disabled editors.

Target split:

```text
edit -> FieldEditorRenderer
view -> FieldReadonlyRenderer
```

Target mapping:

```text
text/textarea      -> ValueDisplay
number             -> ValueDisplay
currency/percent   -> formatted ValueDisplay
boolean            -> readable semantic display
select             -> resolved option label
multi-select       -> readable tag/value list
date/datetime      -> formatted ValueDisplay
array              -> readonly repeated-value view
record             -> KeyValueList
json               -> JsonViewer
tree               -> TreeView
secret/credential  -> masked detail
```

Pseudo-code:

```html
@if (readonlyMode()) {
  <app-field-readonly-renderer [field]="field" />
} @else {
  <app-field-editor-renderer [field]="field" />
}
```

### Checklist

- [ ] No supported field disappears in view mode.
- [ ] No editor control is the default readonly presentation.
- [ ] Tree readonly shows nodes and labels.
- [ ] Tree readonly contains no add/remove/replace/select mutation controls.
- [ ] Advanced JSON readonly uses `JsonViewer`, not editable textarea + disabled actions.
- [ ] Secret values are masked according to contract.

### Concrete tests

```ts
it('renders text as data display in view mode', () => {
  setViewModeWithField({ type: 'text', name: 'name', label: 'Name' }, { name: 'Demo' });
  expect(fixture.nativeElement.querySelector('app-value-display')).toBeTruthy();
  expect(fixture.nativeElement.querySelector('app-input-text')).toBeNull();
});
```

```ts
it('renders tree nodes without mutation controls in view mode', () => {
  setReadonlyTree();
  expect(fixture.nativeElement.querySelector('app-tree-view')).toBeTruthy();
  expect(findButton('add')).toBeNull();
  expect(findButton('delete')).toBeNull();
  expect(findButton('applyJson')).toBeNull();
});
```

Add equivalent tests for number/select/boolean/array/record/json/secret.

---

## F01.3 — Remove Table permission/confirmation/action compatibility contracts

Target action contract:

```ts
export type TableActionVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

export interface TableAction<T> {
  id: string;
  label: string;
  icon?: string;
  tooltip?: string;
  variant?: TableActionVariant;
  visible?: boolean;
  disabled?: boolean;
  placement?: 'primary' | 'more';
}
```

Feature owns authorization and confirmation:

```ts
const deleteAction = computed<TableAction<Job>>(() => ({
  id: 'delete',
  label: 'Delete',
  variant: 'destructive',
  visible: permissionService.canDeleteJob(),
  disabled: currentJob()?.locked === true
}));

async function handleAction(event: TableActionEvent<Job>): Promise<void> {
  if (event.action.id !== 'delete') return;
  if (!(await confirmService.confirm(deleteMessage(event.row)))) return;
  await jobService.delete(event.row.id);
}
```

### Checklist

- [ ] Delete `permissions` from Table actions/config.
- [ ] Delete `permissionMode`.
- [ ] Delete `permissionDeniedTooltip`.
- [ ] Delete `confirm` from shared table action models.
- [ ] Delete `severity`.
- [ ] Delete `text` compatibility property.
- [ ] Delete `default`, `warning`, `danger` action variants.
- [ ] Migrate `danger` consumers to `destructive`.
- [ ] Remove `ConfirmDialogService` from Table and TableCell.
- [ ] Delete `defaultDangerConfirm`.
- [ ] Delete `actionSeverity` compatibility mapper.
- [ ] Migrate all stories/tests/feature consumers in the same change.

Search gates:

```bash
rg "permissions|permissionMode|permissionDeniedTooltip" src/app/shared/ui/patterns/table
rg "ConfirmDialogService|defaultDangerConfirm|actionSeverity|confirm\?" src/app/shared/ui/patterns/table
rg "severity\?|text\?|variant.*danger|variant.*warning|variant.*default" src/app/shared/ui/patterns/table
```

Expected: zero legacy action-policy contract matches.

---

## F01.4 — Real ESLint gate

### Checklist

- [ ] Replace `lint = tsc --noEmit` with `eslint .`.
- [ ] Add Angular template linting.
- [ ] Add `lint:fix`.
- [ ] Clean all new unused imports/variables/methods.
- [ ] Run lint against both `.ts` and Angular templates.

Mandatory F01 gates:

```bash
npm run format:check
npm run lint
npm run build
npm test -- --watch=false
```

F01 may be marked complete only when F01.1-F01.4 and CLEAN-01 all pass.

---

# F02 — Primitive/FormField cleanup

Current BaseInput responsibilities must be split.

Target low-level CVA base:

```ts
abstract class BaseControl<T> implements ControlValueAccessor {
  @Input() value: T | null = null;
  @Input() disabled = false;
  @Input() readonly = false;

  writeValue(value: T | null): void {}
  registerOnChange(fn: (value: T | null) => void): void {}
  registerOnTouched(fn: () => void): void {}
  setDisabledState(disabled: boolean): void {}
}
```

FormField/FieldBlock owns presentation:

```text
label
description
help text
required indicator
error text
tooltip
aria-describedby
layout
```

### Checklist

- [ ] Remove label/help/error presentation from BaseInput.
- [ ] Remove FloatLabelType from BaseInput.
- [ ] Remove `styleClass`/`iconClass` from BaseInput core contract.
- [ ] Standardize `size` to `sm | md | lg` where a primitive actually needs size.
- [ ] Make IDs deterministic or explicitly injectable.
- [ ] Introduce generic `SelectOption<T>`.
- [ ] Migrate consumers and delete old properties in the same phase.

Tests:

```ts
it('propagates CVA changes', () => {
  const change = vi.fn();
  control.registerOnChange(change);
  control.onChange('value');
  expect(change).toHaveBeenCalledWith('value');
});
```

```ts
it('associates field error using aria-describedby', () => {
  expect(input.getAttribute('aria-describedby')).toContain(errorElement.id);
});
```

---

# F03 — Typed Form engine, simplified config, structural page and dirty state

## F03.1 — Remove reactivity hacks and type public boundaries

Target API:

```ts
interface FormEngine<TModel> {
  readonly model: Signal<TModel>;
  readonly valid: Signal<boolean>;
  readonly dirty: Signal<boolean>;
  readonly fields: readonly FieldState<unknown>[];
  reset(value: TModel): void;
  patchValue(value: Partial<TModel>): void;
  markAllAsTouched(): void;
  markClean(): void;
}
```

```ts
export class FormInput<TModel extends object> {
  @Input({ required: true }) config!: FormConfig<TModel>;
  @Input({ required: true }) initialValue!: TModel;
  @Output() formSubmit = new EventEmitter<TModel>();
  @Output() valueChange = new EventEmitter<TModel>();
  @Output() dirtyChange = new EventEmitter<boolean>();
}
```

### Checklist

- [ ] Remove `DoCheck`.
- [ ] Remove `engineRevision`.
- [ ] Remove `inputRevision`.
- [ ] Remove context JSON-signature comparison.
- [ ] Remove `engine: any`.
- [ ] Remove public `any` from FormInput/FormConfig/FieldState core boundaries.
- [ ] Delete dead `showSubmit`.
- [ ] Prefer immutable/change-driven context updates.

## F03.2 — Simplify FormConfig

Target semantic layout contract:

```ts
type FieldWidth = 'short' | 'medium' | 'full';

interface FormConfig<TModel> {
  fields: readonly FieldConfig<TModel>[];
  sections?: readonly FormSectionConfig[];
}
```

Remove or replace:

```text
1/2, 1/3, 1/4, 1/6
smart/wizard mode flags when composition can express the layout
showStatusPanel
stickyFooter
readonly disabled-controls mode
feature-specific OAuth/credential placeholders from generic schema
```

## F03.3 — Dirty/unsaved state contract

Pseudo-code:

```ts
readonly dirty = this.engine.dirty;

dirtyChange = output<boolean>();

markSaved(): void {
  this.engine.markClean();
}
```

Feature:

```ts
readonly dirty = signal(false);

onDirtyChange(value: boolean): void {
  this.dirty.set(value);
}

hasUnsavedChanges(): boolean {
  return this.dirty();
}

async onSubmit(model: JobModel): Promise<void> {
  await save(model);
  this.form.markSaved();
  this.dirty.set(false);
  await navigateBack();
}
```

Tests:

```ts
it('marks dirty after edit and clean after successful save', async () => {
  editField('name', 'Changed');
  expect(component.dirty()).toBe(true);
  await component.onSubmit(validModel);
  expect(component.dirty()).toBe(false);
});
```

```ts
it('reports unsaved changes to the route guard', () => {
  component.dirty.set(true);
  expect(component.hasUnsavedChanges()).toBe(true);
});
```

## F03.4 — PageShell structural only

Target usage:

```html
<app-page-shell width="content">
  <app-page-header ... />
  <app-content-state [state]="state()" (retry)="reload()">
    <router-outlet />
  </app-content-state>
</app-page-shell>
```

PageShell should own container width/spacing/slots, not loading/error/empty/retry orchestration.

---

# F04 — Generic presentation-only Table rewrite

Target API:

```ts
class TableComponent<T> {
  @Input() rows: readonly T[] = [];
  @Input() columns: readonly TableColumn<T>[] = [];
  @Input() page?: TablePageState;
  @Input() sort?: TableSort;
  @Input() selection?: readonly T[];

  @Output() sortChange = new EventEmitter<TableSort>();
  @Output() pageChange = new EventEmitter<TablePageState>();
  @Output() selectionChange = new EventEmitter<readonly T[]>();
  @Output() actionClick = new EventEmitter<TableActionEvent<T>>();
}
```

Remove from shared Table:

- [ ] CSV generation.
- [ ] Blob/download orchestration.
- [ ] Import workflow.
- [ ] Business export workflow.
- [ ] `localStorage` persistence policy.
- [ ] Permission and confirmation.
- [ ] API response mapping.
- [ ] Routing/navigation.
- [ ] stale `changes['pageResponse']` checks.

Feature/controller owns those workflows.

## F04.1 — Accessibility

Sortable header:

```html
<th [attr.aria-sort]="ariaSort(column)">
  @if (column.sortable) {
    <button type="button" (click)="requestSort(column)">
      {{ column.header }}
    </button>
  } @else {
    {{ column.header }}
  }
</th>
```

Selection control:

```html
<app-check-box [ariaLabel]="'Select ' + rowLabel(row)" ... />
```

Tests:

```ts
it('uses a real button for sortable headers', () => {
  expect(getSortableHeader('name').querySelector('button')).toBeTruthy();
});
```

```ts
it('sets aria-sort on the active sort column', () => {
  expect(getHeader('name').getAttribute('aria-sort')).toBe('ascending');
});
```

## F04.2 — Mobile record-list presentation

Do not use `64rem` + horizontal scrolling as the only responsive strategy.

Pseudo-code:

```html
<div class="table-desktop">
  <table>...</table>
</div>

<div class="table-mobile">
  @for (row of rows; track rowKey(row)) {
    <app-table-record [row]="row" [columns]="columns" />
  }
</div>
```

Add Storybook/mobile interaction coverage at 390px.

---

# F05 — Tree and complex-field decomposition

Target structure:

```text
tree/
  tree-view/
  tree-editor/
  tree-node/
  tree-toolbar/
  tree-picker/
  tree-selected-panel/

tree-logic/
  tree-filter.ts
  tree-selection.ts
  tree-mutation.ts
  tree-search.ts
  tree-model.ts

form-input/component/field-tree-renderer/
  thin adapter only
```

Pure logic example:

```ts
export function removeTreeNode(
  nodes: readonly TreeNode[],
  id: string
): TreeNode[] {
  return nodes
    .filter(node => node.id !== id)
    .map(node => ({
      ...node,
      children: removeTreeNode(node.children ?? [], id)
    }));
}
```

Pure test:

```ts
it('removes a nested node immutably', () => {
  const result = removeTreeNode(tree, 'child-2');
  expect(findNode(result, 'child-2')).toBeUndefined();
  expect(result).not.toBe(tree);
});
```

### Complex-field target

Split reusable editors/views:

```text
KeyValueEditor / KeyValueList
JsonEditor / JsonViewer
CodeEditor
SecretMetadataEditor
CredentialEditor (feature/domain when business-specific)
TreeEditor / TreeView
```

Generic FormConfig must not own OAuth-specific business schema.

---

# F06 — Overlay/layout cleanup

## F06.1 — Drawer via Angular CDK

Target:

```ts
const overlayRef = this.overlay.create({
  hasBackdrop: true,
  scrollStrategy: this.overlay.scrollStrategies.block(),
  positionStrategy: this.overlay.position().global().right('0').top('0')
});

overlayRef.attach(new TemplatePortal(template, viewContainerRef));
```

Focus:

```html
<div cdkTrapFocus [cdkTrapFocusAutoCapture]="true">
  ...
</div>
```

Checklist:

- [ ] Delete `AfterViewChecked` portal handling.
- [ ] Delete manual `document.body.appendChild`.
- [ ] Delete manual body overflow management.
- [ ] Delete manual Tab focus trap.
- [ ] Delete focusable `querySelectorAll` logic.
- [ ] Use CDK block scroll strategy.
- [ ] Use CDK focus trap.
- [ ] Test Escape, backdrop close and focus restore.

## F06.2 — Content state separate from layout

PageShell/SectionPanel should not own loading/error/empty/retry state orchestration.

Target:

```html
<app-content-state [state]="state" (retry)="retry.emit()">
  <ng-content />
</app-content-state>
```

---

# F07 — Public API, Storybook, test isolation and CI

## F07.1 — Public API cleanup

Do not publicly export internal implementation pieces such as:

```text
FieldRenderer
FieldArrayRenderer
FieldGroupRenderer
FieldRecordRenderer
FieldTreeRenderer
FieldSecretMetadataRenderer
TableCell
TableFilter
```

Checklist:

- [ ] Remove `LEGACY_PRIMITIVE_COMPONENTS` grouping.
- [ ] Keep internal renderer declarations internal.
- [ ] Search feature code for internal renderer imports; expected zero.
- [ ] Public SharedModule/API exposes only supported primitives/patterns/layout/overlay/feedback/data-display components.

## F07.2 — Storybook

Replace forced-light behavior with toolbar-controlled theme.

Pseudo-code:

```ts
export const globalTypes = {
  theme: {
    toolbar: {
      items: ['light', 'dark']
    }
  }
};
```

Required viewports:

```text
1440
1024
768
390
```

Required stories:

```text
Form edit / readonly / invalid / mobile
Table desktop / mobile / sort / selection / empty
Tree readonly / editor
Drawer
ActionToolbar
```

## F07.3 — Minimal test dependencies

Do not import the entire SharedModule when a focused component test can import/declaratively provide only its true dependencies.

## F07.4 — CI gates

Required workflow commands:

```bash
npm ci
npm run format:check
npm run lint
npm run tokens:build
npm run build
npm test -- --watch=false
npm run build-storybook
npm run test-storybook:ci
```

Vercel success is supplemental and does not replace these gates.

---

# F08 — Final audit

Run only after F01-F07 are complete.

Mandatory searches:

```bash
rg "DoCheck|ngDoCheck" src/app/shared/ui
rg "engineRevision|inputRevision|lastContextSignature" src/app/shared/ui
rg "PermissionService|permissionMode|permissionDeniedTooltip|permissions" src/app/shared/ui
rg "ConfirmDialogService|defaultDangerConfirm|actionSeverity" src/app/shared/ui/patterns/table
rg "Blob|localStorage" src/app/shared/ui/patterns/table
rg "document\.body|querySelectorAll" src/app/shared/ui/overlay
rg "LEGACY_|Legacy|V2|compatibilityMode|useNewUi" src/app/shared
```

Every remaining match must either be zero or reviewed and documented as non-violating.

---

# Final Definition of Done

Only report `MIGRATION_COMPLETE` when every item below is true:

- [ ] F01 real form-action projection tests pass.
- [ ] Readonly/detail renderer covers every supported field type.
- [ ] Readonly does not rely on disabled editor controls.
- [ ] Table action model has no permission/confirmation/severity compatibility contract.
- [ ] Real ESLint + Angular template lint runs and passes.
- [ ] BaseInput/BaseControl is low-level and presentation concerns are composed separately.
- [ ] FormInput contains no DoCheck/revision/stringify reactivity hacks.
- [ ] Form core public boundaries are typed.
- [ ] FormConfig is simplified and generic.
- [ ] Dirty/unsaved guard behavior is verified.
- [ ] PageShell is structural.
- [ ] Table is generic and presentation-only.
- [ ] Table accessibility tests pass.
- [ ] Table mobile record-list behavior exists and is tested.
- [ ] Tree component is decomposed and pure tree logic is unit tested without Angular.
- [ ] Complex fields are decomposed into reusable editors/views.
- [ ] Drawer uses Angular CDK overlay/focus/scroll primitives.
- [ ] Content state is separate from layout components.
- [ ] Shared public API does not expose internal renderers.
- [ ] Storybook supports light/dark and required viewports.
- [ ] Unit tests use minimal dependencies where practical.
- [ ] CI executes all mandatory gates.
- [ ] Final search audit passes.
- [ ] CLEAN-01 passes with no dead code, fake tests or compatibility leftovers.

## Required execution order

```text
F01
-> CLEAN-01 review
-> F02
-> CLEAN-01 review
-> F03
-> CLEAN-01 review
-> F04
-> CLEAN-01 review
-> F05
-> CLEAN-01 review
-> F06
-> CLEAN-01 review
-> F07
-> CLEAN-01 review
-> F08
-> MIGRATION_COMPLETE
```
