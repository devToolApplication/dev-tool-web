# Workflow BPMN Editor Coverage Design

## Goal

Phase 2 makes the Workflow Studio BPMN editor capable of creating, selecting, configuring, saving, and reloading the BPMN elements needed by the KOC production roadmap. BPMN XML remains the only workflow source of truth.

## Scope

- Use native `bpmn-js` modeling, palette, context pad, DI, and XML serialization.
- Configure the app-specific fields needed by external workers on `bpmn:ServiceTask`.
- Configure common executable BPMN metadata for gateways, sequence flows, timers, messages, boundary errors, call activities, subprocesses, pools, lanes, and message flows.
- Preserve unknown BPMN and Flowable metadata during round-trip.
- Add regression coverage for frontend XML editing and backend Flowable validation.

## User Experience

The builder page keeps one main canvas. The native BPMN palette and context pad are visible in design mode so users can create BPMN elements without a custom graph palette.

Selecting an element opens a properties drawer beside the canvas. The drawer shows only fields that apply to the selected element:

- All supported elements: ID, type, name.
- Service tasks: task preset, Flowable topic, and JSON task config.
- Sequence flows: name, condition expression, and default-flow flag when the source supports defaults.
- Gateways: name and default flow where applicable.
- Timer events: timer type and timer expression.
- Message events: message reference/name.
- Error boundary events: error reference/name.
- Call activity: called element.
- Subprocess/event subprocess: name and triggered-by-event flag when supported.
- Lane/pool/message flow: name and participant/message metadata that `bpmn-js` can serialize.

Readonly/runtime modes keep the canvas selectable, but properties are not editable.

## Architecture

`WorkflowBpmnCanvasComponent` owns all direct `bpmn-js` modeler access. It emits a small serializable selected-element config to the page and accepts config patches back through methods. The builder page does not parse XML or mutate BPMN internals.

A new generic BPMN properties drawer owns form state and validation. Existing legacy graph drawers stay unused unless later deleted with the remaining legacy graph model.

Backend remains Flowable-only. Phase 2 adds validation regression tests proving the accepted BPMN subset parses through Flowable; it does not introduce a compiler or custom runtime semantics.

## Data Flow

1. `bpmn-js` imports `store.bpmnXml()`.
2. User edits the diagram or element properties.
3. Canvas saves formatted XML and emits `bpmnXmlChange`.
4. Store updates the active draft `bpmnXml`.
5. Save/publish/validate call the existing BPMN XML API contract.

## Error Handling

Invalid JSON fields stay in the drawer and do not update XML. Invalid BPMN structure is reported by the existing backend validation endpoint and highlighted through validation issues.

Unsupported selected element types show read-only ID/type/name rather than failing.

## Acceptance

- `bpmn-js` native palette and context pad are available in design mode.
- Service task preset updates Flowable external worker attributes and persists through XML save/reload.
- Timer/message/error event metadata can be edited when the selected BPMN element supports it.
- Sequence flow condition/default metadata can be edited without graph DTO conversion.
- Pool/lane/message flow and subprocess/call activity elements round-trip through the editor.
- `npm run build` and `npm run typecheck` pass.
- Targeted frontend BPMN tests pass.
- Backend BPMN validator tests include the Phase 2 element subset.

## Non-Goals

- No custom BPMN compiler.
- No Phase 3 external-worker error semantics.
- No KOC domain/resource model changes.
- No full custom replacement for `bpmn-js` palette or properties panel.
