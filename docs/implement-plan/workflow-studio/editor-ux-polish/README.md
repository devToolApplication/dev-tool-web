# Workflow Editor UX Polish Plan

## Status

This plan targets the current `master` implementation after the workflow builder layout refactor and AI Gate catalog work. It is the follow-up plan for Edit Workflow UX and supersedes the remaining UX items in `../workflow-builder-layout-drawer-plan.md` where the current code has already moved metadata above the canvas, moved node config into a drawer, and made the palette collapsible.

## Goals

Improve Edit Workflow without redesigning the workflow domain or replacing the shared Flow Builder core.

Target outcomes:

- Canvas remains the dominant workspace.
- Edit pages start with workflow details collapsed; create pages start expanded.
- All important editor commands are discoverable from one command bar.
- Node and edge selection use one inspector drawer.
- The drawer no longer shows the distracting section-navigation tabs/checkmarks; configuration reads vertically with collapsible sections.
- Problems behave like an IDE panel and navigate users back to the failing element.
- AI Gate catalog loading/error/empty states are explicit.
- Input Mapping and Criteria no longer require raw JSON for normal editing.
- Raw JSON remains available only as an advanced fallback.
- Invalid JSON/config input never fails silently.

## Non-goals

- Do not change workflow execution semantics, API contracts, persistence format, or graph engine unless required by an identified bug.
- Do not hard-code KOC-specific criteria into generic Workflow Studio components.
- Do not move workflow-specific components into `shared/ui` unless there is a second real consumer.
- Do not create a second workflow editor implementation.

## Delivery order

1. `01-workspace-and-command-bar.md`
2. `02-inspector-drawer-ux.md`
3. `03-node-edge-and-problems.md`
4. `04-ai-gate-catalog-and-input-mapping.md`
5. `05-criteria-validation-and-cleanup.md`

Each phase must compile, pass focused tests, and be independently reviewable before the next phase starts.

## Architecture boundary

```text
WorkflowBuilderPage
  ├─ WorkflowCanvas
  ├─ WorkflowProblemsPanel
  └─ WorkflowElementInspector
       ├─ WorkflowNodeInspector
       │    ├─ AiGateInspector
       │    ├─ CodeGateInspector
       │    └─ LogicInspector
       └─ WorkflowEdgeInspector
```

`WorkflowBuilderPage` owns page lifecycle, global commands, selection orchestration, drawer visibility, save/publish/run/version actions. Node-specific form logic, catalog loading, mapping conversion, and criteria conversion stay inside inspector components/services.

## Global engineering rules

- Reuse existing shared UI primitives before creating new ones.
- Preserve translate keys; do not introduce visible hard-coded English/Vietnamese text.
- Use existing theme tokens; do not hard-code colors.
- Keep readonly behavior explicit for every mutation command.
- Toolbar, keyboard shortcut, and context-menu actions must converge on the same command path.
- Do not swallow errors into empty arrays when the UI needs to distinguish loading, empty, and error states.
- Add/adjust unit and component tests in the same phase as the implementation.
- Prefer feature-local changes first. Change shared Flow Builder only when the capability is genuinely reusable.

## Final acceptance checklist

- [ ] Edit workflow opens with details collapsed; create workflow opens expanded.
- [ ] Command bar exposes Undo, Redo, Auto Layout, Fit, Zoom, Reset, Minimap, Fullscreen, contextual Duplicate/Delete.
- [ ] Drawer has no permanent section-navigation tabs/checkmarks.
- [ ] Drawer uses vertical sections and sensible default collapse state.
- [ ] Drawer width is comfortable for config editing and responsive.
- [ ] Clicking a node opens node config; clicking an edge opens edge config.
- [ ] Problems default collapsed when empty and expand after failed validation.
- [ ] Clicking a problem selects/reveals the related node/edge and opens its inspector.
- [ ] AI Gate catalogs expose loading/empty/error/retry states.
- [ ] Input Mapping has a structured editor; raw JSON is advanced-only.
- [ ] Criteria has a generic structured editor; raw JSON is advanced-only.
- [ ] Invalid JSON/config input produces visible validation and never silently disappears.
- [ ] Readonly mode cannot mutate graph or configuration.
- [ ] Focused tests cover the end-to-end Edit Workflow interaction path.
