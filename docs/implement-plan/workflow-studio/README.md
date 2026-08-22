# Workflow Studio Implementation Plan

## Goal

Build Workflow Studio for AI Agent MCRS using:

- Angular 21
- `@foblex/flow`
- `@foblex/flow-elk-layout`
- Angular Signals
- existing shared UI components
- existing Workflow Admin APIs

## Execution Rules

AI MUST execute phases in order.

Do not implement a later phase until the acceptance criteria of the current phase pass.

For every phase:

1. Read this README.
2. Read the phase file.
3. Inspect existing project code before modifying anything.
4. Reuse existing shared UI components and project conventions.
5. Do not duplicate existing abstractions.
6. Keep workflow domain state independent from Foblex.
7. Add or update tests for all new behavior.
8. Run `npm run typecheck`, `npm run lint`, `npm test`, and the relevant build/test commands.
9. Review changed code for clean-code violations.
10. Complete the phase checklist before moving to the next phase.

## Architecture Rules

Foblex is rendering/editing infrastructure only.

Required dependency direction:

```text
Backend DTO
  -> Workflow Domain
  -> Editor Store
  -> Canvas Adapter
  -> Foblex
```

Canvas events must flow in the opposite direction through application actions:

```text
Foblex
  -> Editor Action
  -> Editor Store
  -> Domain Model
```

Never use Foblex graph objects as the backend workflow model.

## Important Backend Constraints

Before building branch-aware canvas UX, resolve:

1. `WorkflowEdge` semantics beyond source/target when the runtime needs branch/outcome/port information.
2. Persistence of editor-only metadata such as node positions and viewport.

Execution semantics must not be hidden inside UI-only metadata.

## Phase Order

1. Contract alignment and Foblex spike
2. Workflow domain and API
3. Editor store and canvas core
4. Workflow nodes and connections
5. Node inspector and configuration
6. Validation and persistence
7. Workflow lifecycle
8. Workflow runtime monitoring
9. Editor productivity and UX
10. Testing, cleanup and hardening

## Definition of Done

A phase is complete only when:

- implementation works against the agreed contracts
- tests pass
- lint passes
- typecheck passes
- build passes where applicable
- no temporary/mock production code remains
- no TODO remains for requirements belonging to that phase
- code respects project architecture and existing shared UI conventions
