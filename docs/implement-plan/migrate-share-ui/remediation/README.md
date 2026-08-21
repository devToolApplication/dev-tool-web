# Shared UI Remediation Plan

## Purpose

This remediation plan fixes the code-quality and architecture gaps left after the first shared-UI migration pass. It is not a new UI version and it does not replace the original migration intent.

Baseline reviewed: `master` at `be4636e2d8ea92c29aabb881e8cb767d8cacac30`.

The current code has useful progress, but must not be treated as complete while compatibility APIs, dead migration code, mega components, application dependencies in shared UI, internal renderer exports, accessibility gaps, and incomplete test gates still exist.

## Non-negotiable rules

1. Rewrite the existing implementation in place.
2. Do not create `V2`, `Legacy*`, `New*`, `compatibilityMode`, `useNewUi`, or a parallel implementation.
3. When a public contract changes, migrate all affected consumers and delete the old contract in the same remediation phase.
4. Do not use `any`, type assertions, disabled tests, or compatibility setters just to make compilation pass.
5. Shared UI must not know application auth, HTTP response models, feature services, routing workflows, or business export logic.
6. A phase is not complete because `npm run build` passes. Old code, dead code, compatibility code, and old exports must also be removed.
7. Run formatting, lint, tests, Storybook and legacy searches before reporting a phase complete.

## Required phase order

| Phase | File | Goal |
|---|---|---|
| R01 | `r01-quality-gates-and-migration-debt.md` | Remove migration compatibility/dead code and add code-quality gates |
| R02 | `r02-primitives-and-form-controls.md` | Simplify BaseInput and unify primitive control contracts |
| R03 | `r03-form-engine-clean-rewrite.md` | Finish the FormInput/Form Engine rewrite cleanly |
| R04 | `r04-page-composition-and-dirty-state.md` | Finish PageShell/page composition and restore dirty-state behavior |
| R05 | `r05-complex-form-fields-decomposition.md` | Split Tree/Secret/JSON/Array/Record responsibilities |
| R06 | `r06-table-clean-rewrite.md` | Make Table a generic, accessible, presentation-only pattern |
| R07 | `r07-overlay-layout-actions.md` | CDK overlays, clean layout/state boundaries, action cleanup |
| R08 | `r08-public-api-and-legacy-removal.md` | Remove internal exports, duplicates and legacy components |
| R09 | `r09-tests-storybook-ci.md` | Test isolation, light/dark/mobile Storybook and CI gates |
| R10 | `r10-final-audit.md` | Repository-wide legacy/dependency/type/quality audit |

## AI execution workflow

For every phase execute:

```text
READ
  -> INSPECT CURRENT SOURCE
    -> BUILD IMPACT MAP
      -> IMPLEMENT ONE VERTICAL SLICE
        -> MIGRATE CONSUMERS
          -> DELETE OLD CONTRACT/CODE
            -> ADD/UPDATE TESTS
              -> RUN QUALITY GATES
                -> SEARCH FOR LEGACY
                  -> REVIEW DIFF
                    -> REPORT DONE/NOT DONE
```

### Mandatory pre-change inspection

Use repository search before editing. Examples:

```bash
rg "severity=|\[severity\]|\[text\]|size=\"small\"|size=\"large\"" src
rg "SmartFormShell|FormStatusPanel|ReadonlyField|ReadonlySection" src
rg "PermissionService|BasePageResponse" src/app/shared/ui
rg "\bany\b" src/app/shared/ui
rg "FieldRenderer|FieldTreeRenderer|TableCellComponent|TableFilterComponent" src/app
```

Do not infer consumers from memory. Search them.

### Vertical-slice rule

Do not modify 30 components and test only at the end. Example for form controls:

```text
FormField
  -> InputText
    -> FieldRenderer
      -> Job Form
        -> tests
```

Once the slice passes, apply the same contract to the next control.

## Global quality gates

Before a remediation phase is considered complete:

```bash
npm run format:check
npm run lint
npm run build
npm test -- --watch=false
npm run build-storybook
```

When Storybook interaction/a11y is affected:

```bash
npm run test-storybook:ci
```

When tokens are changed:

```bash
npm run tokens:build
npm run build
```

## Global completion contract

An AI agent may only report `PHASE_COMPLETE` when all are true:

```text
new implementation works
+ consumers migrated
+ old API deleted
+ compatibility deleted
+ dead code deleted
+ internal/public exports corrected
+ tests added for new contract
+ format/lint/build/unit/storybook gates pass
+ legacy search returns expected zero results
```

If any item is missing, report `PHASE_INCOMPLETE` and list the exact remaining paths/usages.

## Current known remediation targets

At the reviewed baseline, examples include:

- `Button` still has `severity`, `text`, `small`, `large` compatibility.
- `ActionToolbarComponent` still has a dead legacy `severity()` mapper and directly injects `PermissionService`.
- `FormInput` still uses `SmartFormShell`, `FormStatusPanel` behavior, `DoCheck`, JSON-signature context tracking, fake revision signals and broad `any` types.
- `form-input.html` duplicates field-dispatch rendering for first and remaining sections.
- `BaseInput` still owns label/help/error/floating-label presentation.
- `TableComponent` still imports `PermissionService`, `BasePageResponse`, confirmation/export/persistence concerns and uses inaccessible sortable headers / row-click semantics.
- Drawer still manually appends to `document.body`, traps focus, listens to document keys and manages body overflow.
- `SectionPanel` still owns loading/error/empty/retry state.
- `SharedModule` still exports internal renderers and legacy/duplicate primitives.
- Storybook still forces light theme.

These are starting observations, not permission to skip source inspection.