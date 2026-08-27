# Technical Design

## Source Spec

See `docs/superpowers/specs/2026-08-26-workflow-flowable-native-service-task-fe-design.md`.

## Implementation Shape

- `src/app/features/workflow-studio/bpmn/flowable/flowable-moddle.ts`
  declares Flowable 7.2.0 extension attributes and extension elements used by
  Service Task.
- `flowable-service-task-mapper.ts` reads and writes a typed view model against
  the bpmn-js business object.
- `flowable-properties-provider.ts` adds Flowable groups to the native
  bpmn-js properties panel.
- `workflow-bpmn-canvas.component.ts` registers the descriptor and provider.

## Simplifications

- No new npm dependency for Flowable moddle.
- No raw XML editor.
- Legacy custom task JSON is not rendered in the new provider.
