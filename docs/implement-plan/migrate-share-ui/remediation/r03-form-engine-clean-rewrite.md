# R03 — Clean Rewrite of FormInput and Form Engine

## Objective

Finish the Form rewrite that the first migration pass left incomplete. `FormInput` must become a typed form renderer/engine, not a page shell, smart workspace, status dashboard or dispatcher for every specialized renderer.

This phase is the highest priority remediation phase.

## Scope

```text
src/app/shared/ui/patterns/form-input/form-input.ts
src/app/shared/ui/patterns/form-input/form-input.html
src/app/shared/ui/patterns/form-input/form-input.css
src/app/shared/ui/patterns/form-input/models/**
src/app/shared/ui/patterns/form-input/utils/**
src/app/shared/ui/patterns/form-input/component/**
```

## Components to delete in this phase

After consumers are migrated, delete:

```text
smart-form-shell/
form-status-panel/
readonly-field/
readonly-section/
```

Rewrite/rename `form-section-card` directly to a lightweight `form-section`; do not keep both implementations.

## 1. Remove FormInput shell responsibilities

`FormInput` may own:

```text
schema/config
resolved field state
conditional rules
validation
touched/dirty state
external field errors
submit validation
section/field rendering
```

It must not own:

```text
page title
breadcrumb
page loading state
CRUD orchestration
permanent status sidebar
smart/wizard workspace mode
business API calls
feature routing
```

## 2. Remove DoCheck/context-signature hack

Delete patterns like:

```text
implements DoCheck
JSON.stringify(context) every check
engineRevision
inputRevision
computed reading fake revision signals
```

Require immutable input updates and handle them explicitly.

Pseudocode:

```ts
ngOnChanges(changes: SimpleChanges): void {
  if (changes['config']) {
    rebuildSchema();
  }

  if (changes['context']) {
    engine.updateContext(context);
  }

  if (changes['initialValue']) {
    engine.reset(initialValue);
  }

  if (changes['externalErrors']) {
    engine.setExternalErrors(externalErrors);
  }
}
```

Angular signal inputs may be used if they make dependencies simpler, but do not create revision signals whose only purpose is forcing recomputation.

## 3. Type the engine

Remove broad `any` contracts.

Target direction:

```ts
export interface FormEngine<TModel extends object> {
  readonly model: Signal<TModel>;
  readonly fields: readonly FieldState[];
  readonly valid: Signal<boolean>;

  reset(value: TModel): void;
  markAllTouched(): void;
  markSaved(): void;
  updateContext(context: FormContext): void;
  setExternalErrors(errors: Record<string, string | string[]>): void;
}

export class FormInput<TModel extends object> {
  @Input({ required: true }) config!: FormConfig<TModel>;
  @Input({ required: true }) initialValue!: TModel;

  @Output() formSubmit = new EventEmitter<TModel>();
  @Output() valueChange = new EventEmitter<TModel>();
  @Output() dirtyChange = new EventEmitter<boolean>();
  @Output() validChange = new EventEmitter<boolean>();
}
```

If Angular template generics require a pragmatic boundary, isolate the unsafe conversion inside one internal adapter rather than spreading `any` through public APIs.

## 4. Simplify FormConfig

Remove shell/layout flags from schema:

```text
smart/wizard mode
labelPlacement
showStatusPanel
stickyFooter
readonlyMode=disabled-controls
tabs section navigation
fraction widths 1/2, 1/3, 1/4, 1/6
nested density/visual variants
```

Target:

```ts
export interface FormConfig<TModel extends object> {
  fields: FieldConfig<TModel>[];
  sections?: FormSectionConfig[];
  validators?: FormValidator<TModel>[];
}

export interface FormSectionConfig {
  id: string;
  title: string;
  description?: string;
  optional?: boolean;
  hiddenWhen?: Rule;
  collapsible?: boolean; // advanced sections only
}

export interface BaseFieldConfig<TModel> {
  name: keyof TModel | string;
  label: string;
  description?: string;
  helpText?: string;
  required?: boolean;
  visibleWhen?: Rule;
  disabledWhen?: Rule;
  requiredWhen?: Rule;
  width?: 'short' | 'medium' | 'full';
}
```

Wizard remains a separate workflow pattern, not a FormInput layout mode.

## 5. Make FieldRenderer the only field dispatch point

Current FormInput template duplicates explicit array/group/tree/default dispatch for the first section and remaining sections. Remove this duplication.

Target FormInput template:

```html
<form (ngSubmit)="submit()" novalidate>
  @if (formError()) {
    <app-alert variant="danger" [message]="formError()" />
  }

  @if (showValidationSummary()) {
    <app-validation-summary
      [items]="validationItems()"
      (itemClick)="focusField($event.fieldPath)"
    />
  }

  <div class="form-workspace" [class.form-workspace--with-nav]="showSectionNav()">
    @if (showSectionNav()) {
      <app-form-section-nav
        [sections]="visibleSections()"
        (sectionSelect)="scrollToSection($event)"
      />
    }

    <main>
      @for (section of visibleSections(); track section.id) {
        <app-form-section [section]="section">
          @for (field of section.fields; track field.path) {
            <app-field-renderer
              [field]="field"
              [submitted]="submitted()"
            />
          }
        </app-form-section>
      }
    </main>
  </div>

  <ng-content select="[form-actions]" />
</form>
```

`FieldRenderer` dispatches `text`, `number`, `select`, `group`, `array`, `tree`, custom fields internally. It is not public API.

## 6. Extract rule evaluation

Create one rule engine responsible for visibility/disabled/required evaluation.

```ts
interface FormRuleEngine<TModel> {
  visible(field: FieldConfig<TModel>, model: TModel, context: FormContext): boolean;
  disabled(field: FieldConfig<TModel>, model: TModel, context: FormContext): boolean;
  required(field: FieldConfig<TModel>, model: TModel, context: FormContext): boolean;
}
```

Renderers consume resolved state; they do not parse expressions themselves.

## 7. Dirty state contract

Expose clean state transitions:

```text
initial load -> dirty=false
user changes field -> dirty=true
successful save -> markSaved -> dirty=false
reset -> original value + dirty=false
```

`dirtyChange` must be emitted so feature pages do not inspect child field internals.

## 8. Validation/focus behavior

Submit flow:

```text
submit
 -> mark visible relevant fields touched
 -> validate
 -> invalid: render summary + focus first invalid native control
 -> valid: emit typed model
```

Do not focus a wrapper with `tabindex=-1` if the actual interactive input can be focused.

External API field errors must preserve model values and render through the same FormField error presentation.

## Tests

### Engine

```text
initial model
value update
dirty transition
markSaved
reset
visibleWhen
disabledWhen
requiredWhen
hidden-field validation policy
cross-field validation
nested field paths
external errors
```

### FormInput DOM

```text
one semantic form
persistent accessible labels
invalid submit does not emit
valid submit emits typed model
validation summary appears after failed submit
summary item focuses actual field control
API error preserves input
short form does not show section nav by default
long form shows responsive section nav
```

### Search gates

Expected zero:

```bash
rg "SmartFormShell|app-smart-form-shell" src
rg "FormStatusPanel|app-form-status-panel" src
rg "ReadonlyField|ReadonlySection" src/app/shared/ui/patterns/form-input
rg "implements .*DoCheck|engineRevision|inputRevision" src/app/shared/ui/patterns/form-input
```

Review `rg "\bany\b" src/app/shared/ui/patterns/form-input` and eliminate public/core occurrences.

## Definition of Done

- SmartFormShell, FormStatusPanel and generic readonly renderers are deleted.
- FormInput no longer renders title/page/status shell UI.
- FormInput template has a single section loop and one FieldRenderer dispatch point.
- DoCheck/JSON-context-signature/fake-revision approach is removed.
- Public FormInput/FormEngine contracts are typed.
- FormConfig contains schema/form behavior, not page/workspace chrome.
- Dirty state is public and testable.
- Validation summary focuses real invalid controls.
- Build/unit/Storybook/a11y gates pass.