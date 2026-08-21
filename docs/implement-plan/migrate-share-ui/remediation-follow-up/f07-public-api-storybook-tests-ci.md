# F07 — Public API, Storybook, Tests and CI Hardening

## Goal

Make the cleaned architecture enforceable through public boundaries and automated gates.

## Scope

```text
src/app/shared/shared.module.ts
src/app/shared/ui/**/index.ts
.storybook/
src/app/shared/**/*.stories.ts
src/app/shared/**/*.spec.ts
package.json
CI workflow/Jenkins files used by this repo
```

## 1. Hide internal renderers

Do not export from SharedModule/public barrels:

```text
FieldRenderer
FieldArrayRenderer
FieldGroupRenderer
FieldRecordRenderer
FieldTreeRenderer
FieldSecretMetadataRenderer
JsonFieldBlock internal adapter
TableCell
TableFilter internal implementation
```

They may remain declarations/imports required internally by NgModule architecture, but must not be part of public feature API.

Public features should consume patterns like:

```text
FormInput
Table
Button/controls
PageShell/PageHeader
Section
Drawer/Dialog/Confirm
Alert/Empty/Error/Loading
ValueDisplay/KeyValueList/JsonViewer
```

## 2. Reduce SharedModule dumping-ground behavior

Separate internal declarations from exported public components. Gradually prefer standalone components when practical, but do not block the remediation on a full standalone migration.

Remove misleading names such as `LEGACY_PRIMITIVE_COMPONENTS` once legacy/compatibility status is gone.

## 3. Test isolation

Do not import entire `SharedModule` in every primitive test.

Prefer minimal test imports/providers for the component under test.

Add architecture tests where useful:

```text
shared/ui must not import @core/auth
shared/ui patterns must not import HTTP response models
feature code must not import internal form/table renderers
```

## 4. Storybook themes

Remove forced light-only initialization.

Add toolbar/global decorator for:

```text
light
dark
```

Both themes must be exercised for core stories.

## 5. Viewport matrix

Use at least:

```text
1440
1024
768
390
```

Critical Form/Table/Drawer stories must include narrow/mobile behavior.

## 6. Story coverage

Core states:

Form:

```text
short
long sections
validation
API error
conditional fields
submitting
readonly
mobile
dark
```

Table:

```text
basic
sort
selection
actions
no data
no results
error
loading
mobile
dark
```

Overlay:

```text
drawer
long drawer
drawer form
confirm
destructive confirm
mobile
```

## 7. A11y interaction tests

Keep Storybook a11y test mode at error and add interaction tests for keyboard/focus behavior.

## 8. CI hard gate

CI should run:

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

Do not use `|| true`, `continue-on-error` or equivalent for these quality gates unless explicitly documented as non-blocking for a temporary migration—which is not acceptable for final completion.

## Search gates

```bash
rg "FieldRenderer|FieldArrayRenderer|FieldGroupRenderer|FieldTreeRenderer|TableCellComponent|TableFilterComponent" src/app/features
rg "data-theme.*light|classList.add\('light'\)" .storybook
rg "imports: \[SharedModule\]" src/app/shared/ui/primitives src/app/shared/ui/patterns
```

## Definition of Done

- internal renderers no longer public to features;
- SharedModule public surface materially smaller;
- primitive/pattern tests use appropriate isolation;
- Storybook supports light/dark + required viewports;
- critical interaction/a11y stories exist;
- CI executes all hard gates;
- architecture tests prevent auth/HTTP/internal-renderer coupling from returning.
