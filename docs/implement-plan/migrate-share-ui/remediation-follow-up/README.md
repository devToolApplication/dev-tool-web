# Shared UI Follow-up Remediation — Source of Truth

## Baseline

Reviewed baseline: `master` at `72917b85018f62c9113ab94287a696c779ef021a`.

This folder is the single source of truth for the remaining shared-UI remediation work. It supersedes the status assumptions from earlier migration commits. Commit titles such as `R10 final` or `F01 complete` must not be treated as proof of completion; source, tests, quality gates and legacy searches decide completion.

## Non-negotiable rules

1. Rewrite the current implementation in place. Do not create `V2`, `Legacy*`, `New*`, compatibility flags, parallel contracts or long-lived adapters.
2. When a public contract changes, migrate all consumers and delete the obsolete contract in the same phase.
3. Do not remove assertions or tests merely to make a phase pass. Replace old tests with tests for the new contract.
4. Shared UI must not know application permissions, business confirmation policy, API response models, feature routing workflows, business export/download workflows or feature persistence policy.
5. Readonly/detail mode must render readable data, never disappear and must not rely on disabled form controls as the default detail presentation.
6. Internal renderers may exist, but they must not become the public API of `SharedModule`.
7. A phase is complete only when implementation, consumer migration, deletion, tests, formatting, linting, build and required search gates all pass.

## Current status

| Phase | Goal | Status at baseline |
|---|---|---|
| F01 | P0 regressions + real quality gates | FAIL |
| F02 | Primitive/FormField cleanup | NOT STARTED |
| F03 | Form engine + page composition + dirty state | NOT STARTED |
| F04 | Generic presentation-only Table | NOT STARTED |
| F05 | Complex field decomposition | NOT STARTED |
| F06 | Overlay/layout/action cleanup | NOT STARTED |
| F07 | Public API + Storybook + tests + CI | NOT STARTED |
| F08 | Final repository audit | BLOCKED |

Do not start F02 until F01 is genuinely complete.

## Files

- `issues-open.md` — exhaustive current issue register.
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
READ PHASE
  -> INSPECT CURRENT MASTER
    -> SEARCH ALL CONSUMERS
      -> BUILD IMPACT MAP
        -> IMPLEMENT ONE VERTICAL SLICE
          -> MIGRATE CONSUMERS
            -> DELETE OLD CONTRACT/CODE
              -> ADD/UPDATE TESTS
                -> RUN FORMAT/LINT/BUILD/TEST
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
```

Never report complete because the application compiles or because Vercel deploy succeeds.

## Global quality gates

Run after every phase that touches application code:

```bash
npm run format:check
npm run lint
npm run build
npm test -- --watch=false
```

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

Only report `MIGRATION_COMPLETE` when all are true:

```text
P0 functional regressions = 0
+ one action bar contract works for every consumer
+ readonly/detail mode works for every supported field type
+ permission/business confirmation logic is outside shared presentation components
+ lint is real and passing
+ BaseInput is low-level
+ FormInput has no DoCheck/fake revision/stringify reactivity hacks
+ public form/table boundaries are typed
+ PageShell is structural only
+ dirty/unsaved guard works
+ Table is generic/presentation-only/a11y/mobile-ready
+ Tree and other complex fields are decomposed
+ Drawer uses Angular CDK overlay/focus/scroll primitives
+ SharedModule does not export internals
+ Storybook supports light/dark/mobile
+ unit + Storybook interaction/a11y gates pass
+ final legacy/dependency audit passes
```
