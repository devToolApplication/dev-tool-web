# F08 — Final Repository Audit

## Goal

Prove that the migration is complete. F08 contains no major architecture rewrite; if a major issue is found, return to the owning phase.

## Preconditions

F01–F07 must each be `PHASE_COMPLETE` with their own gates passing.

## F08.1 — Re-run all quality gates from clean install/environment

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

Record exact command results in final report.

## F08.2 — Compatibility and legacy search

```bash
rg "severity=|\[severity\]|\[text\]|size=\"small\"|size=\"large\"" src
rg "SmartFormShell|FormStatusPanel|ReadonlyField|ReadonlySection|BaseCrudPage" src
rg "LEGACY_|Legacy|V2|compatibilityMode|legacyMode|useNewUi" src/app/shared
```

Expected migration compatibility matches: zero unless a match is unrelated text and documented.

## F08.3 — Shared dependency boundaries

```bash
rg "PermissionService" src/app/shared/ui
rg "BasePageResponse" src/app/shared/ui
rg "permissionMode|permissionDeniedTooltip|permissions\?" src/app/shared/ui
rg "ConfirmDialogService" src/app/shared/ui/layout/action-toolbar src/app/shared/ui/patterns/table
```

Expected: zero.

## F08.4 — Form audit

```bash
rg "DoCheck|engineRevision|inputRevision|contextSignature|trackConfigRevision" src/app/shared/ui/patterns/form-input
rg "showStatusPanel|stickyFooter|disabled-controls|mode.*smart|mode.*wizard" src/app/shared/ui/patterns/form-input
rg "'1/2'|'1/3'|'1/4'|'1/6'" src/app/shared/ui/patterns/form-input
rg "\bany\b" src/app/shared/ui/patterns/form-input
```

Expected legacy/reactivity/layout matches: zero.

Every remaining `any` must be reviewed. Core public API target is zero; unavoidable third-party template/context boundaries must be localized and documented.

Verify runtime scenarios:

```text
create form
edit form
readonly/detail form
long sectioned form
invalid submit focus
external API error mapping
dirty navigation guard
save clears dirty
```

## F08.5 — Table audit

```bash
rg "PermissionService|BasePageResponse|ConfirmDialogService" src/app/shared/ui/patterns/table
rg "Blob|createObjectURL|downloadCsv" src/app/shared/ui/patterns/table
rg "pageResponse" src/app/shared/ui/patterns/table
rg "\bany\b" src/app/shared/ui/patterns/table
```

Verify:

```text
sort keyboard/a11y
pagination
selection
row action
mobile record list
empty/error/loading
feature-owned delete confirm/export
```

## F08.6 — Overlay audit

```bash
rg "document\.body|appendChild|removeChild|querySelectorAll|document:keydown\.tab" src/app/shared/ui/overlay
```

Expected manual overlay implementation matches: zero.

Verify Drawer/Dialog/Confirm focus trap, restore, backdrop, Escape and stacking.

## F08.7 — Public API audit

```bash
rg "FieldRenderer|FieldTreeRenderer|FieldArrayRenderer|FieldGroupRenderer|FieldRecordRenderer|TableCellComponent|TableFilterComponent" src/app/shared/shared.module.ts
```

Expected internal exports: zero.

Search feature code for forbidden direct internal imports.

## F08.8 — Storybook audit

Verify all critical stories in both Light and Dark at:

```text
1440
1024
768
390
```

No hardcoded light theme.

No new a11y failures.

## F08.9 — Final architecture review

Confirm dependency direction:

```text
Feature
  -> Page composition
    -> public Form/Table patterns
      -> internal renderers
        -> primitives/data-display
          -> tokens
```

Reject any reverse coupling to feature/application services.

## Final report template

```markdown
# Shared UI Final Audit

Baseline: <sha>
Final HEAD: <sha>

## Quality gates
- format: PASS/FAIL
- lint: PASS/FAIL
- tokens: PASS/FAIL
- build: PASS/FAIL
- unit: PASS/FAIL
- storybook build: PASS/FAIL
- storybook interaction/a11y: PASS/FAIL

## Search gates
- compatibility: PASS/FAIL + matches
- permission dependencies: PASS/FAIL + matches
- form legacy/hacks: PASS/FAIL + matches
- table business dependencies: PASS/FAIL + matches
- manual overlay: PASS/FAIL + matches
- internal exports: PASS/FAIL + matches
- explicit any review: PASS/FAIL + exceptions

## Runtime acceptance
- form create/edit/readonly: PASS/FAIL
- dirty guard: PASS/FAIL
- table desktop/mobile/a11y: PASS/FAIL
- overlays: PASS/FAIL
- dark/mobile visual check: PASS/FAIL

## Remaining issues
- NONE
```

Only if `Remaining issues = NONE` and all mandatory gates pass may the agent report:

```text
MIGRATION_COMPLETE
```
