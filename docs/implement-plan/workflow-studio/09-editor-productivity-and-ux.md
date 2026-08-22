# Phase 09 — Editor Productivity and UX

## Goal

Improve the workflow editor for daily use after the core functional path is complete.

## Tasks

### 1. Keyboard Shortcuts

Support:

- Delete: delete selected node/edge when allowed
- Ctrl/Cmd + S: save
- Ctrl/Cmd + Z: undo
- Ctrl/Cmd + Shift + Z: redo
- Ctrl/Cmd + A: select all where appropriate
- Escape: clear selection/close transient editor state
- Fit View shortcut

Shortcuts must respect design/runtime/readonly modes.

### 2. Undo/Redo

Implement editor history.

Prefer state snapshots initially unless a command model is clearly justified.

History should include user editing actions:

- add/remove node
- node movement
- connect/disconnect/reconnect
- node configuration changes
- auto layout when it changes positions

Do not include server-driven runtime execution updates in editor history.

### 3. Canvas Controls

Provide:

- Auto Layout
- Fit View
- Zoom In
- Zoom Out
- Reset View
- optional minimap toggle if useful

### 4. UX States

Implement clear states for:

- empty workflow
- loading
- saving
- save success/failure feedback
- dirty indicator
- selected node/edge
- validation badges
- publish confirmation
- destructive delete confirmation where needed
- run start feedback

### 5. Inspector/Panel Behavior

- Keep the canvas usable when inspector is open.
- Make inspector width stable/resizable only if project patterns support it.
- Problems panel should be collapsible.
- Selection should remain synchronized between canvas, Problems panel and inspector.

### 6. Accessibility

At minimum:

- visible keyboard focus states
- accessible labels for toolbar controls
- keyboard-accessible inspector fields
- tooltips for icon-only canvas controls
- logical tab order outside the freeform graph area
- readable status text in addition to color

## Pseudocode

```ts
handleShortcut(event: KeyboardEvent): void {
  if (isEditableInput(event.target)) return;

  if (isSaveShortcut(event)) this.commands.save();
  if (isUndoShortcut(event) && this.mode === 'design') this.history.undo();
  if (isRedoShortcut(event) && this.mode === 'design') this.history.redo();
}
```

## Tests

- undo/redo restores graph state
- save shortcut calls save exactly once
- delete shortcut removes selected editable entity
- readonly/runtime modes ignore mutation shortcuts
- selection remains synchronized with inspector
- Problems panel navigation focuses selected node
- accessibility labels exist for toolbar controls

## Acceptance Criteria

- Common editor actions are efficient without mouse-only interaction.
- Undo/redo is reliable and scoped to editor changes.
- Runtime and readonly modes cannot accidentally mutate graph state.
- Editor has clear loading/saving/dirty/error states.
