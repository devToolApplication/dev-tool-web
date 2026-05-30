# Flow Navigator Minimap Plan Index

Date: 2026-05-29

## Goal

Custom `app-flow-navigator` so the minimap menu and interaction can move toward the `joint-demos/ai-agent-builder` template without adding `@joint/plus`.

Current state:
- `FlowNavigatorComponent` renders a small DOM minimap from `FlowDefinition.nodes`.
- `FlowBuilderComponent` places the navigator as an absolute panel at the canvas bottom-left.
- `JointFlowEngine` owns the real JointJS paper, pan, zoom, fit, selection, and node movement.
- There is already toolbar support for `fit`, `zoomIn`, `zoomOut`, `resetZoom`, `toggleNavigator`.

Design constraints:
- Keep this inside shared `flow-builder`.
- Do not use third-party UI components directly in templates. Use native HTML where this is a low-level shared wrapper, or existing `app-*` wrappers if appropriate.
- Do not make the minimap compete with the canvas. It is secondary navigation only.
- Keep APIs reusable for future flow screens.
- No backend changes.

## Recommended Delivery Order

1. Level 1 - Navigator controls only.
   - Add compact `+`, `-`, `fit`, `collapse` controls.
   - Reuse existing engine commands.
   - Low risk and immediately fixes "mini map menu khong co plus".

2. Level 2 - Live viewport rectangle.
   - Show current visible canvas area inside the minimap.
   - Requires engine transform snapshot.

3. Level 3 - Drag viewport to pan canvas.
   - Make the viewport rectangle draggable.
   - Requires coordinate mapping from minimap to paper translation.

4. Level 4 - Template parity polish.
   - Add collapse animation, zoom percentage, minimap mode options, keyboard/a11y, visual details close to the JointJS demo.

## Files

Plan files:
- `docs/plans/flow-navigator-level-1-controls-plan.md`
- `docs/plans/flow-navigator-level-2-viewport-sync-plan.md`
- `docs/plans/flow-navigator-level-3-viewport-drag-plan.md`
- `docs/plans/flow-navigator-level-4-template-parity-plan.md`

Primary implementation files:
- `src/app/shared/ui/flow-builder/components/flow-navigator/flow-navigator.component.ts`
- `src/app/shared/ui/flow-builder/components/flow-navigator/flow-navigator.component.html`
- `src/app/shared/ui/flow-builder/components/flow-navigator/flow-navigator.component.css`
- `src/app/shared/ui/flow-builder/components/flow-builder/flow-builder.component.ts`
- `src/app/shared/ui/flow-builder/components/flow-builder/flow-builder.component.html`
- `src/app/shared/ui/flow-builder/joint/joint-flow-engine.ts`
- `src/app/shared/ui/flow-builder/models/flow-command.model.ts`
- `src/app/shared/ui/flow-builder/models/flow-capability.model.ts`
- `src/app/shared/ui/flow-builder/models/index.ts`
- `src/app/core/i18n/common/common.i18n.json`
- `src/app/shared/ui/flow-builder/components/flow-builder/flow-builder.stories.ts`

## Decision Matrix

| Level | What user gets | Risk | Estimate | Should do now |
|---|---|---:|---:|---|
| 1 | Plus/minus/fit/collapse menu | Low | 1-2 hours | Yes |
| 2 | Visible viewport overlay | Medium | 0.5-1 day | After level 1 |
| 3 | Drag minimap viewport to pan | Medium-high | 1-2 days | After level 2 |
| 4 | Near-template UX polish | Medium-high | 2-4 days | Last |

## Global Acceptance Criteria

- Storybook `Shared/UI/FlowBuilder/AI Agent Workflow` opens without console errors.
- Minimap does not shrink or cover the primary flow canvas.
- Canvas remains the primary focus in first viewport.
- No direct third-party UI component usage is introduced.
- `npm.cmd run build` passes.
- `npm.cmd run build-storybook` passes when Storybook behavior changes.
- Browser check covers desktop 1782x900 and a narrow viewport around 390x844.

## Out Of Scope

- Replacing JointJS core with JointJS Plus.
- Server persistence for minimap state.
- Reworking node renderer visual design.
- Full image thumbnail rendering of the paper.

