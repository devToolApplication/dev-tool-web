# Rough Plan

## Inputs

- User wants FE first, pure Flowable support, no legacy topic presets.
- Backend uses `org.flowable:flowable-spring-boot-starter-process:7.2.0`.
- Existing FE uses `bpmn-js`, `bpmn-js-properties-panel`, and a native right
  panel.

## Decision

Use a custom bpmn-js properties provider with a local moddle descriptor. This is
smaller than replacing the properties panel with Angular UI and preserves the
current canvas layout.

## Tasks

1. Add Flowable Service Task mapper tests.
2. Add mapper and local descriptor.
3. Add properties provider tests.
4. Wire provider and moddle descriptor into `WorkflowBpmnCanvasComponent`.
5. Run targeted tests, typecheck, and build.

