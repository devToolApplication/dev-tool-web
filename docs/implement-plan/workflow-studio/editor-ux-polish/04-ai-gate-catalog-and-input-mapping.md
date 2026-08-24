# Phase 4 - AI Gate Catalog States and Structured Input Mapping

## Goal

Keep the new Agent/Provider/Output Schema catalog design, but make loading failures visible and remove raw JSON as the normal way to edit Input Mapping.

## Main files

```text
src/app/features/workflow-studio/inspector/ai-gate-inspector.component.ts
src/app/features/workflow-studio/inspector/workflow-node-inspector.model.ts
src/app/features/workflow-studio/inspector/workflow-node-form-inspector.component.html
src/app/features/workflow-studio/inspector/fields/workflow-input-mapping-editor/*
src/app/features/workflow-studio/api/workflow-api.service.ts
src/app/features/workflow-studio/inspector/*spec.ts
```

Use existing field-extension/custom-template mechanisms in the form framework if available. Do not force a generic shared form component to understand `InputMapping` as a workflow domain type.

## 1. Explicit catalog state

Current error handling must not collapse API failure into an empty list.

Represent at least these states:

```ts
type CatalogLoadState = 'loading' | 'ready' | 'empty' | 'error';
```

Maintain state separately for:

- agents;
- output schemas;
- provider options are derived from selected agent and therefore must distinguish `no agent selected` from `selected agent has no available provider`.

Pseudo-code:

```ts
readonly agentState = signal<CatalogLoadState>('loading');
readonly agents = signal<WorkflowAgentCatalogItem[]>([]);

loadAgents(): void {
  this.agentState.set('loading');
  this.api.getAgents().subscribe({
    next: items => {
      this.agents.set(items ?? []);
      this.agentState.set(items?.length ? 'ready' : 'empty');
    },
    error: () => {
      this.agents.set([]);
      this.agentState.set('error');
    },
  });
}
```

Do the equivalent for output schemas.

## 2. UI behavior for catalog states

Agent field:

```text
loading -> Loading agents...
empty   -> No agents configured
error   -> Unable to load agents + Retry
ready   -> normal select
```

Output Schema follows the same pattern.

Rules:

- Do not silently select an arbitrary agent.
- If selected agent becomes unavailable/unhealthy, preserve the current persisted value but clearly mark it invalid/unavailable rather than unexpectedly clearing user data.
- Provider options remain constrained by the selected agent catalog entry.
- Unhealthy/unavailable options must be visually disabled and labelled through translated text.
- Retry re-runs only the failed catalog request where practical.

## 3. Structured Input Mapping editor

Normal users should not need to type this:

```json
{
  "mapping": {
    "candidate": "${input.candidate}",
    "evidence": "${input.evidence}"
  }
}
```

Target compact UI:

```text
INPUT MAPPING

candidate   [ ${input.candidate} ]   x
evidence    [ ${input.evidence}  ]   x

+ Add input
```

Create a feature-local reusable editor such as:

```text
inspector/fields/workflow-input-mapping-editor/
```

Suggested API:

```ts
@Input() value: InputMapping = { mapping: {} };
@Input() readonly = false;
@Output() readonly valueChange = new EventEmitter<InputMapping>();
```

## 4. Mapping editor behavior

Support:

- add mapping row;
- edit mapping key;
- edit mapping value/expression;
- remove mapping row;
- duplicate keys show validation and do not overwrite another row silently;
- empty key is invalid;
- readonly mode cannot add/remove/edit;
- preserve stable ordering in the editor where possible;
- convert editor rows back into the existing `InputMapping` model only; do not change persistence shape.

Pseudo conversion:

```ts
function rowsToInputMapping(rows: MappingRow[]): InputMapping | null {
  if (hasDuplicateOrEmptyKeys(rows)) return null;

  return {
    mapping: Object.fromEntries(
      rows.map(row => [row.key.trim(), toJsonValueOrString(row.value)])
    ),
  };
}
```

Do not over-parse expression strings such as `${input.candidate}` unless the current model requires it.

## 5. Advanced raw JSON fallback

Raw JSON remains available for power users but must not be the primary control.

Target:

```text
INPUT MAPPING
  structured rows...

> Advanced
    Edit raw JSON
```

Both structured and raw views must operate on the same source value.

```text
Structured editor
       |
       v
   InputMapping
       ^
       |
Raw JSON editor
```

Do not maintain two independent states that can drift.

When raw JSON is invalid:

- show validation error immediately;
- do not overwrite the last valid model;
- keep the user's invalid draft visible so they can fix it;
- do not emit a successful node patch.

## 6. Output Schema behavior

Keep the catalog-backed auto-complete/select behavior, but ensure defaulting does not surprise the user.

Recommended rule:

- For a new AI Gate with no schema value, apply configured default once after a successful catalog load.
- For an existing node with a persisted schema, never replace it merely because catalog loading returned a different default.
- If persisted schema no longer exists, show it as unavailable/invalid and let the user choose a replacement.

## Tests

- [ ] Agent field shows loading state.
- [ ] Agent API error shows explicit error and Retry.
- [ ] Empty agent catalog is different from API error.
- [ ] Unhealthy agent is not silently selectable.
- [ ] Provider list updates when agent changes.
- [ ] Existing provider is corrected only when invalid for a deliberate agent change, not due to transient load state.
- [ ] Output Schema has loading/empty/error states.
- [ ] New node gets default output schema once catalog is ready.
- [ ] Existing persisted schema is preserved.
- [ ] Mapping rows round-trip to the existing `InputMapping` shape.
- [ ] Duplicate/empty keys show visible validation.
- [ ] Add/remove/edit mapping works.
- [ ] Readonly mapping editor cannot mutate.
- [ ] Advanced raw JSON and structured editor stay synchronized.
- [ ] Invalid raw JSON does not emit a node patch.

## Done when

AI Gate configuration clearly explains catalog failures and normal Input Mapping editing no longer requires users to understand the persisted JSON structure.
