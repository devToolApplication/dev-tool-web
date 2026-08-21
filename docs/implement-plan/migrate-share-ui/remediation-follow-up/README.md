# Shared UI Follow-up Remediation — Source of Truth

## Baseline

Original follow-up baseline: `master` at `72917b85018f62c9113ab94287a696c779ef021a`.

Latest executable-plan baseline: `master` at `06c7f42ad1ff2ef44d35dae84439f2eb9340c3a7`.

This folder is the single source of truth for the remaining shared-UI remediation work. Commit titles such as `R10 final`, `F01 complete`, `RESOLVED`, a successful build, or a successful Vercel deploy must not be treated as proof of completion. Current source, consumer migration, tests, quality gates, clean-code review and final searches decide completion.

## Mandatory execution document

Before implementing the next remediation change, read:

- `execution-plan-clean-code-2026-08-22.md` — final executable work order containing the original F01-F08 requirements plus mandatory `CLEAN-01`, checklists, pseudo-code, concrete tests, search gates and final Definition of Done.

`CLEAN-01` is required after every phase. A phase that is functionally correct but introduces/retains avoidable god components, dead APIs, fake tests, public `any`, compatibility shims or business policy inside Shared UI is not complete.

## Non-negotiable rules

1. Rewrite the current implementation in place. Do not create `V2`, `Legacy*`, `New*`, compatibility flags, parallel contracts or long-lived adapters.
2. When a public contract changes, migrate all consumers and delete the obsolete contract in the same phase.
3. Do not remove assertions or tests merely to make a phase pass. Replace old tests with behavior/integration tests for the new contract.
4. Shared UI must not know application permissions, business confirmation policy, API response models, feature routing workflows, business export/download workflows or feature persistence policy.
5. Readonly/detail mode must render readable data, never disappear and must not rely on disabled form controls as the default detail presentation.
6. Internal renderers may exist, but they must not become the public API of `SharedModule`.
7. A phase is complete only when implementation, consumer migration, deletion, tests, formatting, real linting, build, CLEAN-01 and required search gates all pass.
8. Do not use fake fallbacks such as `|| true`, no-op methods, dead compatibility mappers or comments in place of assertions.
9. Do not start the next phase while the current phase still has a blocker.

## Phase order

```text
F01 -> CLEAN-01
F02 -> CLEAN-01
F03 -> CLEAN-01
F04 -> CLEAN-01
F05 -> CLEAN-01
F06 -> CLEAN-01
F07 -> CLEAN-01
F08 -> MIGRATION_COMPLETE
```

Do not start F02 until F01 is genuinely complete.

## Files

- `execution-plan-clean-code-2026-08-22.md` — mandatory final execution plan.
- `review-2026-08-21.md` — detailed review that led to the current remediation pass.
- `issues-open.md` — issue register; statuses must be verified against current source before being trusted.
- `f01-p0-regressions-and-quality-gates.md`
- `f02-primitives-form-field-controls.md`
- `f03-form-engine-page-dirty-state.md`
- `f04-table-clean-rewrite.md`
- `f05-complex-fields-decomposition.md`
- `f06-overlay-layout-actions.md`
- `f07-public-api-storybook-tests-ci.md`
- `f08-final-audit.md`

## Required execution loop

For every phase:

```text
READ EXECUTION PLAN + PHASE
  -> INSPECT CURRENT MASTER
    -> SEARCH ALL CONSUMERS
      -> BUILD IMPACT MAP
        -> IMPLEMENT ONE VERTICAL SLICE
          -> MIGRATE CONSUMERS
            -> DELETE OLD CONTRACT/CODE
              -> ADD/UPDATE BEHAVIOR TESTS
                -> RUN FORMAT/LINT/BUILD/TEST
                  -> RUN CLEAN-01
                    -> RUN PHASE SEARCH GATES
                      -> REVIEW DIFF
                        -> REPORT COMPLETE/INCOMPLETE
```

### Reporting contract

The agent must report one of:

```text
PHASE_COMPLETE
```

or

```text
PHASE_INCOMPLETE
Remaining:
- exact path / exact issue
- failed command or search result
- CLEAN-01 violation if applicable
```

Never report complete only because the application compiles or deploys.

## Global quality gates

Run after every phase touching application code:

```bash
npm run format:check
npm run lint
npm run build
npm test -- --watch=false
```

`npm run lint` must execute a real ESLint + Angular template lint configuration. `tsc --noEmit` is type-checking and does not satisfy the lint requirement.

Also run when shared UI/visual behavior changes:

```bash
npm run build-storybook
npm run test-storybook:ci
```

If tokens change:

```bash
npm run tokens:build
npm run build
```

## Final architecture target

```text
Feature/Application
  -> Page composition
    -> Public UI patterns (FormInput / Table)
      -> Internal render adapters
        -> Primitive controls / data display
          -> Design tokens
```

Forbidden dependencies in the opposite direction:

```text
Shared UI -> PermissionService
Shared UI -> business confirmation workflow
Shared UI -> API response model
Shared UI -> feature routing
Shared UI -> business CSV/download workflow
Shared UI -> feature-specific credential schema
```

## Final completion contract

Only report `MIGRATION_COMPLETE` when all F01-F08 requirements and the complete checklist in `execution-plan-clean-code-2026-08-22.md` pass, including:

```text
P0 functional regressions = 0
+ real projected-action integration tests
+ readonly/detail renderer for every supported field
+ permission/business confirmation outside shared presentation components
+ real ESLint and template lint
+ BaseInput low-level
+ FormInput without DoCheck/revision/stringify hacks
+ typed form/table public boundaries
+ simplified FormConfig
+ verified dirty/unsaved navigation behavior
+ structural PageShell
+ generic presentation-only accessible/mobile Table
+ decomposed Tree and complex fields
+ CDK-based Drawer overlay/focus/scroll
+ clean public SharedModule API
+ light/dark/mobile Storybook coverage
+ isolated tests where practical
+ required CI gates
+ final search audit
+ CLEAN-01 with no dead code/fake tests/compatibility leftovers
```
