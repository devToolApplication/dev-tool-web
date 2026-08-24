# Phase 1 - Workspace and Command Bar

## Goal

Keep the current improved page composition, reduce non-canvas clutter, and make core editor actions discoverable without requiring keyboard knowledge.

## Main files

```text
src/app/features/workflow-studio/pages/workflow-builder-page.component.ts
src/app/features/workflow-studio/pages/workflow-builder-page.component.html
src/app/features/workflow-studio/pages/workflow-builder-page.component.css
src/app/features/workflow-studio/pages/workflow-builder-page.component.spec.ts
src/app/features/workflow-studio/canvas/workflow-canvas.component.ts
src/app/features/workflow-studio/canvas/workflow-canvas.component.html
src/app/features/workflow-studio/canvas/workflow-canvas.component.spec.ts
```

## 1. Workflow details default state

Current layout is correct: details are above the canvas and collapsible. Change only the initial state.

Required behavior:

```text
Create workflow -> details expanded
Edit workflow   -> details collapsed
```

Pseudo-code:

```ts
ngOnInit(): void {
  const workflowId = this.route.snapshot.paramMap.get('workflowId');
  this.generalInfoCollapsed.set(!!workflowId);
  // existing load/create logic follows
}
```

Keep the collapsed summary limited to workflow name, max parallel, and dirty/saved state. Do not add description into the summary.

## 2. Single editor command model

Do not maintain separate command behavior for toolbar, keyboard shortcuts, and context menu.

Introduce a feature-level command type or equivalent:

```ts
type WorkflowEditorCommand =
  | 'undo'
  | 'redo'
  | 'autoLayout'
  | 'fit'
  | 'zoomIn'
  | 'zoomOut'
  | 'resetZoom'
  | 'toggleNavigator'
  | 'fullscreen'
  | 'duplicate'
  | 'delete';
```

Provide one execution entry point:

```ts
executeEditorCommand(command: WorkflowEditorCommand): void {
  switch (command) {
    case 'undo':
      this.store.undo();
      return;
    case 'redo':
      this.store.redo();
      return;
    case 'fit':
      this.workflowCanvas?.executeCommand('fit');
      return;
    // map remaining commands once
  }
}
```

Keyboard handlers should translate key events into `WorkflowEditorCommand` and call this method instead of implementing mutations again.

## 3. Command bar contents

Target command grouping:

```text
Undo Redo | Auto Layout Fit | Zoom Out Zoom In Reset | Minimap Fullscreen | Duplicate Delete
```

Rules:

- Undo/Redo enabled from store history state.
- Duplicate enabled only for a selected mutable node.
- Delete enabled for a selected mutable node or edge.
- Auto Layout disabled in readonly/runtime mode.
- View-only commands remain enabled in readonly mode: Fit, Zoom, Reset, Minimap, Fullscreen.
- Duplicate/Delete may be hidden or disabled when nothing is selected; choose one pattern and keep it consistent.
- Do not add Import/Export to the primary command bar in this phase.

## 4. Canvas command adapter

`WorkflowBuilderPage` should not reach through multiple implementation layers. Expose small wrapper methods on `WorkflowCanvasComponent`, e.g.:

```ts
executeCommand(command: FlowBuilderCommand): void {
  this.flowBuilder?.executeCommand(command);
}
```

or focused wrappers if the shared command type is not safe to expose.

Do not duplicate viewport logic in the page.

## 5. Responsive toolbar

- Desktop: one row.
- Laptop: keep primary commands visible; secondary view commands may move into an overflow menu if necessary.
- Do not allow the toolbar to grow to three lines.
- Use shared buttons/menu components and theme tokens.

## Tests

Add focused tests for:

- [ ] Edit route initializes details collapsed.
- [ ] Create route initializes details expanded.
- [ ] Undo toolbar and Ctrl/Cmd+Z use the same command path.
- [ ] Redo toolbar and shortcut use the same command path.
- [ ] Delete node from toolbar matches Delete/Backspace behavior.
- [ ] Delete edge works through the same command path.
- [ ] Duplicate is unavailable for edge selection.
- [ ] Mutation commands are disabled in readonly mode.
- [ ] Fit/Zoom/Minimap/Fullscreen remain available in readonly mode.
- [ ] Existing save/publish/run/version actions are unaffected.

## Done when

The canvas remains the dominant area, edit pages do not waste vertical space on expanded metadata, and a user can discover all normal graph-editing operations from the UI without memorizing shortcuts.
