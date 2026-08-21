# R10 — Final Shared UI Audit

## Objective

Prove the remediation is complete with repository-wide searches, architecture checks, reference scenarios and full quality gates. This phase should primarily remove leftovers and verify boundaries, not introduce another redesign.

## 1. Compatibility audit

Review Button migration:

```bash
rg "severity=|\[severity\]|\[text\]|size=\"small\"|size=\"large\"" src
```

Any result must be inspected. Shared Button compatibility results should be zero.

Search prohibited parallel-version naming:

```bash
rg "ButtonV2|FormInputV2|TableV2|LegacyForm|LegacyTable|useNewUi|compatibilityMode|legacyMode" src
```

Expected zero unless the string belongs to unrelated domain data and is explicitly justified.

## 2. Form legacy audit

```bash
rg "BaseCrudPage|app-base-crud-page" src
rg "SmartFormShell|app-smart-form-shell" src
rg "FormStatusPanel|app-form-status-panel" src
rg "ReadonlyField|ReadonlySection" src/app/shared/ui/patterns/form-input
rg "engineRevision|inputRevision|implements .*DoCheck" src/app/shared/ui/patterns/form-input
```

Expected zero.

Review `FormConfig` for removed shell flags:

```bash
rg "showStatusPanel|stickyFooter|labelPlacement|readonlyMode|sectionNavigation.*tabs|mode.*wizard" src/app/shared/ui/patterns/form-input
```

Expected zero or only deliberate docs/tests proving absence.

## 3. Shared-layer dependency audit

Expected zero:

```bash
rg "PermissionService" src/app/shared/ui
rg "BasePageResponse" src/app/shared/ui
rg "@features/" src/app/shared/ui
```

Inspect other `@core/` imports individually. Shared infrastructure such as a neutral i18n primitive may be acceptable if architecture explicitly allows it; auth/business/HTTP model coupling is not.

## 4. Type-safety audit

```bash
rg "\bany\b" src/app/shared/ui
```

Do not claim this must be literally zero without inspection, but every result must be classified:

```text
remove
replace with unknown
generic type
narrowed adapter boundary
third-party unavoidable type with documented reason
```

Core public APIs for Button/FormInput/Table/controls must not expose broad `any`.

## 5. Public API audit

Feature code must not import internal renderer paths:

```bash
rg "patterns/form-input/component" src/app/features
rg "patterns/table/component/table/table-cell" src/app/features
rg "patterns/table/component/table/table-filter" src/app/features
```

Expected zero.

Review `SharedModule` and barrels manually. Internal renderer/helper exports should be absent.

## 6. Duplicate audit

Search old duplicate names selected in R08, for example:

```bash
rg "PrimeBadge|PrimeTable|PrimeConfirmDialog|JsonPreview" src
```

Expected zero after canonical replacement, unless a specific component was intentionally retained and documented.

## 7. Overlay audit

```bash
rg "document\.body\.appendChild|document\.body\.style\.overflow|document:keydown\.tab" src/app/shared/ui/overlay
```

Expected zero for the CDK-migrated overlay stack.

Confirm focus tests cover:

```text
open
trap
Escape
close
restore
```

## 8. Table audit

Expected zero:

```bash
rg "PermissionService|BasePageResponse|createElement\('a'\)|Blob\(" src/app/shared/ui/patterns/table
```

Inspect DOM/stories for:

```text
sort button + aria-sort
no fake interactive tr
accessible selection labels
mobile record list at 390px
```

## 9. Reference acceptance scenarios

### Create/Edit form

Validate:

```text
load
edit fields
conditional fields
client validation
API field error
retry save
saving state
dirty navigation guard
successful save clears dirty
mobile section navigation
```

### Job/Data management table

Validate:

```text
filter
clear filters
sort
paginate
selection
actions
destructive confirmation
loading refresh
no results
error
mobile record list
```

### Complex configuration

Validate:

```text
array repeater
key-value editor
tree selection/edit
credential field
JSON/code editor
validation
dirty/reset/save
```

## 10. Full quality gates

Run in this order:

```bash
npm run format:check
npm run lint
npm run tokens:build
npm run build
npm test -- --watch=false
npm run build-storybook
npm run test-storybook:ci
```

If repository CI/Chromatic provides additional checks, verify them as well.

## Final completion report format

AI must report exact evidence:

```text
FINAL_STATUS: PASS | FAIL

Quality gates:
- format: PASS/FAIL
- lint: PASS/FAIL
- build: PASS/FAIL
- unit: PASS/FAIL
- storybook build: PASS/FAIL
- storybook tests/a11y: PASS/FAIL

Legacy searches:
- Button compatibility: <count>
- BaseCrudPage: <count>
- SmartFormShell: <count>
- PermissionService in shared UI: <count>
- BasePageResponse in shared UI: <count>
- feature imports of internal renderers: <count>

Reference scenarios:
- form: PASS/FAIL
- table: PASS/FAIL
- complex config: PASS/FAIL

Remaining exceptions:
- exact path + reason, or `none`
```

Do not report PASS with unresolved exceptions hidden in prose.

## Definition of Done

- All R01-R09 DoD items are satisfied.
- Prohibited compatibility/parallel implementation searches are clean.
- Shared UI has no auth/HTTP/feature coupling.
- Form/Table public APIs are typed and clean.
- Internal renderers are not feature-facing exports.
- CDK overlay/focus behavior is verified.
- Light/dark/mobile Storybook and a11y gates pass.
- Reference feature scenarios pass.
- Final report contains evidence, not only a summary.