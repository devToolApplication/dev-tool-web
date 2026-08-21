# R04 — Page Composition and Dirty-State Completion

## Objective

Finish the `BaseCrudPage` removal properly. The abstraction has already been removed, but PageShell still owns application state and some feature pages lost reliable unsaved-change behavior.

## Scope

```text
src/app/shared/ui/layout/page-shell/**
src/app/shared/ui/layout/page-header/**
src/app/shared/ui/patterns/form-input/component/sticky-form-actions/**
src/app/shared/ui/patterns/form-input/unsaved-changes.guard.ts
feature create/edit pages using FormInput
especially service-management Job Form / resource forms
```

## 1. Make PageShell a dumb layout

Remove inputs/outputs such as:

```text
loading
error
empty
emptyTitle
emptyDescription
retry
page/business state branching
```

Target API:

```ts
export type PageWidth = 'form' | 'content' | 'data' | 'full';

export class PageShellComponent {
  @Input() width: PageWidth = 'content';
}
```

Target composition:

```html
<app-page-shell width="form">
  <app-page-header
    page-header
    title="Edit job"
    subtitle="Edit scheduled job configuration."
  />

  @if (loading()) {
    <app-loading-skeleton type="form" />
  } @else if (loadError()) {
    <app-error-state
      [message]="loadError()"
      (retry)="reload()"
    />
  } @else {
    <app-form-input
      [config]="formConfig"
      [initialValue]="model()"
      [externalErrors]="fieldErrors()"
      (dirtyChange)="dirty.set($event)"
      (formSubmit)="save($event)"
    >
      <app-sticky-form-actions
        form-actions
        [dirty]="dirty()"
        [submitting]="saving()"
        submitLabel="Save changes"
        (cancel)="cancel()"
      />
    </app-form-input>
  }
</app-page-shell>
```

PageHeader is the single page-title source.

## 2. Restore unsaved-change behavior

Feature pages own dirty state:

```ts
readonly dirty = signal(false);

hasUnsavedChanges(): boolean {
  return this.dirty();
}

async save(value: JobFormModel): Promise<void> {
  this.saving.set(true);
  try {
    await this.jobService.update(value);
    this.dirty.set(false);
  } finally {
    this.saving.set(false);
  }
}
```

Prefer FormInput's `dirtyChange` and `markSaved` semantics over `ViewChild` calls to internal fields.

The generic guard may remain if it only depends on a minimal interface:

```ts
export interface UnsavedChangesAware {
  hasUnsavedChanges(): boolean;
  confirmDiscardChanges?(): boolean | Promise<boolean>;
}
```

## 3. Clean form actions

Use one action-bar implementation rather than per-feature raw button wrappers.

Expected behavior:

```text
Unsaved changes                         Cancel   Save changes
Saving…                                          [spinner]
```

Rules:

- Primary submit is `type="submit"`.
- Prevent duplicate submit while saving.
- Cancel is secondary.
- Destructive actions are not used as normal Save actions.
- Mobile action layout remains usable without horizontal overflow.

## 4. Feature orchestration stays in features

Features own:

```text
load/save API calls
route navigation
toasts
API error mapping
permission decisions
successful-save state reset
```

Do not introduce a generic `CrudEditorService` during cleanup unless multiple migrated pages prove identical non-UI behavior.

## Tests

### PageShell

```text
width class
content projection
no loading/error/empty rendering logic
no application-service dependency
```

### Feature create/edit

```text
load success
load error + retry
valid save
invalid form does not call service
API form error
API field errors
saving prevents duplicate submit
dirty true after edit
successful save resets dirty
navigation guard prompts when dirty
navigation allowed when clean
cancel behavior
```

### Accessibility

```text
single page h1
form sections h2/h3 hierarchy
error state has appropriate announcement
keyboard order is header -> form -> actions
```

## Search gates

```bash
rg "BaseCrudPage|app-base-crud-page|base-crud-page" src
```

Expected zero.

Review PageShell for state properties:

```bash
rg "loading|error|empty|retry" src/app/shared/ui/layout/page-shell
```

Expected zero except comments/tests intentionally asserting absence.

## Definition of Done

- PageShell is structural only.
- PageHeader is the single page-title owner.
- Job Create/Edit or equivalent reference forms use direct page composition.
- Unsaved-change guard works with FormInput's clean dirty-state contract.
- Successful saves reset dirty state.
- No BaseCrudPage compatibility remains.
- Feature API/routing/toast orchestration stays outside shared UI.