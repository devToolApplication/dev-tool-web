# Phase 02 — Workflow Domain and API Layer

## Goal

Create strongly typed frontend workflow models and API integration without introducing canvas concerns into the domain/API layer.

## Target Structure

```text
src/app/features/workflow/
├── api/
├── model/
├── workflow.routes.ts
├── workflow.module.ts
└── index.ts
```

Follow the existing `features/<domain>/model/pages/module/routes` conventions already used by the application.

## Tasks

### 1. Domain Models

Create a discriminated union:

```ts
type WorkflowNode =
  | StartWorkflowNode
  | CodeGateWorkflowNode
  | AiGateWorkflowNode
  | LogicWorkflowNode
  | EndWorkflowNode;
```

Create typed models for:

- WorkflowGraph
- WorkflowEdge
- WorkflowRuntimeConfig
- WorkflowDetail
- WorkflowVersion
- WorkflowRun
- WorkflowNodeExecution
- WorkflowEditorMetadata
- retry policy
- timeout policy
- input mapping

Do not introduce `config: any` as a generic escape hatch for all node types.

### 2. Mirror Backend Node Contracts

AI_GATE must preserve:

- id
- instruction
- criteria
- inputMapping
- provider
- modelProfile
- toolProfile
- outputSchema
- retryPolicy
- timeoutPolicy

Implement corresponding strongly typed contracts for CODE_GATE, LOGIC, START and END.

### 3. API Service

Implement `WorkflowApiService` methods for:

- `getWorkflowPage()`
- `getWorkflowDetail()`
- `createWorkflow()`
- `updateWorkflow()`
- `publishWorkflow()`
- `startWorkflow()`
- `getRunPage()`
- `getRun()`
- `retryRun()`

No Foblex types may appear in this service.

### 4. Explicit Mappers

Implement explicit mapping:

```text
API DTO <-> Domain Model
```

Keep editor metadata mapping explicit as well.

## Pseudocode

```ts
function mapWorkflowDetail(dto: WorkflowDetailDto): WorkflowDetail {
  return {
    ...,
    definition: mapGraph(dto.definition),
    runtime: mapRuntime(dto.runtime),
    editor: mapEditorMetadata(dto.editor),
  };
}
```

## Tests

- API response maps to domain model.
- Domain model maps to update/create payload.
- AI_GATE round trip preserves every field.
- Graph mapping preserves node types.
- Edge mapping preserves the contract agreed in Phase 01.
- Editor metadata round trip works.
- No Foblex/rendering state leaks into API payloads.

## Acceptance Criteria

- Frontend can load and save a workflow graph without a canvas.
- Domain contracts are strongly typed.
- API layer is independent from Foblex.
- Phase 01 edge/editor metadata decisions are represented correctly.
