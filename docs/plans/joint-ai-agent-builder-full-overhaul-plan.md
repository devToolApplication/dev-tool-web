---
title: joint-ai-agent-builder-full-overhaul-plan
type: note
permalink: dev-tool-web/docs/plans/joint-ai-agent-builder-full-overhaul-plan
---

# Joint AI Agent Builder Full Overhaul Plan

## Meta

- **Feature:** Shared Flow Builder / Rule Config Flow / AI Agent Workflow Canvas
- **Role:** Architect Role
- **Date:** 2026-05-31
- **Reference demo:** `https://github.com/clientIO/joint-demos/tree/main/ai-agent-builder`
- **Status:** Proposed

---

## 1. Problem Statement

Màn hình rule config vẫn lỗi: node thật có trong diagram/minimap nhưng main canvas chỉ thấy nút `+` hoặc node cực nhỏ/góc canvas. Các lần fix nhỏ đang xử lý triệu chứng quanh:

- `foreignObject` HTML rendering.
- `ContentChildren` Angular template mount timing.
- Manual viewport fit/pan/zoom.
- Custom minimap tự tính scale/bounds.

Demo `joint-demos/ai-agent-builder` không đi theo hướng này. Demo xây một diagram runtime ổn định bằng JointJS model/view thuần:

- Node là SVG custom shape, không phải Angular template trong `foreignObject`.
- Paper được bọc bởi PaperScroller để zoom/pan/fit/scroll.
- Minimap dùng Navigator render từ chính PaperScroller/model.
- Data graph riêng sync sang JointJS graph bằng builder.
- Add button/placeholder/edge insert là JointJS cell/tool, không phải DOM overlay.
- Inspector/registry/dialog là UI layer tách khỏi graph.

Vì vậy plan này đề xuất override lại toàn bộ `flow-builder` theo architecture của demo, thay vì tiếp tục vá `foreignObject` và custom viewport math.

---

## 2. Scope

### In scope

- Shared `app-flow-builder`.
- Rule Config flow screen.
- AI Agent Workflow canvas screen.
- Flow engine, graph data, layout, node/edge shapes, navigator, toolbar, selection, context actions.
- Test suite cho canvas UI interactions.

### Out of scope

- Backend schema/API migration.
- Rule expression runtime logic.
- AI agent runtime execution behavior.
- Exact visual assets/private JointJS+ theme copy nếu chưa có license/approval.

---

## 3. Demo Feature Inventory

### 3.1 Core App Runtime

Demo `App` extends `Diagram` and owns:

- `dia.Graph`
- `dia.Paper`
- `dia.CommandManager`
- `ui.PaperScroller`
- `ui.Selection`
- `ui.Toolbar`
- custom `Navigator`
- `ui.Keyboard`
- `ui.Tooltip`
- controllers list
- file drop JSON import
- state map

### 3.2 Controllers

Demo tách controller theo responsibility:

| Controller            | Responsibility                                                           |
| --------------------- | ------------------------------------------------------------------------ |
| `SystemController`    | Sync data model changes to graph build.                                  |
| `DiagramController`   | Paper/node/link interactions, pan, context menu, hover tools, file drop. |
| `ToolbarController`   | Save/load/new/test/publish toolbar actions.                              |
| `KeyboardController`  | Undo/redo/delete/shortcuts.                                              |
| `NodesController`     | Node-specific mutation and provider refresh.                             |
| `SelectionController` | Selection to inspector sync.                                             |

### 3.3 Diagram Data And Builder

Demo keeps a logical JSON model separate from JointJS cells:

- `DiagramData` stores node data and `to` edges.
- `buildDiagram()` rebuilds/syncs JointJS graph from logical data.
- Builder creates:
  - domain nodes
  - edges
  - placeholder nodes
  - plus button cells
  - button guide lines
- Layout is run after graph sync.
- `growthLimit` decides whether a node can show an add button.

### 3.4 Node Types

Demo shapes:

- `Trigger`
- `Agent`
- `Action`
- `Condition`
- `Note`
- `Placeholder`
- `Button`
- `Edge`
- `ButtonLine`

Important design point: all are SVG shapes/models, not external HTML templates.

### 3.5 Interaction Features

- Blank drag pans canvas.
- Pinch/wheel zoom through PaperScroller.
- Shift-drag selection region.
- Node click selects node.
- Link click selects edge.
- Node hover adds contextual menu tool.
- Edge hover adds insert-node tool.
- Button click opens add-node menu.
- Placeholder click opens replace menu.
- Paper right-click creates note.
- Node double-click opens note editor or provider registry.
- Trigger/action unconfigured click opens provider picker.
- Agent add/remove skill action updates node data.
- Undo/redo through CommandManager.
- File drop loads JSON.

### 3.6 Navigator

Demo custom Navigator wraps JointJS+ `ui.Navigator` and a toolbar:

- fullscreen toggle
- fit-to-screen
- zoom slider
- minimap toggle
- minimap uses real graph model geometry
- cell visibility filters out system buttons/placeholders from minimap
- simplified node view for minimap

### 3.7 Inspector And Registry

- Selection controller opens inspector for one selected model.
- Inspector config comes from selected model.
- Trigger/action provider registry opens as searchable stencil dialog.
- Agent skill selection reuses action registry.

---

## 4. Current Codebase Gap Analysis

### 4.1 Current Shared Flow Builder

Current `flow-builder` responsibilities are mixed:

- Angular component manages toolbar, palette, inspector, history, selection.
- `JointFlowEngine` manages graph, paper, pan/zoom, viewport math, link drag, foreignObject mount.
- `FlowNavigatorComponent` calculates minimap scale manually.
- Add buttons are DOM overlay positioned from viewport snapshots.
- HTML node rendering depends on Angular templates mounted into SVG `foreignObject`.

### 4.2 Main Failure Mode

The bug screenshot indicates:

- Logical data exists.
- Minimap can render nodes.
- Add button exists.
- Main node visuals are missing or too small/out of viewport.

This points to unstable coupling between:

- viewport fit state,
- node rendering lifecycle,
- foreignObject template mount,
- minimap/main canvas coordinate math,
- add button DOM overlay.

### 4.3 Key Constraint

Demo depends on `@joint/plus` and `@joint/layout-directed-graph`. Current project has only `@joint/core`.

Therefore exact port has a licensing/package decision. Without `@joint/plus`, we must implement replacements for PaperScroller, Navigator, Toolbar, Selection, Inspector, ContextToolbar, Stencil, and CommandManager behavior.

---

## 5. Architecture Options

## Option A: Exact JointJS+ Port

### Description

Add `@joint/plus` and `@joint/layout-directed-graph`, then port demo architecture almost 1:1 into Angular shared `flow-builder`.

### Pros

- Closest to official demo.
- Most stable pan/zoom/navigator/selection behavior.
- Less custom viewport/minimap math.
- PaperScroller/Navigator/Selection/Toolbar are battle-tested.
- Easier to match demo UI/UX precisely.

### Cons

- Requires JointJS+ license/token and private registry setup.
- Adds commercial dependency to dev/build/CI.
- Existing wrapper rule still requires Angular adapter boundaries.
- Heavier migration; must verify license compliance.

### When to choose

Choose this if exact demo parity is required and license is available.

---

## Option B: Core-only Rebuild Following Demo Architecture

### Description

Keep `@joint/core`, but rewrite local flow builder to mimic demo architecture:

- Remove `foreignObject` node rendering from canvas.
- Use SVG-only custom JointJS elements.
- Implement lightweight local equivalents for:
  - PaperScroller behavior
  - Navigator/minimap
  - Command history
  - Selection
  - Context menu
  - Insert-node tools
  - Registry dialog using app shared UI
  - Inspector using existing `form-input`

### Pros

- No new commercial dependency.
- Keeps project dependency footprint stable.
- Can fully obey `app-* shared wrapper` rule.
- More control over dark theme and trade-bot-specific behavior.
- Avoids `foreignObject` browser/rendering edge cases.

### Cons

- More code to maintain.
- Must build robust tests for pan/zoom/minimap/link creation.
- Not 100% demo parity unless we replicate all interactions.

### When to choose

Choose this if license is unavailable or we want a stable internal shared component without private registry.

---

## Recommendation

Recommended path: **Option B now, Option A only if user confirms JointJS+ license/token is available and exact visual parity is mandatory.**

Reason:

- Current production project already uses `@joint/core`.
- User feedback specifically says current canvas is unstable; the root architectural fix is to remove HTML `foreignObject`/Angular-template rendering from canvas.
- Existing project memory requires `app-*` shared wrappers and no cross-child CSS overrides.
- Core-only rewrite can still follow demo's stable architecture: data model → graph builder → SVG shapes → Paper runtime → Angular shell.

Breaking decision to confirm before implementation:

- Should we add `@joint/plus` license dependency?
- If no, implement core-only equivalent.

---

## 6. Target Architecture

```text
app-flow-builder
├── FlowBuilderShellComponent
│   ├── app-flow-toolbar
│   ├── app-flow-palette / app-flow-registry
│   ├── app-flow-canvas
│   │   └── FlowRuntimeFacade
│   │       ├── FlowDiagramData
│   │       ├── FlowGraphBuilder
│   │       ├── FlowPaperController
│   │       ├── FlowSelectionController
│   │       ├── FlowKeyboardController
│   │       ├── FlowToolController
│   │       ├── FlowViewportController
│   │       └── FlowHistoryController
│   ├── app-flow-navigator
│   └── app-flow-inspector-form-panel
└── Domain adapters
    ├── RuleFlowAdapter
    └── AiAgentWorkflowFlowAdapter
```

### Dependency Direction

```text
Feature screen
  -> Shared FlowBuilder API
    -> Flow runtime controllers
      -> JointJS core
```

No feature should touch JointJS directly.

---

## 7. Mandatory Design Decisions

### D1. Canvas nodes must be SVG-only

Remove `foreignObject` as the default node rendering path.

- `shape: 'html'` becomes deprecated.
- Node UI is rendered by custom JointJS element classes.
- Parent controls appearance through `FlowNodeTypeDefinition.renderer`/`shapeKind`, not Angular templates.
- For advanced customization, parent passes a structured node view schema, not arbitrary Angular DOM.

Rationale: stable rendering, hit testing, minimap, port drag, scaling, and layout.

### D2. Add button must be a JointJS cell/tool

Remove DOM overlay add buttons.

- Use `FlowButtonElement` + `FlowButtonLine`.
- Or use link/element tools.
- Button position is graph geometry, not CSS transform.

Rationale: add button scales/moves with paper and appears in correct coordinate system.

### D3. Minimap must read graph geometry, not app data fallback

- Navigator should use same graph bbox/node positions emitted by runtime.
- Exclude system buttons/placeholders from minimap.
- Use simplified minimap rendering.

Rationale: current minimap diverges from main canvas.

### D4. Viewport logic must be centralized

One controller owns:

- fit
- zoom
- pan
- resize
- wheel
- pinch
- min/max scale
- preserve center

No separate component should calculate canvas transforms.

### D5. Inspector remains Angular/shared form-input

- Do not port `ui.Inspector` directly unless Option A is selected.
- Keep `app-flow-inspector-form-panel` using existing `FormConfig`.
- Selected node/edge provides inspector config.

Rationale: obey shared UI rule and reuse form-input.

### D6. Domain data remains stable

- `FlowDefinition` remains public API.
- Runtime can internally transform to tree/graph data.
- Existing rule/agent backend contracts should not change.

---

## 8. Target Feature Parity Checklist

### Canvas Core

- [ ] Render SVG nodes.
- [ ] Render SVG edges.
- [ ] Dot grid.
- [ ] Pan by dragging blank canvas.
- [ ] Wheel zoom at pointer.
- [ ] Fit to screen.
- [ ] Preserve center on resize.
- [ ] Min/max zoom.
- [ ] Fullscreen.
- [ ] Auto layout.
- [ ] Import/export JSON.

### Node Interaction

- [ ] Click select node.
- [ ] Multi-select via ctrl/meta.
- [ ] Shift-drag selection region.
- [ ] Drag node.
- [ ] Delete selected node.
- [ ] Duplicate selected node.
- [ ] Hover node menu tool.
- [ ] Node context menu.
- [ ] Double-click action hook.
- [ ] Disabled/read-only node behavior.

### Edge Interaction

- [ ] Drag from output port to input port.
- [ ] Validate target port.
- [ ] Reject cycles/self links if configured.
- [ ] Click select edge.
- [ ] Hover insert-node tool.
- [ ] Edge context menu.
- [ ] Edge label render.
- [ ] Edge label/condition edit in inspector.
- [ ] Delete selected edge.

### Add/Insert Flow

- [ ] Add node from palette.
- [ ] Add child from plus button under node.
- [ ] Replace placeholder with node.
- [ ] Insert node on edge.
- [ ] Connect from button to existing node.
- [ ] Respect node growth limit.

### Navigator

- [ ] Minimap shows only real nodes/edges.
- [ ] Minimap viewport matches current visible bounds.
- [ ] Click/drag viewport pans main canvas.
- [ ] Fit button.
- [ ] Zoom controls or slider.
- [ ] Minimap toggle.
- [ ] Fullscreen toggle state sync.

### Inspector

- [ ] Empty state.
- [ ] Node form from `inspectorForm`.
- [ ] Edge form.
- [ ] Form validation.
- [ ] Field visibility logic.
- [ ] Emits patches to `FlowDefinition`.

### Domain Screens

- [ ] Rule Config:
  - group/condition/rule-ref/not node shapes
  - operator and operand summary visible on node
  - selected condition inspector form works
  - initial edit route displays existing graph centered
  - create route starts with visible root or empty state by design
- [ ] AI Agent Workflow:
  - trigger/agent/action/condition/review/end node shapes
  - validate/publish/autosave retained
  - edge condition edit retained
  - model/action registry retained or replaced by shared registry drawer/dialog

---

## 9. Proposed File Structure

```text
src/app/shared/ui/flow-builder/
├── components/
│   ├── flow-builder/
│   ├── flow-canvas/
│   ├── flow-toolbar/
│   ├── flow-palette/
│   ├── flow-navigator/
│   ├── flow-inspector/
│   └── flow-registry-dialog/
├── core/
│   ├── flow-diagram-data.ts
│   ├── flow-history.ts
│   ├── flow-serialization.ts
│   └── flow-validation.ts
├── runtime/
│   ├── flow-runtime-facade.ts
│   ├── controllers/
│   │   ├── flow-paper.controller.ts
│   │   ├── flow-viewport.controller.ts
│   │   ├── flow-selection.controller.ts
│   │   ├── flow-keyboard.controller.ts
│   │   ├── flow-tools.controller.ts
│   │   ├── flow-history.controller.ts
│   │   └── flow-sync.controller.ts
│   ├── graph/
│   │   ├── flow-graph-builder.ts
│   │   ├── flow-layout.ts
│   │   ├── flow-cell-factory.ts
│   │   └── flow-cell-namespace.ts
│   ├── models/
│   │   ├── flow-node.element.ts
│   │   ├── flow-action-node.element.ts
│   │   ├── flow-condition-node.element.ts
│   │   ├── flow-placeholder.element.ts
│   │   ├── flow-button.element.ts
│   │   ├── flow-button-line.link.ts
│   │   └── flow-edge.link.ts
│   ├── tools/
│   │   ├── flow-menu.tool.ts
│   │   ├── flow-insert-node.tool.ts
│   │   └── flow-resize.tool.ts
│   └── navigator/
│       ├── flow-minimap-renderer.ts
│       └── flow-minimap-geometry.ts
├── models/
└── directives/
```

---

## 10. Migration Phases

## Phase 0: Lock Regression Baseline

Goal: create failing tests that reproduce current bug before rewriting.

Tasks:

1. Add Storybook story `RuleConfigExistingGraphRegression`.
2. Story data must mimic screenshot:
   - selected condition node
   - at least 2 nodes
   - one edge
   - inspector open
   - navigator open
3. Add Playwright tests:
   - canvas contains visible real node with width > 80 and height > 40
   - visible node is not at top-left corner
   - plus button position is within 40px below source node
   - minimap viewport matches main visible bounds
   - wheel zoom changes node bbox
   - blank drag pan moves node bbox
   - port drag creates edge
4. Mark tests red against current implementation.

Exit criteria:

- Repro test fails before rewrite.
- Test name clearly describes bug.

## Phase 1: Introduce Runtime Facade

Goal: create new runtime beside old engine without breaking consumers.

Tasks:

1. Add `FlowRuntimeFacade`.
2. Add controller interfaces:
   - `start()`
   - `stop()`
   - `render(definition, nodeTypes, edgeTypes)`
   - `fit()`
   - `zoomIn()`
   - `zoomOut()`
   - `panTo()`
   - `select()`
3. Move `JointFlowEngine` responsibilities into controllers, initially delegating to old implementation.
4. Add unit tests for facade lifecycle.

Exit criteria:

- No behavior change.
- Build passes.

## Phase 2: Replace Node Rendering With SVG Custom Elements

Goal: remove `foreignObject` dependency.

Tasks:

1. Add base `FlowNodeElement`.
2. Add SVG markup for:
   - card node
   - condition/diamond node
   - compact/rule node
   - placeholder node
3. Add domain-specific renderers:
   - `RuleGroupElement`
   - `RuleConditionElement`
   - `RuleRefElement`
   - `RuleNotElement`
   - `AiAgentStepElement`
   - `LogicStepElement`
   - `ReviewStepElement`
   - `EndStepElement`
4. Replace `shape: 'html'` handling.
5. Keep Angular `appFlowNodeTemplate` only as deprecated fallback for non-critical stories, not production route.
6. Delete or isolate `joint-flow-html-shape.ts`.

Exit criteria:

- Main canvas node render uses SVG only.
- Rule config node visible with real text.
- No `foreignObject` in production rule/agent node types.

## Phase 3: Graph Builder With Buttons And Placeholders

Goal: follow demo builder pattern.

Tasks:

1. Add internal `FlowDiagramData`.
2. Add `FlowGraphBuilder`.
3. Builder inputs:
   - `FlowDefinition`
   - `FlowNodeTypeDefinition[]`
   - capabilities
4. Builder outputs graph cells:
   - actual nodes
   - actual edges
   - plus button cells
   - button guide lines
   - placeholder cells where edge target missing or add slot empty
5. Add `growthLimit` support to `FlowNodeTypeDefinition`.
6. Move current DOM add button logic into JointJS `FlowButtonElement`.
7. Implement button click menu with Angular context menu component positioned from `paper.localToClientPoint()`.

Exit criteria:

- Plus button is part of graph coordinate system.
- Plus button never desyncs from source node during pan/zoom/resize.

## Phase 4: PaperScroller Equivalent

Goal: centralize viewport behavior.

Option B implementation:

1. Add `FlowViewportController`.
2. Keep one state:
   - scale
   - translate
   - client size
   - content bbox
3. Implement:
   - wheel zoom at pointer
   - blank drag pan
   - touch/pinch if needed
   - fit to content
   - preserve center on resize
   - clamp only when appropriate
4. Remove duplicated viewport calculations from components.
5. Emit stable `FlowViewportSnapshot`.

Exit criteria:

- Node never jumps to canvas corner on initial load or resize.
- Playwright viewport tests pass.

## Phase 5: Navigator Rewrite

Goal: make minimap deterministic from graph geometry.

Tasks:

1. `FlowNavigatorComponent` no longer recomputes from stale app data.
2. It receives:
   - graph snapshot from runtime
   - viewport snapshot
   - filtered minimap cells
3. Render simplified SVG/HTML minimap:
   - real nodes only
   - real edges only
   - no buttons/placeholders
4. Implement:
   - viewport rect clamp
   - click to pan
   - drag viewport rect to pan
   - zoom controls
   - fit
   - close/reopen
5. Add unit tests for minimap geometry.

Exit criteria:

- Minimap viewport scale matches main canvas in Playwright.
- No node appears in minimap if main graph does not have corresponding real cell.

## Phase 6: Selection, Tools, Context Menus

Goal: match demo interaction model.

Tasks:

1. Add `FlowSelectionController`.
2. Add ctrl/meta multi-select.
3. Add shift-drag selection region.
4. Add hover tools:
   - node menu tool
   - edge insert tool
   - note resize tool if enabled
5. Add context action API:
   - `onNodeMenu`
   - `onEdgeMenu`
   - `onBlankMenu`
6. Render menus with app shared overlay/menu component, not JointJS+ `ContextToolbar` unless Option A.

Exit criteria:

- Node/edge hover tools appear consistently.
- Menu position stays correct after zoom/pan.

## Phase 7: Link Creation Rewrite

Goal: fix drag dây regression permanently.

Tasks:

1. Use native magnet ports for standard drag connect.
2. Add programmatic connection from plus/button using demo pattern.
3. Add validation pipeline:
   - source exists
   - target exists
   - source port group is out
   - target port group is in
   - no self link unless enabled
   - no duplicate edge unless enabled
   - no cycle if domain requires tree
4. Remove temporary link after `onConnect` emits.
5. Add highlighter for valid/invalid targets.

Exit criteria:

- Port drag creates edge in rule and AI agent story.
- Cancel with Escape/right-click clears temporary state.
- No lingering `joint-link-dragging` class.

## Phase 8: Inspector And Registry

Goal: keep Angular shared UI while matching demo workflows.

Tasks:

1. Keep `app-flow-inspector-form-panel`.
2. Add edge inspector form.
3. Add registry dialog/drawer:
   - searchable provider/action list
   - grouped results
   - disabled selected item
   - icon support
4. Rule config uses inspector form only.
5. AI agent workflow uses registry for trigger/action/skill selection.

Exit criteria:

- Selecting node updates inspector.
- Changing inspector field updates node and canvas label.
- Selecting edge opens edge editor.

## Phase 9: Domain Adapters

### Rule Flow

Tasks:

1. Update `rule-flow-node-catalog.ts` to use SVG shape kinds.
2. Remove projected node templates from `rule-config-form.component.html`.
3. Node labels:
   - group: `AND/OR/XOR`
   - condition: operator + left/right operand summary
   - rule-ref: rule code
   - not: NOT + child summary
4. Keep form-input inspector config.
5. Add rule-specific connection validation:
   - condition/ref cannot have children
   - NOT max 1 child
   - group can have many children
   - prevent cycles

### AI Agent Workflow

Tasks:

1. Update workflow adapter to target new runtime.
2. Node shapes:
   - trigger
   - agent
   - action/tool
   - condition/branch
   - review
   - end
3. Preserve:
   - autosave
   - validate
   - publish
   - edge conditions
   - workflow JSON adapter

Exit criteria:

- Both screens use same shared runtime.
- No feature-level JointJS access.

## Phase 10: Cleanup Old Architecture

Tasks:

1. Remove/disable:
   - `FlowNodeOverlayHost`
   - `foreignObject` production path
   - DOM add button layer
   - manual fallback minimap path
2. Keep deprecated compatibility only if needed for older stories.
3. Delete dead CSS selectors.
4. Update docs.

Exit criteria:

- No production route uses `shape: 'html'`.
- No component uses `ng-host`, `::ng-deep`, or cross-child CSS override.

---

## 11. Detailed Test Plan

## Unit Tests

### FlowGraphBuilder

- builds nodes and edges from `FlowDefinition`
- creates button cells only when `growthLimit` allows
- creates placeholders for empty child slot
- excludes buttons/placeholders from minimap snapshot
- preserves node positions when provided
- layouts unpositioned nodes
- updates graph without duplicate cells

### FlowViewportController

- fit content centers single node
- fit content handles multiple nodes
- resize preserves local center
- wheel zoom keeps pointer local coordinate stable
- clamp does not force content to top-left
- blank pan updates translate

### FlowNavigator Geometry

- maps graph bbox to minimap rect
- maps viewport rect to minimap rect
- clamps viewport rect visually but emits correct pan target
- handles single-node graph
- handles large graph
- handles zoomed-in viewport bigger/smaller than content bounds

### FlowConnectionController

- accepts valid out-to-in
- rejects in-to-in
- rejects out-to-out
- rejects self link
- rejects duplicate edge if disabled
- rejects cycle if tree mode
- emits normalized `FlowConnectEvent`
- clears temporary link after connect/cancel

### FlowHistoryController

- undo add node
- redo add node
- undo move node
- undo inspector update
- batch import as one history item

## Playwright / Storybook Tests

### Rule Config Existing Graph Regression

- edit route graph appears centered
- selected condition node visible in main canvas
- node label text visible
- minimap shows same node count as real graph
- plus button below group node
- inspector remains visible

### Rule Config Interaction

- add group from palette
- add condition via plus button
- drag dây from group to condition
- select condition, change operator
- condition node label updates
- delete node removes edge
- undo/redo works
- wheel zoom changes bbox
- blank drag pan changes bbox
- fullscreen enter/exit works

### AI Agent Workflow

- load existing workflow
- drag node
- connect branch to end
- insert node on edge
- edit edge condition
- open registry dialog
- select provider/action
- autosave emits updated graph
- validate and publish buttons remain available

### Navigator

- navigator close/reopen
- fit from navigator centers graph
- drag viewport rect pans canvas
- zoom controls update main canvas
- minimap excludes buttons/placeholders

---

## 12. Acceptance Criteria

- Existing rule edit screen never opens with only `+` visible.
- Existing graph initial render displays at least one real node in main canvas within visible viewport.
- No production node depends on Angular template mounted into `foreignObject`.
- Drag dây works from source output to target input.
- Mouse wheel zoom and blank drag pan work.
- Resize does not move graph to top-left corner.
- Minimap viewport ratio is correct against main visible bounds.
- Plus/add button moves with source node under all zoom/pan states.
- Rule config and AI agent workflow both use shared flow runtime.
- `npm run build` passes.
- Storybook build passes.
- Playwright regression suite passes.

---

## 13. Implementation Order For Dev FE

1. Write failing regression tests first.
2. Build runtime facade and controller skeleton.
3. Implement SVG node shapes.
4. Switch rule-flow node catalog away from `shape: 'html'`.
5. Implement graph builder with button cells.
6. Replace DOM add buttons.
7. Rewrite viewport controller.
8. Rewrite navigator geometry.
9. Rewrite connection controller.
10. Port inspector/registry workflows.
11. Migrate AI Agent Workflow adapter.
12. Remove old `foreignObject`/overlay code.
13. Run full verification.

---

## 14. Files Likely Affected

### Shared Flow Builder

- `src/app/shared/ui/flow-builder/components/flow-builder/*`
- `src/app/shared/ui/flow-builder/components/flow-canvas/*`
- `src/app/shared/ui/flow-builder/components/flow-navigator/*`
- `src/app/shared/ui/flow-builder/components/flow-palette/*`
- `src/app/shared/ui/flow-builder/components/flow-inspector/*`
- `src/app/shared/ui/flow-builder/joint/*`
- `src/app/shared/ui/flow-builder/models/*`
- `src/app/shared/ui/flow-builder/core/*`
- new `src/app/shared/ui/flow-builder/runtime/*`

### Rule Config

- `src/app/features/admin/trade-bot-management/share/rule-flow/rule-flow-node-catalog.ts`
- `src/app/features/admin/trade-bot-management/pages/rule-config/form/rule-config-form.component.html`
- `src/app/features/admin/trade-bot-management/pages/rule-config/form/rule-config-form.component.ts`
- `src/app/features/admin/trade-bot-management/pages/rule-config/form/rule-config-form.component.css`

### AI Agent Workflow

- `src/app/features/admin/system-management/ai-agent-workflow-builder/canvas/*`

### Tests

- `e2e/flow-builder-story.spec.ts`
- `e2e/rule-config-flow.spec.ts`
- `e2e/ai-agent-workflow-canvas-story.spec.ts`
- new runtime unit specs under `src/app/shared/ui/flow-builder/runtime/**/*.spec.ts`

---

## 15. Risks And Mitigations

| Risk                                         | Impact                            | Mitigation                                                                     |
| -------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------ |
| JointJS+ license unavailable                 | Cannot exact-port demo UI widgets | Use Option B core-only architecture.                                           |
| Core-only viewport math repeats current bugs | High                              | Centralize viewport controller and cover with tests before UI wiring.          |
| SVG-only nodes reduce template flexibility   | Medium                            | Add structured renderer/schema API; keep Angular template only outside canvas. |
| Rewrite touches shared component consumers   | High                              | Keep `FlowDefinition` and Input/Output contracts stable.                       |
| Existing dirty worktree                      | Medium                            | Do not revert unrelated files; isolate commits by file scope.                  |
| Dark theme mismatch                          | Medium                            | Use existing app tokens; no cross-child CSS overrides.                         |
| Rule and AI workflow needs differ            | Medium                            | Domain adapters convert into common runtime model.                             |

---

## 16. Open Questions

1. Có JointJS+ license/token không?
2. Mức độ “giống hệt demo” cần đến đâu:
   - interaction architecture giống
   - visual gần giống
   - hay exact UI pixel-level?
3. Rule config có bắt buộc parent truyền Angular node template nữa không, hay chấp nhận node schema/SVG renderer?
4. Có cần giữ backward compatibility cho stories/components đang dùng `shape: 'html'` không?
5. Có cần triển khai provider registry cho rule-flow không, hay chỉ AI agent workflow?

---

## 17. Recommended Decision

Nếu chưa có JointJS+ license: **chốt Option B** và bắt đầu từ Phase 0 test regression + Phase 2 SVG-only node rendering cho rule config trước. Đây là đường ngắn nhất để dứt lỗi “chỉ thấy dấu +” vì loại bỏ hoàn toàn `foreignObject`/Angular template timing khỏi production canvas.

Nếu có JointJS+ license: **chốt Option A**, port `PaperScroller`, `Navigator`, `Selection`, `Toolbar`, `CommandManager` để giảm lượng custom code và match demo nhanh hơn.
