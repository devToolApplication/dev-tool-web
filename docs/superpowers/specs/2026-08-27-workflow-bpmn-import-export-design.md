# Workflow BPMN Import/Export Design

## Scope

Add BPMN file import and export to the Workflow Studio edit screen. The feature applies to the existing BPMN editor only; it does not add backend APIs, BPMN conversion, or a second editor.

## User Experience

The canvas toolbar gets two icon buttons:

- Import BPMN: opens a native file picker accepting `.bpmn` and `.xml`.
- Export BPMN: downloads the current workflow XML as a `.bpmn` file.

Import is disabled in readonly mode. Export stays available when a workflow is loaded. Imported XML replaces the current draft BPMN XML and marks the workflow dirty through the existing store update flow. Save, validate, publish, and reload continue to use the existing BPMN XML API contract.

## Architecture

`WorkflowBuilderPageComponent` owns browser file actions because it already connects toolbar commands, `store.bpmnXml()`, and `updateBpmnXml()`. A hidden file input is triggered from the toolbar. `File.text()` reads the selected file, then `store.updateBpmnXml(xml)` updates the draft.

Export uses `Blob`, `URL.createObjectURL`, and a temporary anchor to download `store.bpmnXml()`. The filename is derived from the workflow name and sanitized with a small local helper.

`WorkflowBpmnCanvasComponent` remains the only owner of `bpmn-js` internals. Invalid imported BPMN is handled by the existing canvas import failure path and validation flow.

## Error Handling

Reject empty files and non-BPMN/XML extensions before updating the store. File read failures show the existing toast/error message path. The file input is reset after each import attempt so the same file can be reselected.

## Testing

Add focused component tests for:

- importing a valid `.bpmn` file calls `updateBpmnXml`/updates the store path;
- import is ignored in readonly mode;
- exporting creates a `.bpmn` download with the current XML and sanitized filename.

Run targeted Angular tests plus typecheck after implementation.

## Deliberate Simplifications

No server-side file storage, no multipart upload endpoint, no import merge mode, and no custom BPMN validation before save. Add those only when users need shared file libraries, partial imports, or immediate semantic validation during import.
