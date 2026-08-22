# Phase 01 — Contract Alignment and Foblex Spike

## Goal

Verify Foblex + ELK works with the current Angular application and resolve the backend contracts required by the workflow editor before production UI is built.

## Tasks

### 1. Dependencies

- Add `@foblex/flow`.
- Add `@foblex/flow-elk-layout`.
- Do not remove JointJS yet.
- Keep the dependency addition isolated and reversible until the spike passes.

### 2. Canvas Spike

Build a temporary spike with:

```text
START -> AI_GATE -> END
```

The spike must support:

- render nodes
- drag nodes
- select nodes
- connect nodes
- reconnect an existing connection
- delete a connection
- pan
- zoom
- fit view
- ELK auto layout

### 3. Backend Contract Review — Editor Metadata

Resolve how the backend persists editor-only state:

- node x/y position
- viewport x/y
- zoom

Keep this state separate from `WorkflowGraph` execution semantics.

Recommended conceptual model:

```text
Workflow definition = runtime semantics
Editor metadata      = presentation/editor semantics
```

### 4. Backend Contract Review — Edge Semantics

Current source/target-only edges are insufficient if runtime semantics require:

- source port
- branch/outcome
- SWITCH case
- branch label
- edge condition

Define the final backend representation before Phase 04.

Do not create frontend-only APPROVE/REJECT/SWITCH semantics that the backend cannot round-trip.

## Pseudocode

```ts
const elkGraph = workflowToElk(domainGraph);
const layoutResult = await layoutService.layout(elkGraph);
editorStore.applyPositions(layoutResult.positions);
```

Foblex and ELK must not mutate `WorkflowGraph` domain objects.

## Tests

- Foblex renders correctly in the current Angular version.
- Three nodes can be rendered and connected.
- An existing connection can be reconnected.
- Pan, zoom and fit-view work.
- ELK produces valid node positions.
- Re-layout does not mutate the workflow domain graph.
- Spike teardown does not leave production code depending on spike-only types.

## Acceptance Criteria

- The spike works inside the real application build.
- Edge contract decision is documented.
- Editor metadata persistence decision is documented.
- No production domain model depends on Foblex types.
- The implementation direction for Phase 02 is unblocked.
