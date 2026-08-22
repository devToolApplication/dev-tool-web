# Phase 03 — Editor Store and Canvas Core

## Goal

Create the production workflow editor state architecture and reusable canvas core.

## Tasks

### 1. WorkflowEditorStore

Use Angular Signals.

State should include:

- workflow
- nodes
- edges
- positions
- viewport
- selectedNodeId
- selectedEdgeId
- dirty
- saving
- validationIssues

All mutations must go through store actions.

Required actions:

- `loadWorkflow()`
- `addNode()`
- `removeNode()`
- `moveNode()`
- `connect()`
- `reconnect()`
- `disconnect()`
- `selectNode()`
- `selectEdge()`
- `updateNode()`
- `applyLayout()`
- `reset()`
- `markSaved()`

Components must not mutate node/edge arrays directly.

### 2. WorkflowCanvasComponent

Support modes:

- design
- runtime
- readonly

Canvas responsibilities:

- Foblex rendering
- canvas interaction
- selection
- viewport handling
- connection events
- node movement
- minimap
- zoom
- fit view

Canvas must not contain:

- HTTP calls
- publish logic
- save orchestration
- business validation
- node form configuration

### 3. ELK Layout Service

Create `WorkflowLayoutService`.

Flow:

```text
Workflow domain graph
  -> ELK graph
  -> layout calculation
  -> node positions
  -> EditorStore
```

## Pseudocode

```ts
@Injectable()
export class WorkflowEditorStore {
  readonly nodes = signal<WorkflowNode[]>([]);
  readonly edges = signal<WorkflowEdge[]>([]);
  readonly positions = signal<Record<string, NodePosition>>({});
  readonly selectedNodeId = signal<string | null>(null);
  readonly dirty = signal(false);

  addNode(node: WorkflowNode, position: NodePosition): void {
    // immutable update
  }
}
```

```ts
async autoLayout(): Promise<void> {
  const graph = workflowToElk(this.store.nodes(), this.store.edges());
  const result = await this.layoutService.layout(graph);
  this.store.applyLayout(result.positions);
}
```

## Tests

- add node
- remove node
- removing node removes related edges
- connect nodes
- reconnect edge
- disconnect edge
- move node marks editor dirty
- apply layout updates only editor positions
- selection works
- reset restores loaded state
- runtime/readonly modes do not allow graph mutations

## Acceptance Criteria

- A workflow graph can be loaded and rendered.
- User can visually edit graph structure in design mode.
- Edited state can be converted back to domain state.
- Domain state remains independent from Foblex.
- Same canvas component can later support runtime mode.
