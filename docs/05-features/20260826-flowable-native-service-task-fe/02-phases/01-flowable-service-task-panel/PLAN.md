# Phase 01 Plan: Flowable Service Task Panel

## Objective

Implement Flowable-native Service Task editing in the existing bpmn-js
properties panel.

## Tasks

1. Mapper red tests: implementation selection, variable mappings, fields,
   execution flags, exceptions, listeners.
2. Mapper implementation: read/write Flowable attrs and extension elements.
3. Provider red tests: Service Task gets Flowable groups and non-Service Task
   does not.
4. Provider implementation: render grouped entries with installed
   `@bpmn-io/properties-panel` controls.
5. Canvas wiring: register `moddleExtensions.flowable` and
   `FlowablePropertiesProviderModule`.
6. Verification: targeted tests, typecheck, build.

## Acceptance

- Selecting a Service Task shows Flowable groups beyond General and
  Documentation.
- FE edits only Flowable-native fields for Service Task.
- External worker topic appears only for `flowable:type="external-worker"`.
- `flowable:externalWorkerInParameter` and
  `flowable:externalWorkerOutParameter` rows serialize through extension
  elements.
- No active FE editor for custom task JSON.
