# F01 — P0 Regressions and Real Quality Gates

## Goal

Close all functional P0 issues before any deeper cleanup. F01 is a hard gate for F02.

## Scope

```text
src/app/shared/ui/patterns/form-input/
src/app/shared/ui/layout/action-toolbar/
src/app/shared/ui/patterns/table/
src/app/features/**/pages/*form*/
package.json
angular.json
eslint.config.*
```

## F01.1 — Fix action projection contract

Current failure mode:

```html
<ng-content select="[form-actions], .form-actions, footer"></ng-content>
```

while feature consumers project a plain `<div>`.

### Target

Use one explicit contract only:

```html
<ng-content select="[form-actions]"></ng-content>
```

Every feature consumer must use:

```html
<app-form-input ...>
  <footer form-actions class="...">
    <app-button type="button" variant="secondary" label="cancel" />
    <app-button type="submit" variant="primary" label="save" />
  </footer>
</app-form-input>
```

### Required tasks

1. Search all `<app-form-input>` consumers.
2. Identify every projected action container.
3. Migrate each container to `[form-actions]`.
4. Ensure the projected submit control remains inside the native `<form>` after projection.
5. Remove default action rendering from FormInput.
6. Delete dead `@Input() showSubmit`.
7. Review and remove obsolete page-action properties from `FormActionConfig` if FormInput no longer owns them: `showCancel`, `showReset`, `submitLabel`, `cancelLabel`, `resetLabel`, page-level loading labels, etc.
8. Do not introduce a compatibility fallback selector.

### Tests

Create a host/integration test, not only a component-unit test.

Assert:

```text
exactly 1 Cancel control
exactly 1 Save/Create submit control
Cancel invokes feature handler
Save emits formSubmit exactly once
invalid form does not emit submit
submitting/loading prevents duplicate submit
projected action node is actually present in rendered DOM
```

Do not replace assertions with comments.

## F01.2 — Fix readonly/detail rendering

### Contract

Readonly/detail mode displays data, not disabled controls and never empty branches.

Recommended internal split:

```text
FieldRenderer
  -> FieldEditRenderer
  -> FieldReadonlyRenderer
```

Readonly map:

```text
text/string        -> ValueDisplay
number/currency    -> ValueDisplay with semantic formatting
date/datetime      -> ValueDisplay
boolean            -> semantic text/badge
select             -> resolved label display
array              -> read-only repeated values
record             -> KeyValueList
json               -> JsonViewer
code               -> read-only code block
secret/credential  -> masked detail display
tree               -> TreeView
```

### Required Tree fix

Delete empty pattern:

```html
@if (readonlyMode) {
} @else {
  ...
}
```

Tree readonly must show hierarchy and meaningful labels/badges without edit actions.

### Tests

Add readonly tests for at least:

```text
text
number/date/boolean
record
json
tree
secret/credential
```

Assert no editable control for readonly field types where detail renderer exists.

## F01.3 — Remove permission and confirmation policy from shared UI

### ActionToolbar target model

```ts
export interface ActionToolbarAction {
  id: string;
  label: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  visible?: boolean;
  disabled?: boolean;
  loading?: boolean;
  tooltip?: string;
  placement?: 'primary' | 'secondary' | 'more';
}
```

Delete from ActionToolbar:

```text
PermissionService
ConfirmDialogService
permissions
permissionMode
permissionDeniedTooltip
confirm
severity()
legacy variant names default/warning/danger
hasPermission()
permission-based canRenderAction()
default destructive confirmation policy
```

Feature/application code resolves permissions and performs confirmation before executing a business action.

### Table/TableCell

Delete the same permission metadata and placeholder helpers from table contracts:

```text
permissions
permissionMode
permissionDeniedTooltip
hasPermission
canRenderAction returning true
return !action.permissions?.length
```

Table emits presentation action events; feature handler owns confirmation and permissions.

### Search gate

```bash
rg "PermissionService|permissions\?|permissionMode|permissionDeniedTooltip|hasPermission" src/app/shared/ui
```

Expected: zero business-permission matches.

Also:

```bash
rg "ConfirmDialogService" src/app/shared/ui/layout/action-toolbar src/app/shared/ui/patterns/table
```

Expected zero.

## F01.4 — Make lint real

Install/configure a toolchain compatible with Angular 21:

```text
eslint
typescript-eslint
@angular-eslint/eslint-plugin
@angular-eslint/eslint-plugin-template
@angular-eslint/template-parser
```

Preferred scripts:

```json
{
  "lint": "eslint .",
  "lint:fix": "eslint . --fix",
  "format": "prettier --write .",
  "format:check": "prettier --check ."
}
```

Do not leave `ng lint` unless a working workspace lint target exists and is verified.

Minimum rules:

```text
unused imports/vars
prefer const
eqeqeq
no accidental explicit-any additions in shared/ui
Angular template accessibility checks
component/directive naming conventions
```

## F01 gate

```bash
npm run format
npm run format:check
npm run lint
npm run build
npm test -- --watch=false
npm run build-storybook
npm run test-storybook:ci
```

## Definition of Done

- every FormInput consumer uses the single `[form-actions]` contract;
- exactly one action bar per form page;
- tests prove submit/cancel/projection behavior;
- readonly Tree and supported detail fields render readable content;
- no permission service/metadata/placeholder permission logic remains in shared presentation contracts;
- ActionToolbar/Table do not own business confirmation policy;
- dead legacy severity mapper removed;
- lint actually executes and passes;
- format/build/unit/Storybook gates pass.

Only then mark `F01_COMPLETE`.
