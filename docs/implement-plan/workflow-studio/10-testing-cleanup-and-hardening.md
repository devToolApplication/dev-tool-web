# Phase 10 — Testing, Cleanup and Hardening

## Goal

Finish production readiness, verify architecture constraints and remove temporary/spike code or unnecessary graph dependencies.

## Tasks

### 1. Unit Tests

Cover at minimum:

- API mapper
- domain mapper
- editor metadata mapper
- WorkflowEditorStore
- WorkflowValidator
- ELK mapper/layout adapter
- polling logic
- runtime status mapper
- history/undo-redo

Important mapper tests:

- AI_GATE round trip preserves all fields
- editor-only state never leaks into semantic workflow fields
- runtime-only state never leaks into update payloads
- edge branch semantics survive round trip

### 2. Component Tests

Cover:

- all node components
- workflow connection component
- node palette
- node inspectors
- Problems panel
- WorkflowCanvas
- builder header/actions
- runtime inspector

### 3. Storybook

Create stories for reusable workflow presentation components.

At minimum, AI Gate stories:

- default
- selected
- invalid
- running
- waiting external
- completed
- error

Also cover shared node shell, other node types, connections, palette and relevant inspector states.

### 4. Playwright E2E

Primary scenario:

1. Open Workflows.
2. Create workflow.
3. Add START.
4. Add AI_GATE.
5. Add END.
6. Connect graph.
7. Configure AI gate.
8. Validate.
9. Save.
10. Refresh and verify graph/layout survives.
11. Publish.
12. Run with input.
13. Open Run Detail.
14. Verify execution status visualization.
15. Open node runtime inspector.
16. Retry a failed run where the test fixture supports it.

Add focused E2E coverage for unsaved-change protection and readonly published/runtime modes.

### 5. Performance Verification

Test representative graph sizes:

- 20 nodes
- 50 nodes
- 100 nodes
- 250 nodes

Measure/observe:

- initial render
- drag responsiveness
- selection responsiveness
- auto layout duration
- runtime refresh/update behavior

Optimize only based on measured bottlenecks. Do not add premature complexity.

### 6. JointJS Cleanup

Search the entire repository for JointJS consumers.

If no consumers remain:

- remove `@joint/core`
- remove unused JointJS helpers/styles
- update lock file
- verify build/tests

If consumers remain:

- keep the dependency
- document where and why it remains
- ensure workflow code does not accidentally depend on both graph engines

### 7. Remove Spike/Temporary Code

Remove:

- Phase 01 temporary spike pages/components
- mock production data no longer required
- debug buttons
- `console.log`
- obsolete TODOs
- dead adapters/services
- duplicated canvas logic

### 8. Clean Code Review

Verify:

- no unjustified `any`
- no Foblex types leaking into workflow domain/API
- no duplicated domain/editor state without clear ownership
- no HTTP calls inside presentation components
- no giant page/canvas/inspector components doing unrelated work
- immutable/store-based editor mutations
- semantic names for workflow actions and models
- no business rules hidden in CSS/template-only logic

### 9. Required Commands

Run at minimum:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Run relevant Storybook and Playwright suites as supported by the repository scripts/environment.

## Acceptance Criteria

- All previous phases meet their acceptance criteria.
- Unit/component/E2E tests cover critical workflow paths.
- Typecheck, lint, tests and build pass.
- No Phase 01 spike code remains.
- Workflow domain/API remain independent from Foblex.
- No unnecessary graph dependency remains.
- Code is ready for normal maintenance rather than being a prototype.
