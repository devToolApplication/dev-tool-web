---
title: flow-builder-phase-1-3-review
type: note
permalink: dev-tool-web/docs/reviews/flow-builder-phase-1-3-review
---

# Review: Flow Builder Phase 1-3

Date: 2026-05-28

Scope:
- `dev-tool-web/src/app/shared/ui/flow-builder/**`
- integration points in `SharedModule`, `AppFeatureModule`, rule config form, and backtest detail
- plan reference: `dev-tool-web/docs/flow-builder-common-component-plan.md`

Verdict: Request changes.

Status: Open. Several previous blockers are fixed, but the current implementation still has correctness, i18n, and bundling issues before phase 1-3 should be considered complete.

## Resolved Since Previous Review

- Flow builder declarations were removed from root `SharedModule`.
  - `dev-tool-web/src/app/shared/shared.module.ts:275` now declares shared primitives/UI only.
  - `dev-tool-web/src/app/shared/ui/flow-builder/flow-builder.module.ts:22` declares a dedicated `FlowBuilderModule`.
- Mode changes now update JointJS interactivity.
  - `dev-tool-web/src/app/shared/ui/flow-builder/components/flow-canvas/flow-canvas.component.ts:73` reacts to `mode`.
  - `dev-tool-web/src/app/shared/ui/flow-builder/joint/joint-flow-engine.ts:69` exposes `setMode()`.
- DOM pan/zoom listeners are cleaned up through `AbortController`.
  - `dev-tool-web/src/app/shared/ui/flow-builder/joint/joint-flow-engine.ts:32` stores the controller.
  - `dev-tool-web/src/app/shared/ui/flow-builder/joint/joint-flow-engine.ts:64` aborts listeners in `destroy()`.
- Edge selection now highlights edges.
  - `dev-tool-web/src/app/shared/ui/flow-builder/components/flow-canvas/flow-canvas.component.ts:110` distinguishes nodes from edges.
  - `dev-tool-web/src/app/shared/ui/flow-builder/components/flow-canvas/flow-canvas.component.ts:113` calls `highlightEdge()`.
- `validateConnection` now maps JointJS ids back to flow node ids.
  - `dev-tool-web/src/app/shared/ui/flow-builder/joint/joint-flow-engine.ts:51` resolves source flow id.
  - `dev-tool-web/src/app/shared/ui/flow-builder/joint/joint-flow-engine.ts:52` resolves target flow id.

## Findings

### 1. Important: Flow builder is still bundled at the broad app-feature level

Evidence:
- `dev-tool-web/src/app/app.routes.ts:7` lazy-loads one `AppFeatureModule` for the whole app feature area.
- `dev-tool-web/src/app/features/app-feature.module.ts:46` imports `FlowBuilderModule`.
- `dev-tool-web/src/app/features/app-feature.module.ts:105` imports `FlowBuilderModule` into the whole feature module.
- `@joint/core` is imported by `dev-tool-web/src/app/shared/ui/flow-builder/joint/joint-flow-engine.ts:1`, `joint-flow-layout.ts:1`, `joint-flow-paper-options.ts:1`, and `joint-flow-renderer.ts:1`.

Impact:
- The root `SharedModule` issue is fixed, but JointJS is still attached to every route declared by `AppFeatureModule`, not only the Trade Bot screens that render `app-flow-builder`.
- The build confirms a large `app-feature-module` lazy chunk and a separate large `index` lazy chunk. That is better than root initial loading, but still broader than the plan's reusable/lazy boundary.

Required fix:
- Move `FlowBuilderModule` import closer to the Trade Bot feature boundary.
- Prefer a dedicated lazy Trade Bot module/route split, or convert flow builder consumers to a standalone/lazy import pattern.
- Keep non-Trade-Bot feature routes from loading JointJS unless they actually render a flow canvas.

### 2. Important: Existing edges are never updated during diff sync

Evidence:
- `dev-tool-web/src/app/shared/ui/flow-builder/joint/joint-flow-engine.ts:130` begins edge add/update handling.
- `dev-tool-web/src/app/shared/ui/flow-builder/joint/joint-flow-engine.ts:132` immediately skips any edge id already in `edgeMap`.
- `dev-tool-web/src/app/shared/ui/flow-builder/joint/joint-flow-engine.ts:138` to `144` only run for new edges.

Impact:
- If a parent updates an existing edge's source, target, label, type, style, or metadata, the canvas keeps rendering the stale JointJS link.
- This violates the phase 2.3 acceptance criterion: "Adds/updates/removes edges."

Required fix:
- For existing edges, compare source/target ports, label, and edge type/style.
- Update the existing JointJS link when any edge-rendered field changes, or replace that one link while preserving the rest of the graph.
- Add a focused diff test for edge endpoint and label update.

### 3. Important: First null render disables first real auto-layout and fit

Evidence:
- `dev-tool-web/src/app/shared/ui/flow-builder/components/flow-canvas/flow-canvas.component.ts:90` enters `renderGraph()`.
- `dev-tool-web/src/app/shared/ui/flow-builder/components/flow-canvas/flow-canvas.component.ts:91` renders the current value, including `null`.
- `dev-tool-web/src/app/shared/ui/flow-builder/components/flow-canvas/flow-canvas.component.ts:93` and `97` only run layout/fit when `firstRenderDone` is false.
- `dev-tool-web/src/app/shared/ui/flow-builder/components/flow-canvas/flow-canvas.component.ts:101` sets `firstRenderDone = true` even when `value` is `null`.

Impact:
- A common async flow is: component mounts with `value=null`, data loads later. In that case the first real graph will not auto-layout or fit.
- The current rule config and backtest integrations also pass `[value]="null"`, so this path is not theoretical.

Required fix:
- Track first non-null or first non-empty graph render separately.
- Only consume the initial layout/fit behavior once there is graph content, unless the caller explicitly disabled it.
- Add a test for `null -> populated value`.

### 4. Important: English i18n keys are missing for shared flow builder

Evidence:
- `dev-tool-web/src/app/core/i18n/common/common.i18n.json:200` to `210` adds `shared.flowBuilder.*` keys under `vi`.
- A JSON check found `vi` has 11 `shared.flowBuilder.*` keys and `en` has 0.
- The template uses these keys in `dev-tool-web/src/app/shared/ui/flow-builder/components/flow-builder/flow-builder.component.html:4`, `:12`, `:47`, and `:52`.

Impact:
- Switching the app to English will render raw translation keys for flow builder toolbar/inspector text.
- The hardcoded `Edge` issue was fixed, but the i18n contract is still incomplete.

Required fix:
- Add matching `shared.flowBuilder.*` keys under `en`.
- Keep key sets synchronized for both languages.

### 5. Important: Flow builder has no focused tests for behavior-heavy engine code

Evidence:
- `dev-tool-web/src/app/shared/ui/flow-builder/**` currently has no `*.spec.ts` files.
- The plan requires tests around diff sync, component create/destroy, and projected template discovery.
- Current remaining defects are exactly the kinds of regressions that focused tests would catch.

Impact:
- Incremental sync, lifecycle cleanup, selection highlighting, and mode changes can regress silently.
- Manual build only verifies TypeScript compile, not canvas behavior.

Required fix:
- Add unit tests for `JointFlowEngine.render()` add/update/remove behavior, especially edge update.
- Add `FlowCanvasComponent` tests for mode change, `null -> populated value`, and edge selection highlight dispatch.
- Add directive projection tests for `appFlowNodeTemplate`, `appFlowEdgeTemplate`, and `appFlowInspectorTemplate`.

## Non-Blocking Notes

- `appFlowNodeTemplate` and `appFlowEdgeTemplate` directives exist, but parent-provided node/edge rendering is not wired into the renderer yet. This appears to be planned for later template phases, so it is not counted as a phase 1-3 blocker here.
- `FlowToolbarConfig.commands` and `customActions` are modeled but not applied by the current toolbar. This is acceptable only if command configurability is intentionally deferred.
- Rule config and backtest trace still render `<app-flow-builder [value]="null">`; this keeps the flow tab as a shell rather than useful domain visualization.

## Verification

Commands run during this re-review:
- `npm.cmd run build`: passed.
- `npm.cmd test -- --watch=false`: failed due existing unrelated spec compile errors:
  - `src/app/shared/component/input-multi/input-multi.spec.ts:24` and `:60`: `onModelChange` does not exist on `InputMulti`.
  - `src/app/shared/component/progress-spinner/progress-spinner.component.spec.ts:26`: `ngAfterViewChecked` does not exist on `ProgressSpinnerComponent`.
  - `src/app/shared/ui/layout/action-toolbar/action-toolbar.component.spec.ts:113`: `visibleActions` does not exist on `ActionToolbarComponent`.

## Re-review Policy

For this same phase 1-3 review request, overwrite this file after fixes and re-review. Do not create duplicate review files for the same request.