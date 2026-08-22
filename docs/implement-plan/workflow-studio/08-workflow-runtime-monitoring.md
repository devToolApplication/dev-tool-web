# Phase 08 — Workflow Runtime Monitoring

## Goal

Visualize real workflow execution using the same workflow canvas and provide enough execution detail to diagnose failures.

## Tasks

### 1. Run List

Route:

```text
/ai-agent-mcrs/workflow-runs
```

Support:

- pagination
- status filter
- workflow filter where backend API allows it
- navigation to run detail

### 2. Run Detail

Route:

```text
/ai-agent-mcrs/workflow-runs/:runId
```

Reuse `WorkflowCanvasComponent` in runtime mode.

Do not implement a second graph renderer.

### 3. Execution Overlay

Map node execution statuses:

- PENDING
- READY
- RUNNING
- WAITING_EXTERNAL
- COMPLETED
- ERROR
- TIMED_OUT
- CANCELLED
- SKIPPED

Runtime state is overlay data and must not mutate workflow definitions.

### 4. Runtime Inspector

Tabs:

- Overview
- Input
- Output
- Evidence
- Execution
- Error

Display where available:

- status
- outcome
- attempt
- inputSnapshot
- output
- evidence
- reason
- errorCode
- errorMessage

Use existing CodeMirror/JSON display capabilities for structured payloads.

### 5. Refresh Strategy

Until workflow push transport exists, poll only active runs.

Poll for active statuses such as:

- PENDING
- RUNNING
- WAITING_EXTERNAL

Stop polling for terminal statuses:

- COMPLETED
- ERROR
- TIMED_OUT
- CANCELLED

Keep polling orchestration outside the canvas component.

### 6. Retry

Use the existing workflow retry API.

After retry:

- refresh run state
- keep the same run-detail experience where the backend contract expects it
- reset polling according to returned status

### 7. Codex/External Execution Detail

The workflow UI should remain owned by AI Agent MCRS.

Do not make the browser call Codex SDK directly merely to reconstruct workflow status. If external execution detail is needed, expose it through the orchestration/backend contract or a dedicated secured integration endpoint.

## Pseudocode

```ts
startPolling(runId: string): void {
  this.pollUntilTerminal(() => this.api.getRun(runId), run => {
    this.runStore.setRun(run);
    return isTerminal(run.status);
  });
}
```

## Tests

- run list loads
- status mapper maps every backend execution status
- runtime overlay maps execution by nodeId
- runtime mode cannot edit graph
- failed node opens runtime inspector
- polling starts only for active runs
- polling stops on terminal state
- retry refreshes run state
- runtime updates do not mark workflow editor dirty

## Acceptance Criteria

- User can see exactly which node is running, waiting, completed or failed.
- User can inspect execution input/output/evidence/errors.
- Canvas is reused from design mode.
- Runtime monitoring does not bypass AI Agent MCRS orchestration authority.
