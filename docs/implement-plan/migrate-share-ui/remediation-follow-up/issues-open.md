# Open Issues Register

Baseline: `master` at `72917b85018f62c9113ab94287a696c779ef021a`.

This file is the authoritative backlog. Update status only after verifying current source and tests.

| ID | Priority | Area | Open issue | Required result |
|---|---|---|---|---|
| UI-001 | P0 | Form actions (RESOLVED) | `FormInput` projects only `[form-actions], .form-actions, footer`, but current Job/ServiceResource consumers project a plain `<div>` | Consumers use one explicit `[form-actions]` contract; exactly one action bar renders |
| UI-002 | P0 | Tests (RESOLVED) | F01 removed assertions/reset test instead of replacing with integration tests for projection contract | Host/integration tests prove one Cancel/Save, submit once, invalid/submitting behavior |
| UI-003 | P0 | Readonly (RESOLVED) | Tree readonly branch is empty; readonly contract is inconsistent across fields | Every supported field renders readable detail; no field disappears |
| UI-004 | P0 | Permission (RESOLVED) | `ActionToolbar` imports/injects `PermissionService` | Zero application permission service in shared UI |
| UI-005 | P0 | Action policy (RESOLVED) | `ActionToolbar` owns confirmation policy and legacy severity mapping | Feature/application owns confirmation; shared action model is presentation-only |
| UI-006 | P0 | Table permissions (RESOLVED) | Table/TableCell keep permission metadata or placeholder permission helpers | Permission metadata and fake helpers removed; feature pre-resolves actions |
| UI-007 | P0 | Quality gate (RESOLVED) | `lint` uses `ng lint` without a real configured lint target/toolchain | ESLint + Angular template lint executes and passes |
| UI-008 | P1 | Form reactivity (RESOLVED) | `FormInput` still uses `DoCheck`, revision signals and JSON context signatures | Immutable/change-driven typed engine updates; hacks deleted |
| UI-009 | P1 | Type safety | `any` remains on FormInput/FormConfig/Table core boundaries | Generic/unknown-based typed public contracts; near-zero core `any` |
| UI-010 | P1 | FormConfig | Fractional grid widths, `smart/wizard`, status/sticky/readonly layout flags remain | Minimal form configuration; semantic widths only |
| UI-011 | P1 | BaseInput (RESOLVED) | BaseInput still owns labels/help/errors/floating-label/presentation | BaseInput is low-level CVA/control state only |
| UI-012 | P1 | PageShell | PageShell still owns title/status/loading/error/empty/retry orchestration | PageShell is structural width/layout only; PageHeader/ContentState separate |
| UI-013 | P1 | Dirty guard | Feature forms do not expose a verified unsaved-changes contract | `dirtyChange`/feature signal + guard + mark-saved/reset tests |
| UI-014 | P1 | Table architecture | Table remains a large orchestration component with search/export/import/persistence/state concerns | Generic presentation-only `TableComponent<T>` |
| UI-015 | P1 | Table a11y | Clickable `<th>`, focusable rows and weak checkbox names remain | Sort button + `aria-sort`, explicit navigation/action semantics, named selection controls |
| UI-016 | P1 | Table responsive | Horizontal overflow/min-width remains the mobile strategy | Mobile record-list presentation |
| UI-017 | P1 | Tree | FieldTreeRenderer remains a god component | Tree view/editor/picker/toolbar/selection + pure logic modules split |
| UI-018 | P1 | Complex fields | Record/Secret/JSON/Code responsibilities are still mixed into generic form config/renderers | Dedicated reusable editors + thin field adapters |
| UI-019 | P1 | Drawer | Manual body append, scroll lock, Tab focus trap, DOM queries remain | Angular CDK Overlay/Portal/FocusTrap/BlockScrollStrategy |
| UI-020 | P1 | Section state | SectionPanel/PageShell still own loading/error/empty/retry state | Structural components + separate ContentState |
| UI-021 | P1 | Public API (RESOLVED) | SharedModule exports internal renderers/TableCell/TableFilter and retains legacy grouping | Public exports reduced to true public primitives/patterns/layout/overlay/feedback/data-display |
| UI-022 | P2 | Storybook (RESOLVED) | Preview forces light theme | Toolbar-controlled light/dark + required viewports |
| UI-023 | P2 | Test isolation/CI | Tests import broad SharedModule; CI evidence is mostly Vercel | Minimal unit dependencies + required format/lint/build/unit/Storybook/a11y checks |
| UI-024 | P2 | Final audit | Legacy/dependency/type search targets still match | All mandatory zero targets cleared; remaining non-zero matches reviewed/documented |

## Current P0 blockers

Do not proceed to F02 until all are resolved:

```text
UI-001 action projection
UI-002 test regression
UI-003 readonly rendering
UI-004 permission service leak
UI-005 action confirmation/severity business policy
UI-006 table permission placeholders/contracts
UI-007 real lint gate
```

## Baseline examples that must disappear

```text
FormInput implements DoCheck
engineRevision / inputRevision
JSON.stringify context signature
@Input() showSubmit after default submit UI was removed
@if (readonlyMode) { /* empty */ }
PermissionService inside ActionToolbar
permissions / permissionMode / permissionDeniedTooltip in shared action/table contracts
severity() legacy mapper
BaseInput FloatLabelType
PageShell loading/error/empty/retry orchestration
Table changes['pageResponse'] after pageResponse input removal
manual document.body overlay portal/focus trapping
LEGACY_PRIMITIVE_COMPONENTS public grouping
Storybook forced light theme
```



