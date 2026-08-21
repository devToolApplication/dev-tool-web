# R08 — Public API and Legacy/Duplicate Removal

## Objective

Shrink the shared UI public surface to deliberate reusable contracts. Internal renderers must not leak into feature code, and duplicate/legacy implementations must be removed rather than merely renamed.

## Scope

```text
src/app/shared/shared.module.ts
src/app/shared/ui/**/index.ts
src/app/shared/ui/patterns/index.ts
all public barrels
legacy/duplicate primitive directories
feature imports from shared internals
```

## 1. Define public vs internal API

Public examples:

```text
Primitives
  Button
  InputText/InputArea/InputNumber
  Select/SelectMulti/AutoComplete
  Checkbox/Radio/Toggle
  DatePicker
  Tooltip
  Breadcrumb/Tabs/Paginator

Patterns
  FormInput
  Table

Layout
  PageShell
  PageHeader
  Section
  Card
  ActionToolbar
  FilterPanel

Overlay
  Drawer
  Dialog
  ConfirmDialog

Feedback
  Alert
  EmptyState
  ErrorState
  LoadingSkeleton

Data display
  Badge
  ValueDisplay
  KeyValueList
  JsonViewer
  StatusList
```

Internal examples that should not be exported to feature consumers:

```text
FieldRenderer
FieldArrayRenderer
FieldGroupRenderer
FieldRecordRenderer
FieldTreeRenderer
TableCell
TableFilter internals
form rule/state helpers
specialized bridge adapters
```

## 2. Remove deleted form shell exports

After R03, these must not exist or be exported:

```text
SmartFormShell
FormStatusPanel
ReadonlyField
ReadonlySection
FormSectionCard legacy name
```

## 3. Reduce SharedModule

Current SharedModule acts as a dumping ground. Remove internal renderer declarations from exported arrays.

If components remain NgModule-based, internal declarations may stay declared where required but must not be public exports. Prefer gradual standalone conversion only where it simplifies dependency boundaries; do not turn this remediation into an unrelated framework migration.

## 4. Delete duplicate components

Review actual consumers and consolidate one responsibility per component.

Known candidates include:

```text
PrimeBadge vs Badge
PrimeTable vs Table
PrimeConfirmDialog vs ConfirmDialog
JsonPreview vs JsonViewer
Timeline wrapper vs shared Timeline
Message vs Alert
legacy Dialog/BasePopup overlaps
low-value SpeedDial/Split/TieredMenu/PanelMenu variants
```

For each duplicate:

```text
search consumers
choose canonical component
migrate consumers
migrate stories/tests
remove old export
remove old source directory
search old selector/type -> zero
```

Do not keep a wrapper whose only purpose is preserving the old selector.

## 5. Enforce feature import boundaries

Features should import public shared contracts, not nested internal implementation paths.

Avoid feature imports such as:

```ts
@shared/ui/patterns/form-input/component/field-renderer/...
@shared/ui/patterns/table/component/table/table-cell/...
```

Use public barrels for public types/components.

## 6. Architecture static checks

Add lightweight boundary tests/scripts if practical.

Examples:

```text
shared/ui must not import @core/auth
shared/ui/patterns/table must not import @core/http
features must not import form renderer internals
features must not import table cell/filter internals
```

These checks can be ESLint import restrictions or a small test/script.

## Tests

Run full build/tests after each removal group because public-export changes can break distant lazy feature modules.

```bash
npm run format:check
npm run lint
npm run build
npm test -- --watch=false
npm run build-storybook
```

## Search gates

Expected zero after respective removals:

```bash
rg "SmartFormShell|FormStatusPanel|ReadonlyField|ReadonlySection" src
rg "PrimeBadge|PrimeTable|PrimeConfirmDialog" src
```

For internal renderer imports:

```bash
rg "patterns/form-input/component|patterns/table/component/table/table-cell|patterns/table/component/table/table-filter" src/app/features
```

Expected zero.

## Definition of Done

- SharedModule/public barrels expose only deliberate public UI contracts.
- Form/Table internal renderers are not feature-facing APIs.
- Duplicate legacy components are migrated and physically deleted.
- No compatibility wrappers remain solely to preserve old selectors.
- Shared UI boundary checks prevent auth/HTTP/feature coupling from returning.
- Full build/unit/Storybook build pass after API cleanup.