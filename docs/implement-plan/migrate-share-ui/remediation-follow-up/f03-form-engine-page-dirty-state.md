# F03 — Form Engine, FormConfig, Page Composition and Dirty State

## Goal

Complete the FormInput/FormEngine rewrite instead of only deleting outer shell components.

## Scope

```text
src/app/shared/ui/patterns/form-input/
src/app/shared/ui/layout/page-shell/
src/app/features/**/pages/*form*/
src/app/shared/guards/ or unsaved-change guard location
```

## 1. Remove DoCheck and revision-signal hacks

Delete:

```text
implements DoCheck
ngDoCheck
engineRevision
inputRevision
trackConfigRevision
lastContextSignature
contextSignature
JSON.stringify context mutation tracking
```

Use immutable input semantics and normal `ngOnChanges`, or Angular signal inputs.

Target behavior:

```ts
ngOnChanges(changes: SimpleChanges): void {
  if (changes['config']) rebuildSchema();
  if (changes['context']) updateContext(this.context);
  if (changes['initialValue']) reset(this.initialValue);
  if (changes['apiFieldErrors']) applyApiFieldErrors();
}
```

## 2. Make FormInput generic

Target direction:

```ts
export class FormInput<TModel extends object> {
  @Input() config!: FormConfig<TModel>;
  @Input() initialValue!: TModel;

  @Output() formSubmit = new EventEmitter<TModel>();
  @Output() valueChange = new EventEmitter<TModel>();
  @Output() dirtyChange = new EventEmitter<boolean>();
}
```

Engine should have a typed contract instead of `engine: any`.

## 3. Simplify FormConfig

Remove obsolete layout/schema concerns after migrating consumers:

```text
mode: smart/wizard
labelPlacement
tabs/dropdown navigation
showStatusPanel
stickyFooter
readonlyMode disabled-controls
fractional GridWidth as general default
secret/OAuth domain fields from generic schema
large Tree UI domain schema from generic core
```

Use field widths by intent:

```text
short
medium
full
```

Default form layout is one column. Two columns only for strongly related pairs.

## 4. Single field dispatch owner

FormInput should render sections and delegate every field to one internal FieldRenderer.

Target:

```html
@for (section of visibleSections(); track section.id) {
  <app-form-section ...>
    @for (field of section.fields; track field.path) {
      <app-field-renderer
        [field]="field"
        [submitted]="submitted()"
      />
    }
  </app-form-section>
}
```

FormInput must not directly switch between Array/Group/Tree renderers.

FieldRenderer is internal and may delegate to internal specialized adapters.

## 5. Dirty-state contract

Expose clean form-level state:

```ts
@Output() dirtyChange = new EventEmitter<boolean>();
isDirty(): boolean;
markSaved(): void;
reset(value?: TModel): void;
```

Feature page owns unsaved-change routing guard.

Job Form acceptance:

```text
editing marks dirty
successful save clears dirty
cancel/back with dirty invokes unsaved-change policy
cancel/back when clean navigates directly
reset restores initial model and clears dirty
```

## 6. PageShell becomes structural

Remove PageShell ownership of:

```text
loading
error
empty
retry
page-state orchestration
```

PageHeader owns title/breadcrumb/status. Feature page composes Loading/Error/Empty/Form states explicitly.

## 7. Readonly details

Readonly/view screens use data-display components, not disabled edit controls.

## Tests

```text
initial model
valueChange typed value
dirtyChange
markSaved/reset
submit valid
submit invalid
external API field errors
cross-field validation
visible/disabled/required rules
focus first invalid
validation summary click focuses field
view mode readonly output
unsaved navigation integration
```

## Search gates

```bash
rg "DoCheck|engineRevision|inputRevision|contextSignature|trackConfigRevision" src/app/shared/ui/patterns/form-input
rg "\bany\b" src/app/shared/ui/patterns/form-input
rg "showStatusPanel|stickyFooter|labelPlacement|disabled-controls|sectionNavigation: 'tabs'" src
```

Expected: obsolete engine/layout contract removed or every remaining occurrence justified by an intentionally retained feature.

## Definition of Done

- no DoCheck/JSON-signature/fake revision tracking;
- FormInput/FormEngine typed;
- FormConfig materially simplified;
- FormInput delegates all fields through one renderer boundary;
- dirty state integrated with real page navigation behavior;
- PageShell is structural;
- view mode uses readonly data-display presentation;
- tests and search gates pass.
