---
title: joint-ai-agent-builder-migration-readiness-review
type: note
permalink: dev-tool-web/docs/reviews/joint-ai-agent-builder-migration-readiness-review
---

# Review: Joint AI Agent Builder Migration Readiness

Date: 2026-05-30

## Source Reviewed

- Demo: https://github.com/clientIO/joint-demos/tree/main/ai-agent-builder
- Main snapshot checked locally: `2863a32d099e459e9182399e95fb261517ca4ee7`
- Demo uses `@joint/plus` and `@joint/layout-directed-graph`; local `dev-tool-web` uses `@joint/core`.

## Current Verdict

Local `app-flow-builder` now covers the core shared-canvas baseline and the previously broken HTML node wire drag is fixed.

Exact UI/UX parity with the demo is still not complete because several demo features are JointJS+ powered or need local equivalents: PaperScroller, Selection/Lasso, CommandManager, ContextToolbar, provider registry, edge insert tools, resize tools, and directed graph layout.

## Regression Fixed

### HTML overlay port connection

Issue:

- HTML node overlay ports sat above the SVG paper.
- JointJS link drag without snapping relies on `event.target`, so it could miss the real SVG magnet behind the overlay.
- Story interaction also started before SVG port DOM was guaranteed to exist.

Fix:

- Added `startJointLinkDragInteraction()` to bridge overlay port drag into the real JointJS element view.
- Enabled `snapLinks: { radius: 48 }` so JointJS resolves target magnets by coordinate.
- Story interaction now waits for both overlay ports and SVG `[port]` magnets before dragging.

Files:

- `src/app/shared/ui/flow-builder/joint/joint-link-drag-interaction.ts`
- `src/app/shared/ui/flow-builder/joint/joint-flow-engine.ts`
- `src/app/shared/ui/flow-builder/joint/joint-flow-paper-options.ts`
- `src/app/shared/ui/flow-builder/components/flow-node-overlay-host/flow-node-overlay-host.component.ts`
- `src/app/shared/ui/flow-builder/components/flow-builder/flow-builder.stories.ts`

## Demo Feature Matrix

| Demo feature | Local status | Test / note |
|---|---:|---|
| JointJS paper with grid/background/router | Supported | Build + existing renderer/paper options. |
| HTML/Angular node template overlay | Supported | Overlay host + Storybook connection story. |
| Drag node on canvas | Supported | Existing overlay drag emits node move; keep in regression suite. |
| Drag link from output port to input port | Supported | `HtmlPortConnection` Storybook play test passes. |
| Initial fit without node jumping to corner | Supported | `SingleRuleRefInitialFit` Storybook play test passes. |
| Mouse wheel zoom / canvas pan | Supported/partial | Existing engine logic; should add dedicated browser tests next. |
| Minimap/navigator | Supported/partial | Custom navigator exists, not JointJS+ Navigator parity. |
| Floating toolbar | Supported/partial | Toolbar exists; visual/command set not exact demo. |
| Fullscreen command | Supported/partial | Command exists in toolbar flow; needs browser coverage. |
| Import/export JSON | Supported/partial | File input now labelled; needs browser coverage. |
| Inspector panel | Supported/partial | Schema/form panel exists; not demo provider-specific inspector. |
| Plus menu / add from node | Supported/partial | Fixed custom source out-port resolution; needs Storybook coverage. |
| Selection/lasso/multi-select | Missing | Demo uses JointJS+ selection behavior. |
| Edge hover insert-node tool | Missing | Needs local implementation. |
| Node hover tool menu | Missing/partial | Basic menu/add button only. |
| Note resize/content edit | Missing | Shape exists, editor behavior missing. |
| Provider registry/search dialog | Missing | Needs domain registry API and dialog. |
| Directed graph layout parity | Missing/partial | Local layout is custom/simple, not `layout-directed-graph`. |
| Keyboard shortcuts | Missing/partial | Needs explicit test matrix. |

## Tests Added / Updated

Unit:

- `joint-link-drag-interaction.spec.ts`
  - starts, moves, and completes a JointJS link drag from external HTML control
  - Escape cancels temporary link and stops batch
- `joint-flow-paper-options.spec.ts`
  - asserts `snapLinks` stays enabled for HTML overlay connections
- `flow-node-overlay-host.component.spec.ts`
  - does not render HTML overlay nodes before a real layout/data position exists
  - add-node menu uses the source node's actual out port

Storybook/browser:

- `SingleRuleRefInitialFit`
  - verifies first render does not place the only node in the canvas corner
- `HtmlPortConnection`
  - verifies dragging from HTML overlay output port creates a JointJS link
  - waits for SVG magnets before interaction to avoid async paper race

A11y hardening needed for Storybook runner:

- labelled hidden JSON import file input
- labelled palette landmark
- raised text contrast for palette/inspector/story helper text

## Verification

Passed:

```powershell
cd d:\Code\dev-tool-web
npm.cmd test -- --include src/app/shared/ui/flow-builder/joint/joint-link-drag-interaction.spec.ts --watch=false
npm.cmd test -- --include src/app/shared/ui/flow-builder/joint/joint-flow-paper-options.spec.ts --watch=false
npm.cmd test -- --include src/app/shared/ui/flow-builder/components/flow-node-overlay-host/flow-node-overlay-host.component.spec.ts --watch=false
npm.cmd test -- --include src/app/shared/ui/flow-builder/components/flow-canvas/flow-canvas.component.spec.ts --watch=false
npm.cmd exec test-storybook -- --url http://127.0.0.1:6006 --includeTags flow-builder-initial-fit,flow-builder-connection --maxWorkers 1 --testTimeout 30000
npm.cmd run build
```

Build warning still present:

- `src/app/features/admin/trade-bot-management/share/rule-expression-builder/rule-expression-builder.component.css` exceeds the 8 KB budget by 311 bytes.

## Required Next Test Cases

Add these before claiming full demo parity:

1. Canvas mouse wheel zoom keeps cursor-local focus.
2. Blank-space drag pans canvas and does not move nodes.
3. Node drag updates `FlowDefinition.nodes[].position`.
4. Navigator viewport rectangle remains proportional after zoom/pan/resize.
5. Navigator drag pans the canvas to the selected viewport.
6. Plus menu adds a selected node type and creates an edge from the source out port.
7. Fullscreen toggle expands/contracts without losing viewport transform.
8. Import JSON loads graph and preserves node positions.
9. Export JSON downloads current graph state.
10. Delete selected node removes connected edges.
11. Duplicate selected node creates a new node with offset position.
12. Inspector form edit updates selected node data.
13. Context menu commands fire for blank/node/edge.
14. Edge click selects edge and displays edge inspector.
15. Readonly/trace mode blocks drag, connect, delete, and palette add.

## Architecture Gaps For Full Demo Parity

- Add a `FlowInteractionController` so pan/zoom/link drag/node drag are isolated from render logic.
- Add a `FlowSelectionController` for single/multi select, lasso, and keyboard shortcuts.
- Add `FlowHistory` coverage to all mutating commands, not only local snapshots.
- Add a registry/dialog API for provider/action/trigger/skill selection.
- Add edge/node hover tools and insert-node-between-edge workflow.
- Add a layout adapter for directed graph layout, with local simple layout as fallback.
- Decide whether to license/use JointJS+ or keep implementing local equivalents on `@joint/core`.
