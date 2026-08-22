# Phase 04 — Workflow Nodes and Connections

## Goal

Implement production UI for all supported workflow node types and graph connections.

## Tasks

### 1. Shared Node Shell

Create a reusable `WorkflowNodeShellComponent` responsible for common presentation:

- icon
- title
- subtitle
- selected state
- validation state
- runtime status
- input connectors
- output connectors

Do not place node-specific business forms inside the shell.

### 2. Node Components

Implement:

- StartNodeComponent
- CodeGateNodeComponent
- AiGateNodeComponent
- LogicNodeComponent
- EndNodeComponent

Each component should remain mostly presentational and receive data from the editor/runtime store.

### 3. Node Palette

Palette initially supports only backend node types:

- START
- CODE_GATE
- AI_GATE
- LOGIC
- END

Drag/drop flow:

```text
Palette drag
  -> Canvas drop
  -> convert to canvas coordinates
  -> node factory
  -> EditorStore.addNode()
  -> select created node
```

### 4. Connections

Create a custom workflow connection abstraction/component.

Support according to the Phase 01 edge contract:

- source node
- source port when required
- target node
- branch/outcome label when required
- reconnect
- selected state
- validation state
- runtime visual state

Do not store execution semantics only inside Foblex connection metadata.

### 5. Runtime-ready Visual States

Prepare nodes and edges for:

- pending
- ready
- running
- waiting external
- completed
- error
- timed out
- cancelled
- skipped

Use existing design tokens/shared UI styling rather than hardcoded business colors.

## Pseudocode

```ts
onPaletteDrop(type: WorkflowNodeType, point: Point): void {
  const node = this.nodeFactory.create(type);
  this.editorStore.addNode(node, point);
  this.editorStore.selectNode(node.id);
}
```

## Tests

- Palette creates the requested domain node type.
- START does not expose an invalid incoming connector.
- END does not expose an invalid outgoing connector.
- AI_GATE renders configured output ports according to the agreed edge semantics.
- Connections can be created and reconnected.
- Branch/outcome data survives domain round trip.
- Runtime visual properties do not mutate workflow definitions.

## Acceptance Criteria

- All five workflow node types can be created visually.
- Connections use the backend semantic model agreed in Phase 01.
- Node components remain presentation-focused.
- Canvas is ready to reuse in runtime mode.
