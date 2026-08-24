# Phase 2 - Inspector Drawer UX

## Goal

Make node configuration comfortable inside the drawer. Remove the permanent section-navigation tabs/checkmarks that currently consume attention and horizontal space, and replace them with a natural vertical form with collapsible sections.

This phase is intentionally limited to drawer/form UX. Do not mix edge-model changes or structured Input Mapping work into this phase.

## Main files

```text
src/app/features/workflow-studio/pages/workflow-builder-page.component.html
src/app/features/workflow-studio/pages/workflow-builder-page.component.css
src/app/features/workflow-studio/inspector/workflow-node-inspector.model.ts
src/app/features/workflow-studio/inspector/workflow-node-inspector.component.html
src/app/features/workflow-studio/inspector/workflow-node-inspector.component.ts
src/app/features/workflow-studio/inspector/*inspector*.spec.ts
```

Shared form files may be changed only if the required navigation mode/collapse behavior is missing generically.

## 1. Remove permanent section navigation

Current inspector form uses section navigation intended for larger pages. It is visually noisy inside a narrow drawer.

Replace the current tabs/checkmark navigation with no permanent navigation:

```ts
layout: {
  mode: 'sectioned',
  sectionNavigation: 'none',
  density: 'compact',
  labelPlacement: 'top',
  showValidationSummary: true,
  stickyFooter: false,
  autoScrollToError: false,
}
```

Use the actual supported enum/value in the shared form implementation. Do not invent a value without updating the shared type and renderer.

If quick section navigation is still desired later, expose it through a compact optional `Sections` menu; do not restore a permanent row of tabs/checkmarks.

## 2. Vertical section layout

Target AI Gate visual order:

```text
GENERAL
  Node ID

AGENT
  Agent
  Provider
  Working Directory

PROMPT
  Instruction

> DECISION
> INPUT MAPPING
> OUTPUT
> EXECUTION
```

Default expansion:

```text
General   expanded
Agent     expanded
Prompt    expanded
Decision  collapsed
Input     collapsed
Output    collapsed
Execution collapsed
```

For Code Gate and Logic, use the same principle: the identity/common fields and most frequently edited section are open; advanced/config/routing sections are collapsed.

## 3. Section styling

Avoid card-inside-card UI.

Each section should use:

- small clear heading;
- optional chevron for collapsible sections;
- subtle separator/spacing;
- no heavy background block per section;
- existing theme tokens only.

The drawer must read from top to bottom without forcing navigation clicks.

## 4. Drawer size

Current `size="md"` is too constrained for JSON, textarea, mapping, and side-by-side fields.

Target effective width:

```text
Desktop:  ~520px
Minimum:  ~460px
Maximum:  ~600px
Tablet:   ~45-55vw where practical
Mobile:   full width
```

Prefer an existing shared Drawer size/configuration. If shared Drawer cannot express a usable large width, add a reusable size option rather than workflow-specific CSS hacks.

The drawer must overlay the workspace; opening it must not shrink/reflow the canvas columns.

## 5. Dynamic drawer title

Replace generic node configuration title with a title derived from the selected node type.

Examples:

```text
Edit AI Gate
parent_child_relationship
```

```text
Edit Code Gate
follower_limit
```

```text
Edit Logic
all_conditions
```

Use translate keys for type labels. Subtitle remains the stable node id. Do not overload the header with provider/agent/runtime metadata.

## 6. Selection transition behavior

When the drawer is already open and the user selects another node:

- keep drawer open;
- replace inspector content in-place;
- do not animate close then reopen;
- reset section/form state appropriately for the new node;
- do not leak initial values from the previous node.

## 7. Form state and validation

- Keep global workflow save behavior; do not add a separate `Save node` button.
- Field changes continue to update the workflow editor store through the existing patch flow.
- Invalid fields must remain visually invalid in the drawer and must not look successfully persisted.
- Do not solve raw JSON silent failure fully here; Phase 5 owns the final validation cleanup.

## Tests

- [ ] Inspector renders without permanent section-navigation tabs/checkmarks.
- [ ] General/Agent/Prompt start expanded for AI Gate.
- [ ] Decision/Input/Output/Execution start collapsed.
- [ ] Collapsible section state works with keyboard and pointer interaction.
- [ ] Drawer uses the new comfortable width on desktop.
- [ ] Drawer becomes full-width or otherwise usable on small viewport.
- [ ] Dynamic title matches AI Gate, Code Gate, Logic, Start, End.
- [ ] Selecting node B while node A drawer is open updates content without closing the drawer.
- [ ] Form initial value does not leak between selected nodes.
- [ ] Readonly node drawer remains readable but non-editable.

## Done when

The node drawer feels like a normal configuration panel: no distracting navigation row, no forced jumping between sections, and common fields are immediately visible while advanced fields stay out of the way.
