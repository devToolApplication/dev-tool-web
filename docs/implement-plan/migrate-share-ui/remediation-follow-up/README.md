# Shared UI Remediation Follow-up Plan

## Purpose

This plan is the second remediation pass created after reviewing `master` at commit `caec1355d3946a692e46544823813d286d552292`.

The previous remediation made useful progress, but the repository must still be treated as **incomplete** because several P0 regressions and architecture gaps remain in FormInput, readonly rendering, Table, ActionToolbar, Drawer, PageShell, SharedModule, Storybook, and CI quality gates.

This is not a new UI version. Continue rewriting the current implementation in place.

## Non-negotiable rules

1. Do not create `V2`, `Legacy*`, `New*`, compatibility setters, compatibility wrappers, feature flags, or parallel implementations.
2. When a contract changes, migrate every affected consumer and delete the old contract in the same phase.
3. Do not replace removed business logic with `return true`, `return !permissions.length`, empty template branches, comments, or skipped assertions.
4. Shared UI must not depend on application auth services, HTTP response models, business export workflows, feature routing decisions, or feature-level confirmation policies.
5. Do not claim a phase is complete until old code and old schema are removed and all relevant searches return the expected result.
6. Avoid `any` in core shared UI contracts. Prefer generics or `unknown` with narrowing.
7. Every P0 functional regression must be fixed before deeper cleanup continues.

## Required phase order

| Phase | Goal |
|---|---|
| F01 | Fix readonly/action/permission regressions and make quality gates real |
| F02 | Finish BaseInput/FormField/control foundation cleanup |
| F03 | Finish FormInput/FormEngine/FormConfig rewrite and dirty-state page integration |
| F04 | Finish Table rewrite: generic, presentation-only, accessible, responsive |
| F05 | Decompose Tree/complex fields and remove domain-specific form schema |
| F06 | Migrate Drawer/layout/actions to clean boundaries and Angular CDK |
| F07 | Reduce SharedModule/public API, finish Storybook/test/CI hardening |
| F08 | Final repository audit and acceptance scenarios |

## Execution workflow

For each phase:

```text
READ THIS README
  -> READ PHASE FILE
    -> INSPECT CURRENT HEAD
      -> BUILD CONSUMER IMPACT MAP
        -> IMPLEMENT ONE VERTICAL SLICE
          -> MIGRATE ALL CONSUMERS OF CHANGED CONTRACT
            -> DELETE OLD CODE/SCHEMA
              -> ADD/UPDATE TESTS
                -> RUN FORMAT/LINT/BUILD/TEST/STORYBOOK
                  -> RUN LEGACY SEARCHES
                    -> REVIEW DIFF
                      -> REPORT COMPLETE OR INCOMPLETE
```

## Global quality gates

The following commands must be real and executable, not placeholder scripts:

```bash
npm run format:check
npm run lint
npm run tokens:build
npm run build
npm test -- --watch=false
npm run build-storybook
npm run test-storybook:ci
```

If `npm run lint` is configured as `ng lint`, the Angular workspace must contain a valid lint target and the required ESLint/Angular ESLint packages/configuration.

## Global completion contract

A phase can report `PHASE_COMPLETE` only when all are true:

```text
functional behavior works
+ consumers migrated
+ old API deleted
+ old schema deleted
+ no compatibility bridge remains
+ no empty replacement branch remains
+ dead code deleted
+ tests verify the new behavior
+ format/lint/build/unit/storybook pass
+ legacy/dependency search returns expected zero results
```

If any item is missing, report `PHASE_INCOMPLETE` with exact paths and remaining usages.

## Current reviewed blockers

At baseline `caec1355...`:

- Tree readonly branch is empty.
- FormInput and feature pages can render duplicate action bars.
- FormInput still uses `DoCheck`, revision signals, JSON context signatures and broad `any` types.
- BaseInput still owns label/help/error/floating-label presentation.
- ActionToolbar still imports `PermissionService`, handles business confirmation and contains legacy variant/severity mapping.
- Table/TableCell still retain permission/confirm schema, broad `any`, CSV/persistence concerns, manual DOM portal behavior and inaccessible sort/row semantics.
- Table decoupling currently contains permission fallbacks such as `return true` / `!permissions.length` instead of migrated feature contracts.
- PageShell and SectionPanel still own loading/error/empty state.
- Drawer still manually appends to `document.body`, traps focus and manages body scroll.
- Tree renderer remains a mega component.
- SharedModule still exports internal renderers and table internals.
- Storybook still forces light theme.
- `lint` script exists but workspace/dependencies are not fully configured for a real Angular ESLint gate.

These are inspection anchors, not a substitute for searching current HEAD before editing.
