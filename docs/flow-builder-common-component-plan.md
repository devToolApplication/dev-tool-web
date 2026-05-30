---
title: flow-builder-common-component-plan
type: note
permalink: dev-tool-web/docs/flow-builder-common-component-plan
---

# Implementation Plan: Common Flow Builder Component

## 1. Context

This document defines the implementation plan for a reusable flow-builder UI in `dev-tool-web`.
The target UX is inspired by the JointJS AI Agent Builder demo:

- Source: `https://github.com/clientIO/joint-demos/tree/2863a32d099e459e9182399e95fb261517ca4ee7/ai-agent-builder`
- Relevant ideas from the template: full canvas workspace, custom nodes, edge tools, toolbar, inspector, minimap, history, selection, keyboard controls, layout, and serialization.

The implementation must fit the local project architecture:

- Angular 21.
- Signals for local state.
- JointJS 4 via `@joint/core`.
- Shared UI rule: all feature/page templates must use `app-*` wrappers.
- Third-party UI components must not be used directly outside wrapper components.
- One primary focus per page: the first viewport must focus on the canvas, with toolbar/inspector demoted to supporting controls.

## 2. Objective

Build a reusable common component named `app-flow-builder` that can be used by multiple domains:

- Trade Bot rule expression editor.
- Trade Bot rule trace viewer.
- Future AI agent workflow builder.
- Future system/job/data pipeline diagrams.

The common component must not contain Trade Bot business logic. Domain-specific mapping must live in feature-level adapters.

## 3. Current State

Current local implementation:

- `src/app/shared/ui/joint-diagram/Diagram.ts`
- `src/app/shared/ui/joint-diagram/views/joint-diagram.component.ts`
- `src/app/shared/ui/joint-diagram/models/Node.ts`
- `src/app/shared/ui/joint-diagram/models/Edge.ts`

Current limitations:

- Canvas wrapper only.
- No production data binding from `ruleExpression` to graph.
- No reusable flow contract.
- No toolbar, inspector, minimap, history, keyboard controller, context menu, or domain adapter.
- Storybook has sample node classes, but those are not production reusable shapes.

## 4. Non-Goals

Do not implement these in the first release unless explicitly approved:

- Backend changes.
- Database schema changes.
- Replacing the existing tree rule editor.
- Full copy of `@joint/plus` UI widgets.
- Direct dependency on `@joint/plus` unless license and package access are confirmed.
- Domain-specific Trade Bot rules inside `shared/ui/flow-builder`.

## 5. Architecture Decision

### 5.1 Recommended Approach

Create a generic `shared/ui/flow-builder` module backed by JointJS Core.

The common component owns:

- Canvas lifecycle.
- JointJS graph/paper rendering.
- Selection state.
- History state.
- Pan/zoom/fit behavior.
- Node/edge rendering bridge.
- Toolbar shell.
- Inspector shell.
- Minimap shell.
- Validation display.
- Serialization contract.

The parent/domain owns:

- Node type catalog.
- Node templates.
- Inspector templates.
- Domain validation rules.
- Domain conversion to/from `FlowDefinition`.
- Save/load/run behavior.

### 5.2 Why Not Copy Template Directly

The reference demo uses `@joint/plus` and JointJS UI widgets. The local app currently uses `@joint/core`, and local UI rules require `app-*` wrappers. Copying the demo would introduce:

- UI contract violations.
- Licensing/package uncertainty.
- Tight coupling to the demo's AI Agent domain.
- Harder reuse for Trade Bot and other modules.

The correct approach is to reproduce the interaction model and visual hierarchy, not copy implementation one-to-one.

## 6. Module Boundary

### 6.1 Shared Module

Path:

```text
src/app/shared/ui/flow-builder/
```

Responsibilities:

- Generic flow editor/viewer.
- Generic data models.
- Generic rendering engine wrapper around JointJS.
- Generic toolbar/inspector/minimap components.
- Generic command/event contracts.
- Generic serialization and validation display.

Must not import:

- Trade Bot models.
- Trade Bot services.
- Feature routes/pages.
- Backend API clients.

### 6.2 Trade Bot Feature Adapter

Path:

```text
src/app/features/admin/trade-bot-management/share/rule-flow/
```

Responsibilities:

- Convert `RuleLogicFormValue` to `FlowDefinition`.
- Convert `FlowDefinition` back to `RuleLogicFormValue`.
- Define Trade Bot node catalog.
- Define Trade Bot node templates.
- Define Trade Bot inspector templates.
- Render trace metadata such as `passed`, `value`, and `message`.

Must not:

- Access JointJS directly.
- Mutate `app-flow-builder` internal state directly.
- Use third-party UI components directly.

## 7. Proposed File Structure

```text
src/app/shared/ui/flow-builder/
  index.ts

  models/
    flow-definition.model.ts
    flow-node.model.ts
    flow-edge.model.ts
    flow-port.model.ts
    flow-template.model.ts
    flow-command.model.ts
    flow-selection.model.ts
    flow-inspector.model.ts
    flow-toolbar.model.ts
    flow-validation.model.ts
    flow-history.model.ts

  directives/
    flow-node-template.directive.ts
    flow-edge-template.directive.ts
    flow-inspector-template.directive.ts
    flow-toolbar-template.directive.ts

  components/
    flow-builder/
      flow-builder.component.ts
      flow-builder.component.html
      flow-builder.component.css
      flow-builder.component.spec.ts

    flow-canvas/
      flow-canvas.component.ts
      flow-canvas.component.html
      flow-canvas.component.css
      flow-canvas.component.spec.ts

    flow-toolbar/
      flow-toolbar.component.ts
      flow-toolbar.component.html
      flow-toolbar.component.css
      flow-toolbar.component.spec.ts

    flow-inspector/
      flow-inspector.component.ts
      flow-inspector.component.html
      flow-inspector.component.css
      flow-inspector.component.spec.ts

    flow-navigator/
      flow-navigator.component.ts
      flow-navigator.component.html
      flow-navigator.component.css
      flow-navigator.component.spec.ts

    flow-empty-state/
      flow-empty-state.component.ts
      flow-empty-state.component.html
      flow-empty-state.component.css

  joint/
    joint-flow-engine.ts
    joint-flow-renderer.ts
    joint-flow-paper-options.ts
    joint-flow-layout.ts
    joint-flow-selection.ts
    joint-flow-history.ts
    joint-flow-ports.ts
    joint-flow-events.ts

  shapes/
    base-flow-node.shape.ts
    rectangular-flow-node.shape.ts
    diamond-flow-node.shape.ts
    capsule-flow-node.shape.ts
    note-flow-node.shape.ts
    placeholder-flow-node.shape.ts
    flow-edge.shape.ts

  services/
    flow-builder-state.service.ts
    flow-command.service.ts
    flow-serialization.service.ts
    flow-validation-display.service.ts
    flow-viewport.service.ts

  utils/
    flow-id.util.ts
    flow-graph.util.ts
    flow-template.util.ts
    flow-layout.util.ts
```

Feature adapter:

```text
src/app/features/admin/trade-bot-management/share/rule-flow/
  rule-flow-adapter.ts
  rule-flow-node-catalog.ts
  rule-flow-node-templates.component.ts
  rule-flow-inspector.component.ts
  rule-flow-trace-adapter.ts
  rule-flow.models.ts
  rule-flow-adapter.spec.ts
```

## 8. Core Data Contracts

### 8.1 FlowDefinition

```ts
export interface FlowDefinition {
  id: string;
  version: 1;
  name?: string;
  readonly?: boolean;
  viewport?: FlowViewportState;
  nodes: FlowNode[];
  edges: FlowEdge[];
  metadata?: Record<string, unknown>;
}
```

Rules:

- `nodes` and `edges` are the only source of graph truth.
- `metadata` is allowed but must not be required for rendering.
- `version` enables future migrations.
- Consumer should treat `FlowDefinition` as immutable.

### 8.2 FlowNode

```ts
export interface FlowNode {
  id: string;
  type: string;
  label?: string;
  position?: FlowPoint;
  size?: FlowSize;
  ports?: FlowPort[];
  data?: Record<string, unknown>;
  status?: FlowStatus;
  readonly?: boolean;
  disabled?: boolean;
  validation?: FlowValidationIssue[];
}
```

Rules:

- `type` maps to `FlowNodeTypeDefinition`.
- `data` belongs to parent/domain.
- Shared component must not interpret `data` except through resolvers provided in catalog.

### 8.3 FlowEdge

```ts
export interface FlowEdge {
  id: string;
  source: FlowEndpoint;
  target: FlowEndpoint;
  label?: string;
  data?: Record<string, unknown>;
  status?: FlowStatus;
  readonly?: boolean;
  disabled?: boolean;
  validation?: FlowValidationIssue[];
}
```

### 8.4 FlowStatus

```ts
export type FlowStatus = 'default' | 'selected' | 'success' | 'warning' | 'danger' | 'muted';
```

Usage:

- `success`: passed trace node.
- `danger`: failed trace node.
- `warning`: validation issue.
- `muted`: disabled node.
- `selected`: current selection.

### 8.5 Node Type Definition

```ts
export interface FlowNodeTypeDefinition {
  type: string;
  label: string;
  description?: string;
  shape: 'rectangle' | 'diamond' | 'capsule' | 'note' | 'placeholder' | 'custom';
  defaultSize: FlowSize;
  minSize?: FlowSize;
  maxSize?: FlowSize;
  ports: FlowPortDefinition[];
  icon?: string;
  tone?: FlowNodeTone;
  allowMove?: boolean;
  allowDelete?: boolean;
  allowResize?: boolean;
  allowConnectFrom?: boolean;
  allowConnectTo?: boolean;
  maxIncoming?: number;
  maxOutgoing?: number;
  labelResolver?: FlowNodeLabelResolver;
  subtitleResolver?: FlowNodeLabelResolver;
  badgeResolver?: FlowNodeBadgeResolver;
  inspector?: FlowInspectorSchema;
}
```

### 8.6 Template Strategy

Support both config-based rendering and parent-provided Angular templates.

Config-based rendering:

```ts
const nodeCatalog: FlowNodeTypeDefinition[] = [
  {
    type: 'condition',
    label: 'Condition',
    shape: 'diamond',
    defaultSize: { width: 180, height: 64 },
    ports: [
      { id: 'in', group: 'in', position: 'top' },
      { id: 'out', group: 'out', position: 'bottom' }
    ],
    labelResolver: (node) => String(node.data?.['operator'] ?? 'Condition')
  }
];
```

Template projection:

```html
<app-flow-builder [value]="flowDefinition()" [nodeTypes]="nodeTypes">
  <ng-template appFlowNodeTemplate="condition" let-node let-selected="selected">
    <div class="rule-flow-node rule-flow-node--condition" [class.is-selected]="selected">
      <span>{{ node.data.operator }}</span>
      <small>{{ node.data.summary }}</small>
    </div>
  </ng-template>

  <ng-template appFlowInspectorTemplate="condition" let-node>
    <app-rule-flow-condition-inspector
      [node]="node"
      (nodeChange)="onNodeChange($event)"
    ></app-rule-flow-condition-inspector>
  </ng-template>
</app-flow-builder>
```

Important implementation note:

- Rich Angular templates should be rendered as HTML overlay nodes or `foreignObject`.
- SVG-native config rendering should be the default for performance and stability.
- The common component must hide this implementation detail from consumers.

## 9. Public Component API

### 9.1 Inputs

```ts
@Input() value: FlowDefinition | null = null;
@Input() mode: FlowBuilderMode = 'edit';
@Input() nodeTypes: FlowNodeTypeDefinition[] = [];
@Input() edgeTypes: FlowEdgeTypeDefinition[] = [];
@Input() toolbar: FlowToolbarConfig = defaultToolbarConfig;
@Input() inspector: FlowInspectorConfig = defaultInspectorConfig;
@Input() validationIssues: FlowValidationIssue[] = [];
@Input() selectedId: string | null = null;
@Input() autoLayout = false;
@Input() fitOnLoad = true;
@Input() readonly = false;
```

### 9.2 Outputs

```ts
@Output() valueChange = new EventEmitter<FlowDefinition>();
@Output() selectedIdChange = new EventEmitter<string | null>();
@Output() nodeClick = new EventEmitter<FlowNode>();
@Output() edgeClick = new EventEmitter<FlowEdge>();
@Output() blankClick = new EventEmitter<void>();
@Output() nodeChange = new EventEmitter<FlowNodeChange>();
@Output() edgeChange = new EventEmitter<FlowEdgeChange>();
@Output() connect = new EventEmitter<FlowConnectEvent>();
@Output() command = new EventEmitter<FlowCommandEvent>();
@Output() validationChange = new EventEmitter<FlowValidationIssue[]>();
```

### 9.3 Modes

```ts
export type FlowBuilderMode = 'edit' | 'readonly' | 'trace';
```

Mode behavior:

- `edit`: all configured editing actions enabled.
- `readonly`: no move/connect/delete/edit, selection still allowed.
- `trace`: readonly plus pass/fail/value/status visualization.

## 10. UI Layout

### 10.1 Desktop Layout

```text
+--------------------------------------------------------------------------------+
| Flow Builder                                                                    |
|                                                                                |
|  +----------------------+                                                       |
|  | Toolbar              |                                                       |
|  +----------------------+                                                       |
|                                                                                |
|  +----------------------------------------------------------+ +---------------+ |
|  | Canvas                                                   | | Inspector     | |
|  |                                                          | |               | |
|  |   Nodes / edges                                          | | selected node | |
|  |                                                          | | or empty      | |
|  | [Navigator]                                              | |               | |
|  +----------------------------------------------------------+ +---------------+ |
+--------------------------------------------------------------------------------+
```

Primary focus:

- Canvas.

Secondary:

- Toolbar.
- Inspector.
- Navigator.

Advanced:

- JSON/debug/import/export must be hidden behind drawer/tab/collapse.

### 10.2 Mobile/Narrow Layout

Behavior:

- Canvas remains primary.
- Inspector becomes bottom sheet or collapsible panel.
- Toolbar becomes compact icon toolbar with overflow.
- Navigator can be hidden by default.

Minimum requirements:

- No overlapping text.
- Toolbar buttons remain tappable.
- Canvas height must not collapse.
- Inspector must not cover the entire canvas unless intentionally opened.

## 11. Toolbar Requirements

Default toolbar commands:

```ts
export type FlowCommand =
  | 'undo'
  | 'redo'
  | 'fit'
  | 'zoomIn'
  | 'zoomOut'
  | 'resetZoom'
  | 'autoLayout'
  | 'toggleNavigator'
  | 'toggleInspector'
  | 'fullscreen'
  | 'deleteSelection'
  | 'duplicateSelection'
  | 'exportJson'
  | 'importJson';
```

Toolbar UI rules:

- Use `app-button`, `app-action-toolbar`, or existing shared wrappers.
- Use icons for repeated commands.
- Use text labels only for important domain commands like Run/Publish/Save.
- Rare commands should go to overflow.
- Disable commands when unavailable.
- Show tooltip for icon-only commands.

Default visible command groups:

- View: fit, zoom in, zoom out, reset zoom.
- Edit: undo, redo, delete.
- Layout: auto layout.
- Panels: navigator, inspector.
- Advanced: export/import JSON in overflow.

## 12. Inspector Requirements

The inspector is generic and schema/template driven.

Inspector states:

1. Empty state.
2. Node selected.
3. Edge selected.
4. Multiple selection.
5. Validation error selected.

Required features:

- Header with icon/title.
- Summary section.
- Fields section.
- Validation section.
- Advanced metadata section collapsed by default.

Implementation rules:

- Use `app-*` input wrappers.
- Do not use PrimeNG or other third-party UI directly.
- Parent can provide inspector templates by node type.
- Fallback inspector renders generic fields from `FlowInspectorSchema`.

Example schema:

```ts
export interface FlowInspectorSchema {
  title?: string | FlowNodeLabelResolver;
  icon?: string | FlowNodeIconResolver;
  sections: FlowInspectorSection[];
}

export interface FlowInspectorSection {
  id: string;
  title: string;
  collapsed?: boolean;
  fields: FlowInspectorField[];
}

export interface FlowInspectorField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'textarea' | 'json' | 'readonly';
  options?: Array<{ label: string; value: unknown }>;
  readonly?: boolean;
  required?: boolean;
  hint?: string;
}
```

## 13. Canvas/JointJS Engine Requirements

### 13.1 Engine Responsibilities

`JointFlowEngine` should own:

- Create/destroy graph.
- Create/destroy paper.
- Render nodes and edges from `FlowDefinition`.
- Emit click/select/connect/move events.
- Apply layout.
- Fit/zoom/pan.
- Keep JointJS state in sync with Angular state.

### 13.2 Engine Must Not Own

- Domain validation.
- Save/load API calls.
- Trade Bot conversion.
- Angular forms.
- I18n text mapping.

### 13.3 Render Update Strategy

Use diff-based updates:

- Add missing cells.
- Update changed cells.
- Remove stale cells.
- Preserve viewport when data updates unless `fitOnLoad` or explicit command.

Avoid:

- Clearing and recreating entire graph on every Angular change.
- Mutating parent input objects.

### 13.4 Event Strategy

JointJS event:

```text
element:pointerclick
link:pointerclick
blank:pointerclick
link:connect
change:position
change:size
remove
```

Map to Angular events:

```text
nodeClick
edgeClick
blankClick
connect
nodeChange
edgeChange
valueChange
```

## 14. Layout Requirements

First release:

- Built-in vertical tree layout.
- Deterministic layout for tests.
- Configurable spacing.
- Supports roots, branches, and isolated nodes.

Later release:

- Optional dagre layout if dependency is approved.
- Manual layout preservation.
- Layout preview before applying.

Layout config:

```ts
export interface FlowLayoutConfig {
  direction: 'TB' | 'BT' | 'LR' | 'RL';
  nodeGap: number;
  rankGap: number;
  padding: number;
  preserveManualPositions?: boolean;
}
```

## 15. History Requirements

Support undo/redo for:

- Node move.
- Node resize.
- Node add.
- Node delete.
- Edge add.
- Edge delete.
- Inspector field update.

Rules:

- History disabled in readonly/trace mode.
- History stack should be bounded.
- Consecutive drag move events should be debounced or merged.

## 16. Validation Requirements

Common validation:

- Missing source/target.
- Duplicate edge.
- Self-loop, unless allowed.
- Invalid port connection.
- Node type not found.
- Edge references missing node.

Domain validation:

- Provided by parent.
- Rendered by common component.
- Must not live in shared flow builder.

Validation display:

- Node/edge warning badge.
- Inspector validation section.
- Optional list in toolbar overflow or side panel.

## 17. Accessibility Requirements

Minimum:

- Toolbar buttons have accessible labels.
- Inspector fields have labels.
- Selected node state is announced through visible status and aria text where possible.
- Keyboard shortcuts must not trap focus.
- Canvas must have an accessible description.

Keyboard support:

- Delete: delete selection.
- Escape: clear selection.
- Ctrl/Cmd+Z: undo.
- Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y: redo.
- Ctrl/Cmd+Plus: zoom in.
- Ctrl/Cmd+Minus: zoom out.
- Ctrl/Cmd+0: reset zoom.

## 18. I18n Requirements

All visible text must use translation keys.

Suggested keys:

```text
shared.flowBuilder.toolbar.undo
shared.flowBuilder.toolbar.redo
shared.flowBuilder.toolbar.fit
shared.flowBuilder.toolbar.zoomIn
shared.flowBuilder.toolbar.zoomOut
shared.flowBuilder.toolbar.resetZoom
shared.flowBuilder.toolbar.autoLayout
shared.flowBuilder.toolbar.navigator
shared.flowBuilder.toolbar.inspector
shared.flowBuilder.toolbar.fullscreen
shared.flowBuilder.toolbar.delete
shared.flowBuilder.toolbar.duplicate
shared.flowBuilder.toolbar.exportJson
shared.flowBuilder.toolbar.importJson
shared.flowBuilder.inspector.emptyTitle
shared.flowBuilder.inspector.emptyDescription
shared.flowBuilder.inspector.nodeTitle
shared.flowBuilder.inspector.edgeTitle
shared.flowBuilder.validation.nodeTypeMissing
shared.flowBuilder.validation.edgeEndpointMissing
shared.flowBuilder.validation.duplicateEdge
shared.flowBuilder.validation.selfLoop
shared.flowBuilder.mode.edit
shared.flowBuilder.mode.readonly
shared.flowBuilder.mode.trace
```

## 19. Trade Bot Adapter Design

### 19.1 Rule Expression to Flow

Map:

```text
RuleExpressionGroupNode      -> FlowNode type "rule-group"
RuleExpressionConditionNode  -> FlowNode type "rule-condition"
RuleExpressionRuleRefNode    -> FlowNode type "rule-ref"
RuleExpressionNotNode        -> FlowNode type "rule-not"
RuleExpressionOperand        -> FlowNode type "rule-operand"
```

Edges:

```text
group -> child
not -> child
condition -> operand
condition -> ruleRef operand
```

### 19.2 Flow to Rule Expression

Rules:

- Rebuild tree from directed edges.
- Preserve original node IDs when possible.
- Preserve disabled flag.
- Preserve params.
- Preserve operand order.
- Validate one root.
- Validate condition arity.

### 19.3 Trace Mode

Trace data maps to:

```text
passed=true  -> status success
passed=false -> status danger
value        -> node badge
message      -> inspector field
output       -> advanced collapsed section
children     -> child nodes
```

Trace mode is readonly.

## 20. Implementation Phases

## Phase 0: Preparation

### Task 0.1: Confirm Scope and Dependency Strategy

Description:
Confirm that implementation uses `@joint/core`, not `@joint/plus`, unless explicitly approved.

Acceptance criteria:

- [ ] Decision written in PR description or implementation notes.
- [ ] No new dependency on `@joint/plus`.
- [ ] No direct third-party UI usage outside wrappers.

Verification:

- [ ] Check `package.json`.
- [ ] Search templates for third-party component tags.

Dependencies:

- None.

Files likely touched:

- None or documentation only.

Estimated scope:

- XS.

### Task 0.2: Audit Existing Shared Components

Description:
List existing `app-*` components that can be reused for toolbar, inspector, drawer, tabs, buttons, inputs, JSON viewer, and empty state.

Acceptance criteria:

- [ ] Identify button wrapper.
- [ ] Identify form/input wrappers.
- [ ] Identify card/panel wrappers.
- [ ] Identify JSON viewer wrapper.
- [ ] Identify tooltip support or decide fallback.

Verification:

- [ ] Document component mapping in implementation notes.

Dependencies:

- None.

Files likely touched:

- None.

Estimated scope:

- S.

## Phase 1: Generic Contracts

### Task 1.1: Add Flow Models

Description:
Create core TypeScript interfaces for reusable flow definitions.

Acceptance criteria:

- [ ] `FlowDefinition` exists.
- [ ] `FlowNode` exists.
- [ ] `FlowEdge` exists.
- [ ] `FlowPort` exists.
- [ ] `FlowStatus` exists.
- [ ] `FlowCommand` exists.
- [ ] `FlowValidationIssue` exists.
- [ ] `FlowInspectorSchema` exists.
- [ ] Models are exported from `shared/ui/flow-builder/index.ts`.

Verification:

- [ ] `npm run build` passes.
- [ ] Type-only unit tests compile if added.

Dependencies:

- Task 0.1.

Files likely touched:

- `src/app/shared/ui/flow-builder/models/*.ts`
- `src/app/shared/ui/flow-builder/index.ts`

Estimated scope:

- M.

### Task 1.2: Add Template Directives

Description:
Create directives for parent-provided templates.

Acceptance criteria:

- [ ] `appFlowNodeTemplate` directive accepts node type key.
- [ ] `appFlowEdgeTemplate` directive accepts edge type key.
- [ ] `appFlowInspectorTemplate` directive accepts node/edge type key.
- [ ] Directives expose `TemplateRef`.
- [ ] Directives are exported.

Verification:

- [ ] Unit test can query projected template directives.
- [ ] `npm run build` passes.

Dependencies:

- Task 1.1.

Files likely touched:

- `src/app/shared/ui/flow-builder/directives/*.ts`

Estimated scope:

- S.

## Phase 2: Engine Foundation

### Task 2.1: Implement JointFlowEngine Skeleton

Description:
Create a service/class that creates JointJS `Graph` and `Paper`.

Acceptance criteria:

- [ ] Can initialize into a host HTMLElement.
- [ ] Can destroy cleanly.
- [ ] Can render empty graph.
- [ ] Uses project design tokens for background/grid.
- [ ] Emits blank click.

Verification:

- [ ] Unit test instantiate/destroy with mocked DOM if feasible.
- [ ] Storybook renders empty canvas.
- [ ] `npm run build` passes.

Dependencies:

- Task 1.1.

Files likely touched:

- `src/app/shared/ui/flow-builder/joint/joint-flow-engine.ts`
- `src/app/shared/ui/flow-builder/joint/joint-flow-paper-options.ts`

Estimated scope:

- M.

### Task 2.2: Implement Node and Edge Shape Factory

Description:
Render default SVG shapes from `FlowNodeTypeDefinition` and `FlowEdge`.

Acceptance criteria:

- [ ] Rectangle node renders.
- [ ] Diamond node renders.
- [ ] Capsule node renders.
- [ ] Note node renders.
- [ ] Placeholder node renders.
- [ ] Default edge renders with arrow.
- [ ] Ports render from definitions.
- [ ] Selection/highlight style works.

Verification:

- [ ] Storybook fixture shows all default node shapes.
- [ ] Visual check desktop and narrow viewport.
- [ ] `npm run build` passes.

Dependencies:

- Task 2.1.

Files likely touched:

- `src/app/shared/ui/flow-builder/shapes/*.ts`
- `src/app/shared/ui/flow-builder/joint/joint-flow-renderer.ts`
- `src/app/shared/ui/flow-builder/joint/joint-flow-ports.ts`

Estimated scope:

- M.

### Task 2.3: Implement Data Sync

Description:
Sync `FlowDefinition` to JointJS graph without clearing on every update.

Acceptance criteria:

- [ ] Adds new nodes.
- [ ] Updates changed nodes.
- [ ] Removes deleted nodes.
- [ ] Adds/updates/removes edges.
- [ ] Preserves viewport on ordinary data updates.
- [ ] Does not mutate input object.

Verification:

- [ ] Unit tests for add/update/remove diff.
- [ ] Storybook controls can replace data.
- [ ] `npm run build` passes.

Dependencies:

- Task 2.2.

Files likely touched:

- `joint-flow-renderer.ts`
- `flow-graph.util.ts`

Estimated scope:

- M.

## Phase 3: Component Shell

### Task 3.1: Build FlowCanvasComponent

Description:
Wrap `JointFlowEngine` in Angular.

Acceptance criteria:

- [ ] Accepts `value`, `nodeTypes`, `edgeTypes`, `mode`, `readonly`.
- [ ] Emits click/connect/change events.
- [ ] Cleans up engine on destroy.
- [ ] Reacts to input changes.
- [ ] Canvas has stable responsive dimensions.

Verification:

- [ ] Component unit test creates/destroys.
- [ ] Storybook renders sample graph.
- [ ] `npm run build` passes.

Dependencies:

- Task 2.3.

Files likely touched:

- `components/flow-canvas/*`

Estimated scope:

- M.

### Task 3.2: Build FlowBuilderComponent Shell

Description:
Compose canvas, toolbar, inspector, and navigator placeholders.

Acceptance criteria:

- [ ] `app-flow-builder` selector exists.
- [ ] Canvas is primary visual area.
- [ ] Toolbar placeholder top-left.
- [ ] Inspector placeholder right side.
- [ ] Navigator placeholder bottom-left.
- [ ] Responsive layout works.
- [ ] Uses no third-party UI tags.

Verification:

- [ ] Storybook renders shell.
- [ ] `npm run build` passes.

Dependencies:

- Task 3.1.

Files likely touched:

- `components/flow-builder/*`

Estimated scope:

- M.

## Phase 4: Interaction and State

### Task 4.1: Selection State

Description:
Implement single selection for node/edge/blank.

Acceptance criteria:

- [ ] Node click selects node.
- [ ] Edge click selects edge.
- [ ] Blank click clears selection.
- [ ] `selectedId` input syncs to selection.
- [ ] `selectedIdChange` emits.
- [ ] Selection style visible.

Verification:

- [ ] Unit test selection reducer/service.
- [ ] Manual Storybook check.
- [ ] `npm run build` passes.

Dependencies:

- Task 3.2.

Files likely touched:

- `flow-builder-state.service.ts`
- `joint-flow-selection.ts`
- `components/flow-builder/*`

Estimated scope:

- M.

### Task 4.2: Pan, Zoom, Fit

Description:
Implement viewport controls.

Acceptance criteria:

- [ ] Mouse wheel with modifier zooms.
- [ ] Pan works by configured gesture.
- [ ] Fit command centers graph.
- [ ] Zoom in/out/reset commands work.
- [ ] Viewport state can be emitted or stored in `FlowDefinition.viewport`.

Verification:

- [ ] Manual Storybook check.
- [ ] `npm run build` passes.

Dependencies:

- Task 4.1.

Files likely touched:

- `joint-flow-engine.ts`
- `flow-viewport.service.ts`

Estimated scope:

- M.

### Task 4.3: Connect Nodes

Description:
Support link creation with validation.

Acceptance criteria:

- [ ] Drag from output port to input port creates connect event.
- [ ] Self-loop blocked by default.
- [ ] Duplicate edge blocked by default.
- [ ] Parent can provide `canConnect` rule.
- [ ] In readonly/trace mode, connect is disabled.

Verification:

- [ ] Unit test connection validation utility.
- [ ] Manual Storybook check.
- [ ] `npm run build` passes.

Dependencies:

- Task 4.1.

Files likely touched:

- `joint-flow-events.ts`
- `flow-validation-display.service.ts`
- `flow-graph.util.ts`

Estimated scope:

- M.

## Phase 5: Toolbar

### Task 5.1: FlowToolbarComponent

Description:
Build toolbar with default commands using shared button wrappers.

Acceptance criteria:

- [ ] Undo button.
- [ ] Redo button.
- [ ] Fit button.
- [ ] Zoom in button.
- [ ] Zoom out button.
- [ ] Reset zoom button.
- [ ] Auto layout button.
- [ ] Toggle navigator button.
- [ ] Toggle inspector button.
- [ ] Delete selection button.
- [ ] Overflow for advanced commands.
- [ ] Buttons disable correctly.
- [ ] Uses i18n keys.

Verification:

- [ ] Unit test command emit.
- [ ] `npm run build` passes.

Dependencies:

- Task 3.2.

Files likely touched:

- `components/flow-toolbar/*`
- i18n file.

Estimated scope:

- M.

### Task 5.2: Wire Toolbar Commands

Description:
Connect toolbar command events to engine/state.

Acceptance criteria:

- [ ] Fit works.
- [ ] Zoom commands work.
- [ ] Delete selected works in edit mode.
- [ ] Commands emit to parent when marked external.
- [ ] Commands disabled in readonly/trace mode.

Verification:

- [ ] Manual Storybook check.
- [ ] `npm run build` passes.

Dependencies:

- Task 5.1.

Files likely touched:

- `flow-command.service.ts`
- `components/flow-builder/*`

Estimated scope:

- M.

## Phase 6: Inspector

### Task 6.1: FlowInspectorComponent

Description:
Build generic inspector shell.

Acceptance criteria:

- [ ] Empty state.
- [ ] Node selected state.
- [ ] Edge selected state.
- [ ] Multiple/unsupported state fallback.
- [ ] Header icon/title.
- [ ] Validation issues section.
- [ ] Advanced metadata collapsed by default.
- [ ] Uses `app-*` wrappers.
- [ ] Uses i18n keys.

Verification:

- [ ] Unit test state rendering.
- [ ] Storybook states.
- [ ] `npm run build` passes.

Dependencies:

- Task 4.1.

Files likely touched:

- `components/flow-inspector/*`

Estimated scope:

- M.

### Task 6.2: Inspector Template Projection

Description:
Allow parent to provide inspector content by node/edge type.

Acceptance criteria:

- [ ] `appFlowInspectorTemplate="condition"` renders when condition node selected.
- [ ] Fallback schema inspector renders when no template exists.
- [ ] Template receives node/edge and selection context.
- [ ] Parent can emit changes through documented event path.

Verification:

- [ ] Unit test projected template selection.
- [ ] Storybook custom inspector example.
- [ ] `npm run build` passes.

Dependencies:

- Task 6.1.
- Task 1.2.

Files likely touched:

- `components/flow-inspector/*`
- `directives/*`

Estimated scope:

- M.

## Phase 7: Node Template Projection

### Task 7.1: Node Template Registry

Description:
Register projected node templates by type.

Acceptance criteria:

- [ ] `appFlowNodeTemplate="type"` templates are discovered.
- [ ] Template lookup is deterministic.
- [ ] Missing template falls back to config/SVG renderer.
- [ ] Duplicate template type warns in dev mode or chooses last deterministically.

Verification:

- [ ] Unit test registry utility.
- [ ] `npm run build` passes.

Dependencies:

- Task 1.2.

Files likely touched:

- `flow-template.util.ts`
- `components/flow-builder/*`

Estimated scope:

- S.

### Task 7.2: Rich Node Rendering Strategy

Description:
Implement safe rendering path for Angular node templates.

Acceptance criteria:

- [ ] Parent-provided template can render node label/subtitle/badge.
- [ ] Template follows node position and zoom.
- [ ] Template selection state updates.
- [ ] Template does not break pan/zoom.
- [ ] Performance acceptable for at least 100 nodes.

Verification:

- [ ] Storybook with custom Angular node template.
- [ ] Manual performance check with 100 nodes.
- [ ] `npm run build` passes.

Dependencies:

- Task 7.1.
- Task 3.1.

Files likely touched:

- `components/flow-canvas/*`
- `joint-flow-renderer.ts`

Estimated scope:

- L; split further if implementation becomes complex.

## Phase 8: Layout and Navigator

### Task 8.1: Auto Layout

Description:
Implement deterministic tree layout.

Acceptance criteria:

- [ ] Layout supports top-to-bottom.
- [ ] Layout supports left-to-right.
- [ ] Multiple roots are handled.
- [ ] Isolated nodes are handled.
- [ ] Manual positions can be preserved when configured.
- [ ] Layout command updates positions in `FlowDefinition`.

Verification:

- [ ] Unit tests for layout utility.
- [ ] Storybook layout examples.
- [ ] `npm run build` passes.

Dependencies:

- Task 2.3.

Files likely touched:

- `joint-flow-layout.ts`
- `flow-layout.service.ts`
- `flow-layout.util.ts`

Estimated scope:

- M.

### Task 8.2: Navigator/Minimap

Description:
Implement navigator panel using available JointJS Core capabilities or a simplified mini overview.

Acceptance criteria:

- [ ] Bottom-left navigator area exists.
- [ ] Toggle show/hide works.
- [ ] Viewport rectangle visible if feasible.
- [ ] Hidden by default on narrow screens.
- [ ] Does not block canvas interaction.

Verification:

- [ ] Storybook check.
- [ ] Mobile/narrow visual check.
- [ ] `npm run build` passes.

Dependencies:

- Task 4.2.

Files likely touched:

- `components/flow-navigator/*`

Estimated scope:

- M/L depending on implementation.

## Phase 9: History and Keyboard

### Task 9.1: History Service

Description:
Add bounded undo/redo stack for flow changes.

Acceptance criteria:

- [ ] Push snapshot on meaningful changes.
- [ ] Undo restores previous flow.
- [ ] Redo restores next flow.
- [ ] Drag move events are merged/debounced.
- [ ] Disabled in readonly/trace mode.

Verification:

- [ ] Unit test history service.
- [ ] Manual Storybook check.
- [ ] `npm run build` passes.

Dependencies:

- Task 4.1.
- Task 5.2.

Files likely touched:

- `flow-history.service.ts`
- `joint-flow-history.ts`

Estimated scope:

- M.

### Task 9.2: Keyboard Controller

Description:
Add keyboard shortcuts.

Acceptance criteria:

- [ ] Delete removes selection in edit mode.
- [ ] Escape clears selection.
- [ ] Ctrl/Cmd+Z undo.
- [ ] Ctrl/Cmd+Y redo.
- [ ] Ctrl/Cmd+Plus zoom in.
- [ ] Ctrl/Cmd+Minus zoom out.
- [ ] Shortcuts ignored while typing in inputs.

Verification:

- [ ] Unit test key handler.
- [ ] Manual Storybook check.
- [ ] `npm run build` passes.

Dependencies:

- Task 9.1.

Files likely touched:

- `flow-command.service.ts`
- `components/flow-builder/*`

Estimated scope:

- M.

## Phase 10: Trade Bot Integration

### Task 10.1: Rule Flow Adapter

Description:
Map `RuleLogicFormValue` to `FlowDefinition`.

Acceptance criteria:

- [ ] Group node maps.
- [ ] Condition node maps.
- [ ] NOT node maps.
- [ ] RuleRef node maps.
- [ ] Operands map.
- [ ] Edges preserve tree relationships.
- [ ] Disabled nodes map to muted/disabled state.

Verification:

- [ ] Unit tests for sample expressions.
- [ ] `npm run build` passes.

Dependencies:

- Task 1.1.

Files likely touched:

- `features/admin/trade-bot-management/share/rule-flow/rule-flow-adapter.ts`
- `rule-flow.models.ts`
- `rule-flow-adapter.spec.ts`

Estimated scope:

- M.

### Task 10.2: Flow to Rule Expression Adapter

Description:
Map edited `FlowDefinition` back to `RuleLogicFormValue`.

Acceptance criteria:

- [ ] Preserves node IDs.
- [ ] Preserves operator.
- [ ] Preserves params.
- [ ] Preserves operand order.
- [ ] Fails validation for multiple roots.
- [ ] Fails validation for invalid condition arity.
- [ ] Fails validation for cycles.

Verification:

- [ ] Round-trip unit tests.
- [ ] Invalid graph tests.
- [ ] `npm run build` passes.

Dependencies:

- Task 10.1.

Files likely touched:

- `rule-flow-adapter.ts`
- `rule-flow-adapter.spec.ts`

Estimated scope:

- M.

### Task 10.3: Rule Flow Node Catalog

Description:
Define Trade Bot node types and default styles.

Acceptance criteria:

- [ ] `rule-group` node type.
- [ ] `rule-condition` node type.
- [ ] `rule-not` node type.
- [ ] `rule-ref` node type.
- [ ] `rule-operand` node type.
- [ ] Status colors use design tokens.
- [ ] Labels are resolved from node data.

Verification:

- [ ] Storybook example renders all node types.
- [ ] `npm run build` passes.

Dependencies:

- Task 10.1.
- Task 2.2.

Files likely touched:

- `rule-flow-node-catalog.ts`

Estimated scope:

- S.

### Task 10.4: Rule Flow Editor Integration

Description:
Replace empty flow tab in rule config form with `app-flow-builder`.

Acceptance criteria:

- [ ] Flow tab renders current `ruleExpression`.
- [ ] Tree tab and Flow tab stay in sync.
- [ ] Editing flow updates form value.
- [ ] Validation errors shown.
- [ ] Submit payload remains compatible.
- [ ] Existing tree editor still works.

Verification:

- [ ] Manual edit rule expression from tree then view flow.
- [ ] Manual edit flow then view tree.
- [ ] `npm run build` passes.

Dependencies:

- Task 10.2.
- Task 10.3.

Files likely touched:

- `rule-config-form.component.ts`
- `rule-config-form.component.html`
- `rule-flow-*`

Estimated scope:

- L; split into view-only first, then edit mode.

### Task 10.5: Rule Trace Flow Integration

Description:
Render backtest/evaluate trace as readonly flow.

Acceptance criteria:

- [ ] Trace flow renders nodes from trace tree.
- [ ] Passed nodes show success status.
- [ ] Failed nodes show danger status.
- [ ] `value` appears as badge/metadata.
- [ ] Message/output available in inspector.
- [ ] Flow mode is readonly.

Verification:

- [ ] Manual check backtest detail trace tab.
- [ ] `npm run build` passes.

Dependencies:

- Task 10.3.

Files likely touched:

- `rule-flow-trace-adapter.ts`
- `backtest-detail.component.ts`
- `backtest-detail.component.html`

Estimated scope:

- M.

## Phase 11: Storybook and Documentation

### Task 11.1: Shared Flow Builder Stories

Description:
Create Storybook coverage for generic component.

Acceptance criteria:

- [ ] Empty graph story.
- [ ] Readonly graph story.
- [ ] Editable graph story.
- [ ] Custom node template story.
- [ ] Inspector template story.
- [ ] Validation story.
- [ ] Trace/status story.
- [ ] 100-node performance story.

Verification:

- [ ] Storybook starts.
- [ ] `npm run build-storybook` if available and feasible.

Dependencies:

- Core component phases.

Files likely touched:

- `flow-builder.stories.ts`

Estimated scope:

- M.

### Task 11.2: Architecture Documentation

Description:
Document usage and extension rules.

Acceptance criteria:

- [ ] Describe module boundary.
- [ ] Describe public API.
- [ ] Describe parent template projection.
- [ ] Describe Trade Bot adapter.
- [ ] Describe do/don't rules.
- [ ] Include examples.

Verification:

- [ ] Document reviewed against implementation.

Dependencies:

- Main API stable.

Files likely touched:

- `docs/flow-builder-common-component.md`

Estimated scope:

- S.

## 21. Checkpoints

### Checkpoint A: After Phase 1

- [ ] Models compile.
- [ ] Template directives compile.
- [ ] No UI behavior yet.
- [ ] Public API reviewed before engine implementation.

### Checkpoint B: After Phase 3

- [ ] Generic shell renders.
- [ ] Empty canvas works.
- [ ] Sample graph renders.
- [ ] Build passes.

### Checkpoint C: After Phase 6

- [ ] Selection works.
- [ ] Toolbar works.
- [ ] Inspector works.
- [ ] No Trade Bot coupling exists in shared component.

### Checkpoint D: After Phase 10.4

- [ ] Trade Bot rule flow view works.
- [ ] Tree/flow sync works.
- [ ] Build passes.
- [ ] Existing tree editor not regressed.

### Checkpoint E: Final

- [ ] Edit mode works.
- [ ] Readonly mode works.
- [ ] Trace mode works.
- [ ] Storybook examples exist.
- [ ] Documentation exists.
- [ ] `npm run build` passes.

## 22. Test Plan

### Unit Tests

Shared:

- Flow model utilities.
- Graph diff utility.
- Layout utility.
- Selection state.
- History service.
- Command service.
- Template registry.
- Connection validation.

Trade Bot:

- `RuleExpression -> FlowDefinition`.
- `FlowDefinition -> RuleExpression`.
- Round-trip conversion.
- Invalid graph validation.
- Trace conversion.

### Component Tests

- `FlowBuilderComponent` renders shell.
- `FlowCanvasComponent` initializes/destroys engine.
- `FlowToolbarComponent` emits commands.
- `FlowInspectorComponent` renders empty/node/edge states.
- Template projection works.

### Visual/Manual Tests

Desktop:

- Rule config flow tab.
- Backtest trace flow tab.
- Pan/zoom/fit.
- Inspector open/closed.
- Toolbar commands.

Mobile/narrow:

- Canvas remains usable.
- Inspector collapses.
- Toolbar does not overflow incoherently.
- Text does not overlap.

### Build

Required:

```bash
npm run build
```

Optional if test suite is stable:

```bash
npm test -- --watch=false
```

Known caution:

- Existing test suite may have unrelated failing specs. Do not claim tests pass unless actually verified.

## 23. Acceptance Criteria for MVP

MVP is complete when:

- [ ] `app-flow-builder` exists under `shared/ui/flow-builder`.
- [ ] Parent can define node types through config.
- [ ] Parent can provide node template through `ng-template`.
- [ ] Parent can provide inspector template through `ng-template`.
- [ ] Component supports edit/readonly/trace modes.
- [ ] Component supports selection, pan, zoom, fit.
- [ ] Component supports basic node connection.
- [ ] Component has toolbar using shared wrappers.
- [ ] Component has inspector using shared wrappers.
- [ ] Trade Bot rule config flow tab renders actual rule expression.
- [ ] Trade Bot backtest trace flow tab renders actual trace.
- [ ] `npm run build` passes.

## 24. Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Angular template inside JointJS SVG is complex | High | Use SVG config renderer by default; use HTML overlay/foreignObject only for rich templates |
| Recreating `@joint/plus` features is large | High | Implement MVP subset first: canvas, toolbar, inspector, layout; postpone advanced minimap/context toolbar |
| Shared component becomes Trade Bot-specific | High | Enforce adapter boundary; no Trade Bot imports in `shared/ui/flow-builder` |
| Performance degrades with many Angular node templates | Medium | Prefer SVG rendering for large graphs; add 100-node story; consider virtualization/overlay throttling |
| Existing tests are dirty/failing | Medium | Run build as required; document unrelated test failures explicitly |
| UI violates shared wrapper rule | High | Use `app-*` wrappers in templates; only JointJS internals may touch JointJS directly inside wrapper code |
| Mobile layout becomes unusable | Medium | Inspector collapses to bottom sheet; navigator hidden by default |
| Tree/flow sync corrupts expression | High | Implement adapter round-trip tests before enabling edit mode |

## 25. Open Questions

1. Should the first production release support editing in flow mode, or view-only first?
2. Is `@joint/plus` licensed and allowed, or must we stay on `@joint/core`?
3. Should minimap be required for MVP or phase 2?
4. Should node templates use HTML overlay or `foreignObject`?
5. Should Trade Bot flow be the first consumer, or should a generic Storybook demo validate the component first?
6. Should flow positions be persisted in rule config, or recalculated every time?
7. Should trace mode show all nodes expanded, or collapse referenced rules by default?

## 26. Recommended Implementation Order

Recommended first sprint:

1. Task 1.1: Add Flow Models.
2. Task 1.2: Add Template Directives.
3. Task 2.1: Implement JointFlowEngine Skeleton.
4. Task 2.2: Implement Node and Edge Shape Factory.
5. Task 3.1: Build FlowCanvasComponent.
6. Task 3.2: Build FlowBuilderComponent Shell.
7. Task 10.1: Rule Flow Adapter view-only conversion.
8. Task 10.3: Rule Flow Node Catalog.
9. Integrate rule config flow tab as view-only.

Reason:

- This creates visible value fast.
- It validates the generic contract.
- It avoids early complexity from edit mode/history/template overlay.

Recommended second sprint:

1. Selection.
2. Toolbar.
3. Inspector.
4. Trace mode.
5. Flow-to-rule adapter.
6. Enable edit mode.

Recommended third sprint:

1. History.
2. Keyboard shortcuts.
3. Rich projected node templates.
4. Navigator/minimap.
5. Advanced import/export.

## 27. Definition of Done

The final solution is done when:

- Shared flow builder is reusable without Trade Bot dependency.
- Trade Bot rule editor can use it through adapter only.
- Trade Bot trace viewer can use it in readonly trace mode.
- Parent can define node templates.
- Parent can define inspector templates.
- All visible text has i18n keys.
- All feature/page templates use `app-*` wrappers.
- Canvas remains the primary focus of the viewport.
- Build passes.
- Test failures, if any, are documented with exact unrelated causes.