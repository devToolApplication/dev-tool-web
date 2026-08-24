# Phase 3 - Unified Node/Edge Inspector and Problems

## Goal

Make selection behavior consistent across nodes, edges, and validation problems. A selected graph element should always have one clear inspector path.

## Main files

```text
src/app/features/workflow-studio/pages/workflow-builder-page.component.ts
src/app/features/workflow-studio/pages/workflow-builder-page.component.html
src/app/features/workflow-studio/pages/workflow-builder-page.component.spec.ts
src/app/features/workflow-studio/inspector/workflow-element-inspector.component.ts
src/app/features/workflow-studio/inspector/workflow-element-inspector.component.html
src/app/features/workflow-studio/inspector/workflow-edge-inspector.component.ts
src/app/features/workflow-studio/inspector/workflow-edge-inspector.component.html
src/app/features/workflow-studio/problems/workflow-problems-panel.component.ts
src/app/features/workflow-studio/problems/workflow-problems-panel.component.html
src/app/features/workflow-studio/problems/workflow-problems-panel.component.spec.ts
src/app/features/workflow-studio/store/workflow-editor.store.ts
```

Only create the new components if they keep the page simpler than direct switching. Prefer the element-inspector boundary.

## 1. Unified selected element

Current drawer is node-only even though the store can select edges.

Introduce one selected-element computation or equivalent:

```ts
type WorkflowSelectedElement =
  | { kind: 'node'; value: WorkflowNode }
  | { kind: 'edge'; value: WorkflowEdge }
  | null;

readonly selectedElement = computed<WorkflowSelectedElement>(() => {
  const nodeId = this.store.selectedNodeId();
  if (nodeId) {
    const node = this.store.nodes().find(item => item.id === nodeId);
    if (node) return { kind: 'node', value: node };
  }

  const edgeId = this.store.selectedEdgeId();
  if (edgeId) {
    const edge = this.store.edges().find(item => item.id === edgeId);
    if (edge) return { kind: 'edge', value: edge };
  }

  return null;
});
```

Drawer open state becomes `!!selectedElement()` instead of `!!selectedNode()`.

## 2. WorkflowElementInspector

Target composition:

```text
WorkflowElementInspector
  node -> WorkflowNodeInspector
  edge -> WorkflowEdgeInspector
```

Keep page-level HTML unaware of individual node-type inspector details.

## 3. Edge Inspector V1

Do not over-design edge configuration before the domain model requires it.

Minimum UI:

```text
CONNECTION
Source: parent_child_relationship
Target: child_grade
Outcome/label: <only if supported by model>

Delete connection
```

Rules:

- Source and target are readonly.
- Expose only fields already represented safely by the current edge model.
- Do not invent conditional-routing semantics in the UI.
- Delete uses the same editor command path from Phase 1.

Dynamic drawer title:

```text
Connection
parent_child_relationship -> child_grade
```

## 4. Selection behavior

Required interaction:

```text
click node -> select node -> node drawer
click edge -> select edge -> edge drawer
click blank -> clear selection -> close drawer
Escape -> clear transient selection -> close drawer
select another element -> drawer remains open and swaps content
```

Deleting the selected element must clear selection and close/update the drawer without stale content.

## 5. Problems default state

Current Problems panel should not consume space when there is nothing to inspect.

Required behavior:

```text
Initial + 0 issues      -> collapsed
Validation succeeds    -> collapsed
Validation fails       -> expanded
Manual collapse        -> respected until a new validation result requires attention
New failed validation  -> expanded again
```

Display count in the header:

```text
Problems (0)
Problems (3)
```

Do not render a large empty body just to say there are no problems.

## 6. Problem navigation

V1 required flow:

```text
click problem
  -> select related node/edge
  -> reveal/center element on canvas
  -> open the matching inspector drawer
```

V2 in Phase 5 may additionally expand/focus the exact invalid section/field.

Prefer an explicit page/store orchestration method rather than letting the Problems component directly own canvas behavior.

Pseudo-code:

```ts
onProblemSelected(issue: WorkflowValidationIssue): void {
  this.store.selectValidationIssue(issue);
  const elementId = issue.nodeId ?? issue.edgeId;
  if (elementId) {
    this.workflowCanvas?.revealElement(elementId);
  }
}
```

## 7. Problems component responsibility

The Problems component should primarily:

- render issues;
- maintain/display collapse state;
- emit selected issue;
- expose predictable expand/collapse inputs/events if page orchestration needs them.

Avoid tightly coupling it to WorkflowEditorStore if the page can coordinate selection cleanly.

## Tests

- [ ] Click node opens node inspector.
- [ ] Click edge opens edge inspector.
- [ ] Switching node -> edge keeps drawer open and swaps content.
- [ ] Blank click closes drawer.
- [ ] Escape closes drawer and clears selected node/edge.
- [ ] Deleting selected edge closes the stale edge inspector.
- [ ] Problems start collapsed when issue count is zero.
- [ ] Failed validation expands Problems.
- [ ] Successful validation collapses Problems.
- [ ] Problem count is correct.
- [ ] Clicking a node issue selects/reveals the node and opens node inspector.
- [ ] Clicking an edge issue selects/reveals the edge and opens edge inspector.

## Done when

Node, edge, and validation navigation behave as one editor system rather than three separate pieces of UI.
