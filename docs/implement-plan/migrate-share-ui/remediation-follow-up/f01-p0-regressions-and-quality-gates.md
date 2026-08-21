# F01 — P0 Regressions and Real Quality Gates

## Goal

Fix current functional regressions first, then make formatting/linting capable of catching migration-quality problems automatically.

## Scope

Primary paths:

```text
src/app/shared/ui/patterns/form-input/
src/app/shared/ui/layout/action-toolbar/
src/app/shared/ui/patterns/table/
src/app/features/**/pages/*form*/
package.json
angular.json
eslint.config.* / .eslintrc.*
```

## 1. Fix readonly rendering regression

Current bad pattern:

```html
@if (readonlyMode) {
  <!-- empty -->
} @else {
  ...
}
```

This is forbidden.

Target behavior:

- readonly detail uses text/data-display components rather than disabled form controls;
- Tree readonly mode renders a readable tree/detail view;
- no field disappears only because mode is `view`;
- readonly data is keyboard/screen-reader readable and not presented as disabled input UI.

Suggested responsibility:

```text
FieldRenderer
  -> editable control adapter
  -> readonly value adapter using ValueDisplay/KeyValueList/JsonViewer/TreeView
```

Tests:

```text
text readonly renders value
number/date/boolean readonly renders semantic display
json readonly renders JsonViewer
record readonly renders key/value detail
tree readonly renders nodes
view mode contains no editable controls for those fields
```

## 2. Remove duplicate action bars

Define one clear ownership model.

Preferred target:

```text
FormInput owns form semantics/state
Feature page owns page actions
```

Therefore:

- remove built-in page-level Cancel/Save orchestration from FormInput, or expose a single action slot with no duplicate default;
- ensure projected submit buttons submit the same native `<form>` intentionally;
- if FormInput keeps a default action bar, feature consumers must not project a second one;
- add explicit cancel output only if FormInput truly owns cancel behavior.

Acceptance:

```text
Job Form renders exactly one Cancel
Job Form renders exactly one Save/Create action
Cancel navigates back
Save submits once
submitting state prevents duplicate submit
```

## 3. Fix permission decoupling correctly

Do not keep permission metadata in presentational shared contracts and replace evaluation with `true`.

ActionToolbar target:

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

Remove from shared toolbar model/component:

```text
permissions
permissionMode
permissionDeniedTooltip
PermissionService
business confirm config/default-danger-confirm policy
legacy severity/default/warning/danger mappings
severity()
```

Feature code resolves auth and confirmation before constructing actions or inside feature action handlers.

Table/TableCell target follows the same rule:

- no `permissions`, `permissionMode`, `permissionDeniedTooltip` in table presentation contracts;
- no `hasPermission()` helper in Table or TableCell;
- feature supplies only visible/enabled actions;
- destructive confirmation happens in feature/application action handler.

Search gate:

```bash
rg "PermissionService|permissions\?|permissionMode|permissionDeniedTooltip|hasPermission" src/app/shared/ui
```

Expected: zero for shared UI business permission behavior.

## 4. Remove placeholder decoupling logic

Forbidden examples:

```ts
private canRenderAction(): boolean { return true; }
return !action.permissions?.length;
return !permissions.length || true;
```

Delete the obsolete function/contract instead.

## 5. Make lint gate real

If using Angular ESLint:

- install compatible `eslint`, `typescript-eslint`, `@angular-eslint/*` packages;
- add an actual lint target or use ESLint directly;
- configure TS and Angular-template linting;
- add rules for unused vars/imports, explicit any in shared UI, equality, template a11y where supported.

Suggested scripts:

```json
{
  "lint": "eslint .",
  "lint:fix": "eslint . --fix",
  "format": "prettier --write .",
  "format:check": "prettier --check ."
}
```

Do not keep `ng lint` unless the workspace has a working lint builder target.

## Tests / gates

```bash
npm run format
npm run format:check
npm run lint
npm run build
npm test -- --watch=false
```

## Definition of Done

- readonly Tree/content regression fixed;
- exactly one action bar per form page;
- no permission service/permission metadata inside ActionToolbar/Table shared presentation contracts;
- no fake permission fallback methods;
- dead `severity()`/legacy mapper removed;
- lint command actually executes and passes;
- formatter fixes inconsistent indentation/newline noise;
- relevant unit/integration tests pass.
