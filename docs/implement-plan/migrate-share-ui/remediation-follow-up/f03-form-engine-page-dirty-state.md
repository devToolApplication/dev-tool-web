# F03 — Form Engine, Page Composition and Dirty State

## Goal

Finish the actual FormInput/FormEngine rewrite: typed boundaries, deterministic reactivity, minimal configuration, dumb page shell and verified unsaved-change behavior.

## F03.1 — Remove fake reactivity

Delete from `FormInput`:

```text
implements DoCheck
ngDoCheck
engineRevision
inputRevision
lastContextSignature
JSON.stringify context signature
trackConfigRevision
manual revision increments used only to force computed recalculation
```

Use explicit input changes / immutable context updates. Preferred direction:

```ts
ngOnChanges(changes: SimpleChanges): void {
  if (changes['config']) rebuildEngine();
  if (changes['context']) engine.updateContext(context);
  if (changes['initialValue']) engine.reset(initialValue);
  if (changes['apiFieldErrors']) engine.setExternalErrors(...);
}
```

Signal inputs are acceptable if they simplify this further.

## F03.2 — Type the core

Target:

```ts
export class FormInput<TModel extends object> { ... }
export interface FormConfig<TModel extends object> { ... }
export interface FormEngine<TModel extends object> { ... }
export interface FieldState<TValue = unknown> { ... }
```

Remove public/core examples such as:

```text
initialValue: any
engine: any
EventEmitter<any>
Signal<any>
setValue(any)
getModel<T = any>()
FormContext.user: any
FormContext.extra: any
```

Use `unknown` where the value is intentionally dynamic and narrow before use.

## F03.3 — Simplify FormConfig

Delete legacy layout configuration that survives from the old design:

```text
GridWidth 1/2, 1/3, 1/4, 1/6
layout mode smart/wizard
labelPlacement
showStatusPanel
stickyFooter
readonlyMode disabled-controls
tabs/dropdown section navigation if not required by actual product usage
group density/variant explosion when only styling residue
```

Target semantic width:

```ts
type FieldWidth = 'short' | 'medium' | 'full';
```

Form layout defaults to one-column readability; special responsive arrangements must be intentional.

## F03.4 — Centralize field dispatch

FormInput template should be structurally simple:

```html
<form ...>
  <app-validation-summary ... />

  <div class="form-workspace">
    <app-form-section-nav ... />

    @for (section of sections(); track section.id) {
      <app-form-section ...>
        @for (field of section.fields; track field.path) {
          <app-field-renderer ... />
        }
      </app-form-section>
    }
  </div>

  <ng-content select="[form-actions]"></ng-content>
</form>
```

FormInput itself must not branch over Array/Group/Tree renderers. Internal `FieldRenderer` dispatches all supported types.

Rename/remove `FormSectionCard` if it is structurally a form section rather than an independent card.

## F03.5 — Isolate focus/navigation DOM behavior

Move `document.querySelector`, `getElementById`, `scrollIntoView` behavior behind an internal focus/navigation helper/directive/service so FormInput core is testable without scattered DOM calls.

The helper must support:

```text
focus first invalid field
focus validation summary target
scroll to section
```

## F03.6 — PageShell becomes structural

Remove from PageShell:

```text
loading
error
empty
retry
page-state orchestration
```

Prefer PageHeader as the owner of title/subtitle/status/breadcrumb.

Target composition:

```html
<app-page-shell width="form">
  <app-page-header ... />

  @if (loading()) {
    <app-loading-skeleton />
  } @else if (error()) {
    <app-error-state />
  } @else {
    <app-form-input ... />
  }
</app-page-shell>
```

PageShell width contract:

```text
form
content
data
full
```

## F03.7 — Restore dirty/unsaved contract

FormInput should expose state explicitly:

```ts
@Output() dirtyChange = new EventEmitter<boolean>();

isDirty(): boolean;
markSaved(): void;
reset(): void;
```

Feature page owns navigation behavior:

```ts
readonly dirty = signal(false);

hasUnsavedChanges(): boolean {
  return this.dirty();
}
```

Successful save must clear dirty state before navigation.

Do not rely on a guard calling a method that feature pages no longer implement.

## Tests

Required Form tests:

```text
initial model
value changes
valid/invalid submit
external field errors
cross-field/custom validation
visible/disabled/required rules
hidden-field validation behavior
dirty true after edit
reset -> dirty false
markSaved -> dirty false
first invalid focus
validation summary navigation
readonly contract from F01 remains working
```

Required page/guard tests:

```text
clean page allows navigation
edited page invokes unsaved guard
successful save clears dirty
cancel/reset behavior is intentional
```

## Search gates

```bash
rg "DoCheck|engineRevision|inputRevision|contextSignature|trackConfigRevision" src/app/shared/ui/patterns/form-input
rg "showStatusPanel|stickyFooter|readonlyMode.*disabled-controls|mode.*wizard|mode.*smart" src/app/shared/ui/patterns/form-input
rg "'1/2'|'1/3'|'1/4'|'1/6'" src/app/shared/ui/patterns/form-input
```

Expected legacy core matches: zero.

## Definition of Done

- no DoCheck/revision/stringify hacks;
- typed FormInput/FormEngine public boundaries;
- minimal FormConfig and semantic widths;
- FormInput template has one internal renderer dispatch path;
- PageShell is structural;
- dirty/unsaved guard integration works and is tested;
- format/lint/build/unit/Storybook gates pass.
