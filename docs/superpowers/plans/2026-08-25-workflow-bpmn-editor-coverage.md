# Workflow BPMN Editor Coverage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Phase 2 BPMN editor coverage while keeping BPMN XML as the only workflow source of truth.

**Architecture:** Keep `WorkflowBpmnCanvasComponent` as the only owner of `bpmn-js` internals. Add one serializable selected-element config contract plus one generic properties drawer. Use native `bpmn-js` palette/context pad and update BPMN modeler properties directly before emitting XML.

**Tech Stack:** Angular 21, signals, `bpmn-js`, existing shared `app-*` controls, Java 21/Spring Boot Flowable validator tests.

---

### Task 1: Canvas BPMN Element Contract

**Files:**
- Modify: `src/app/features/workflow-studio/bpmn/workflow-bpmn-canvas.component.ts`
- Modify: `src/app/features/workflow-studio/bpmn/workflow-bpmn-canvas.component.scss`
- Test: `src/app/features/workflow-studio/bpmn/workflow-bpmn-canvas.component.spec.ts`

- [ ] Add a `WorkflowBpmnElementConfig` interface with fields for `id`, `type`, `name`, `flowableTopic`, `flowableType`, `taskConfigJson`, `conditionExpression`, `defaultFlow`, `timerKind`, `timerExpression`, `messageRef`, `messageName`, `errorRef`, `errorName`, `calledElement`, and `triggeredByEvent`.
- [ ] Emit `elementSelected` with the config when `element.click` fires.
- [ ] Add `updateElementConfig(config)` that finds the selected element, applies supported fields through `modeling`, `moddle`, and business object attrs, then emits saved XML.
- [ ] Remove CSS that hides `.djs-palette` and `.djs-context-pad`; disable pointer events only in readonly/runtime mode.
- [ ] Replace stale `nodeAdded/addNode` spec with selection/config/update specs.

### Task 2: Properties Drawer

**Files:**
- Create: `src/app/features/workflow-studio/bpmn/workflow-bpmn-properties-drawer.component.ts`
- Create: `src/app/features/workflow-studio/bpmn/workflow-bpmn-properties-drawer.component.html`
- Modify: `src/app/features/workflow-studio/bpmn/workflow-bpmn-node-drawer.component.scss`
- Modify: `src/app/features/workflow-studio/workflow-studio.module.ts`
- Test: `src/app/features/workflow-studio/bpmn/workflow-bpmn-properties-drawer.component.spec.ts`

- [ ] Render general ID/type/name fields for all selected elements.
- [ ] Render service task preset/topic/config JSON fields only for `bpmn:ServiceTask`.
- [ ] Render sequence-flow condition/default fields only for `bpmn:SequenceFlow`.
- [ ] Render timer/message/error/call activity/subprocess fields only for matching BPMN types.
- [ ] Reject invalid JSON locally and do not emit config changes.

### Task 3: Builder Wiring

**Files:**
- Modify: `src/app/features/workflow-studio/pages/workflow-builder-page.component.ts`
- Modify: `src/app/features/workflow-studio/pages/workflow-builder-page.component.html`
- Modify: `src/app/features/workflow-studio/pages/workflow-builder-page.component.css`
- Test: `src/app/features/workflow-studio/pages/workflow-builder-page.component.spec.ts`

- [ ] Store the latest selected BPMN element config in a signal.
- [ ] Pass canvas `elementSelected` into that signal.
- [ ] Render the properties drawer beside the canvas.
- [ ] On drawer changes, call `workflowBpmnCanvas.updateElementConfig(config)`.
- [ ] Clear the selected config when transient state closes or selection is cleared.

### Task 4: i18n

**Files:**
- Modify: `src/app/core/i18n/features/workflow-studio.i18n.json`

- [ ] Add Vietnamese and English labels for BPMN properties, presets, timer kind, message, error, call activity, subprocess, and unsupported selection.

### Task 5: Backend Validator Regression

**Files:**
- Modify: `D:/Code/ai-agent-mcrs/src/test/java/com/lamld/aiAgent/modules/workflowdefinition/application/validator/BpmnWorkflowValidatorTest.java`

- [ ] Add one valid BPMN XML fixture covering service task, boundary timer/error, intermediate timer/message, call activity, subprocess, gateways, lane, pool, and message flow.
- [ ] Assert `BpmnWorkflowValidator.validate(xml).valid()` is true.

### Task 6: Verification

**Commands:**
- `npm run build`
- `npm run typecheck`
- `npm test -- --watch=false --include src/app/features/workflow-studio/bpmn/workflow-bpmn-canvas.component.spec.ts --include src/app/features/workflow-studio/bpmn/workflow-bpmn-properties-drawer.component.spec.ts --include src/app/features/workflow-studio/pages/workflow-builder-page.component.spec.ts`
- `D:/Code/ai-agent-mcrs/mvnw.cmd "-Dtest=BpmnWorkflowValidatorTest" test`

Skipped: a full custom BPMN properties panel and Phase 3 runtime semantics. Add when users need unsupported BPMN extension fields or error/retry behavior.
