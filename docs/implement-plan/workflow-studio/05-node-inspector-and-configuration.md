# Phase 05 — Node Inspector and Configuration

## Goal

Provide typed configuration UI for each workflow node without requiring users to edit raw WorkflowGraph JSON.

## Tasks

### 1. Inspector Container

Render the proper inspector based on selected node type:

```text
AI_GATE   -> AiGateInspector
CODE_GATE -> CodeGateInspector
LOGIC     -> LogicInspector
START     -> Start inspector if backend exposes config
END       -> End inspector if backend exposes config
```

Inspector components update the EditorStore, never API DTO objects directly.

### 2. AI Gate Inspector

Sections:

- General
- Agent
- Prompt
- Decision
- Input
- Output
- Execution

Fields:

- id
- provider
- modelProfile
- toolProfile
- instruction
- criteria
- inputMapping
- outputSchema
- retryPolicy
- timeoutPolicy

### 3. Code Gate Inspector

Fields:

- id
- handler
- config
- inputMapping
- retryPolicy
- timeoutPolicy

Prefer typed controls when metadata is known.

Where configuration is truly dynamic, provide `Form | JSON` modes. JSON should be advanced mode, not the default UX.

### 4. Logic Inspector

Support operators:

- AND
- OR
- NOT
- N_OF_M
- SWITCH

The form must react to the selected operator.

Example N_OF_M:

```text
Operator: N_OF_M
Minimum success: 2
```

Example SWITCH:

```text
Expression: $.review.score
Cases:
>= 80 -> APPROVE
>= 50 -> MANUAL_REVIEW
default -> REJECT
```

The exact structure must follow the backend contract; do not invent runtime semantics only in UI.

### 5. START / END

Expose only configuration supported by backend contracts.

Do not invent fields merely for visual convenience.

## Pseudocode

```ts
updateAiGate(patch: Partial<AiGateWorkflowNode>): void {
  const selected = this.selectedNode();
  if (!selected || selected.type !== 'AI_GATE') return;
  this.editorStore.updateNode(selected.id, patch);
}
```

## Tests

- Selecting each node type opens the correct inspector.
- Inspector changes update EditorStore.
- Updating a node does not mutate the original loaded DTO.
- AI_GATE fields survive save/load round trip.
- CODE_GATE handler/config mapping works.
- LOGIC operator switching creates valid typed state.
- Invalid advanced JSON does not corrupt editor state.

## Acceptance Criteria

- Users can configure every supported workflow node through typed UI.
- Raw JSON is optional/advanced where unavoidable.
- No inspector performs HTTP directly.
- No node-specific form logic is embedded inside canvas rendering components.
