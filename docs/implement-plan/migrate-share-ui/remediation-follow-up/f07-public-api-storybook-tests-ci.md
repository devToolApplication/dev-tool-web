# F07 — Public API, Storybook, Tests and CI

## Goal

Make the shared UI boundary intentional and enforce it with isolated tests, visual/a11y stories and CI gates.

## F07.1 — Reduce SharedModule public API

Internal components must not be exported to feature code.

Remove from public exports:

```text
FieldRenderer
FieldArrayRenderer
FieldGroupRenderer
FieldRecordRenderer
FieldSecretMetadataRenderer
FieldTreeRenderer
TableCellComponent
TableFilterComponent
other implementation-only form/table helpers
```

They may remain declared/imported internally while the project is NgModule-based.

Delete naming/grouping such as:

```text
LEGACY_PRIMITIVE_COMPONENTS
```

once migration is complete.

## F07.2 — Target public categories

Public primitives:

```text
Button
InputText/InputArea/InputNumber/etc. as genuinely reusable controls
Select/Checkbox/Radio/Toggle/DatePicker
Breadcrumb/Tabs/Paginator
Tooltip where public
```

Public patterns:

```text
FormInput
Table
ContentState
```

Public layout:

```text
PageShell
PageHeader
Section
Card
ActionToolbar
FilterBar/FilterPanel if retained as reusable pattern
```

Public overlay:

```text
Drawer
Dialog
ConfirmDialog
```

Public feedback/data display:

```text
Alert
LoadingSkeleton
EmptyState
ErrorState
Badge
ValueDisplay
KeyValueList
JsonViewer
```

Review duplicate/overlapping primitives and delete obsolete variants instead of exporting both.

## F07.3 — Storybook theme and viewport matrix

Remove hardcoded light initialization.

Add global toolbar/theme handling:

```text
Light
Dark
```

Required viewports:

```text
1440 desktop
1024 compact desktop/tablet landscape
768 tablet
390 mobile
```

Critical stories:

```text
Button/controls states
Form basic
Form long sections
Form errors/validation summary
Form readonly/detail
Form mobile
Table basic
Table sort/select/actions
Table empty/error/loading
Table mobile record list
Tree readonly/editor
Drawer/Dialog/Confirm
ActionToolbar
ContentState
```

States per relevant component:

```text
default
disabled
readonly
loading
error
focus/keyboard
```

## F07.4 — Test isolation

Primitive/pattern tests should import the smallest dependencies possible.

Avoid:

```ts
imports: [SharedModule]
```

unless testing SharedModule integration itself.

Use small host components for projection/CVA/accessibility contracts.

## F07.5 — CI workflow

Required commands:

```bash
npm run format:check
npm run lint
npm run tokens:build
npm run build
npm test -- --watch=false
npm run build-storybook
npm run test-storybook:ci
```

Chromatic may be additional visual regression coverage; it does not replace unit/a11y gates.

Vercel deployment is not a code-quality gate.

Configure branch protection/required checks if repository policy permits:

```text
format/lint
build
unit tests
storybook build + interaction/a11y
```

## F07.6 — Architecture/static checks

Add lightweight scripts or ESLint boundaries for rules such as:

```text
shared/ui cannot import core/auth PermissionService
shared/ui cannot import HTTP response models
feature cannot import internal form renderer path
feature cannot import TableCell/TableFilter internals
```

A small Node script/ESLint import restriction is acceptable if it reliably fails CI.

## Search gates

```bash
rg "FieldRenderer|FieldTreeRenderer|TableCellComponent|TableFilterComponent" src/app/shared/shared.module.ts
rg "LEGACY_PRIMITIVE_COMPONENTS|Legacy|V2|compatibilityMode" src/app/shared
rg "data-theme.*light|classList\.add\('light'\)" .storybook
```

Internal public-export/legacy/forced-theme target matches: zero.

## Definition of Done

- SharedModule exports only real public API;
- internal renderers hidden;
- Storybook light/dark + 1440/1024/768/390 works;
- critical Form/Table/Tree/Overlay stories exist;
- primitive tests are isolated;
- format/lint/build/unit/Storybook/a11y run in CI;
- architecture import rules prevent regressions.
