# R05 — Complex Form Field Decomposition

## Objective

Stop the generic form package from becoming a home for large domain/editor implementations. Split complex fields into reusable editors plus thin form adapters.

## Scope

```text
field-array-renderer/**
field-record-renderer/**
field-group-renderer/**
field-tree-renderer/**
field-secret-metadata-renderer/**
json-field-block/**
complex field models currently embedded in form-config.model.ts
```

## Target architecture

```text
Form Engine
  -> FieldRenderer (internal)
      -> simple primitive adapter
      -> complex-field adapter
          -> reusable specialized editor
```

A specialized editor may exist outside generic form internals because it owns a distinct interaction model.

## 1. Array -> Repeater pattern

Keep form-specific adapter thin.

Reusable responsibilities:

```text
render repeated items
add item
remove item
move up/down
accessible item identity
optional min/max item constraints
```

Move mutation operations to explicit state helpers/pure functions.

Tests:

```text
add
remove
move
preserve nested values
keyboard-reachable controls
accessible labels for remove/move
```

## 2. Record -> KeyValueEditor

Extract a reusable editor:

```ts
interface KeyValueEntry<TValue = string> {
  key: string;
  value: TValue;
}
```

Validation:

```text
empty key
duplicate key
required value where configured
```

The form renderer maps form field state to `KeyValueEditor`; it does not implement key/value table behavior itself.

## 3. Group renderer stays internal and structural

A group is primarily form structure. Remove generic visual flags that create another component-design system inside the form schema.

Avoid generic group properties like:

```text
variant warning/danger/muted
density compact/comfortable
card by default
collapsible by default
```

Only advanced sections/groups with a real UX reason should collapse.

## 4. Split Tree renderer

The current Tree renderer owns too many responsibilities: filtering, selection, presets, picker, expansion, node mutation, confirmation, advanced JSON, caching and focus.

Target package:

```text
complex/tree/
  tree-editor/
  tree-view/
  tree-toolbar/
  tree-picker/
  tree-selection-panel/
  tree-node/
  logic/
    tree-filter.ts
    tree-selection.ts
    tree-mutation.ts
    tree-view-model.ts
```

`FieldTreeRenderer` becomes a thin adapter or is removed if FieldRenderer can compose the specialized editor directly.

Pure logic should be testable without Angular DOM:

```ts
filterTree(nodes, query)
toggleSelection(nodes, nodeId, strategy)
addNode(nodes, parentId, node)
removeNode(nodes, nodeId)
moveNode(nodes, nodeId, target)
collectSelected(nodes)
```

Avoid hand-written caches in the Angular component when memoization/computed state can be represented clearly.

## 5. Move credential/secret domain fields out of generic schema

Generic FormConfig must not contain OAuth/domain-specific properties such as:

```text
tokenUrl
clientId
clientSecret
grantType
scope
username
password
secret-specific placeholders
```

Extract a specialized credential editor, for example:

```text
complex/credential-editor/
  credential-editor
  oauth-credential-editor
  secret-metadata-editor
```

The generic form engine sees a custom/specialized field type with an adapter contract, not OAuth internals.

## 6. JSON and code editors

Differentiate:

```text
small inline text field
JSON editor with validation
CodeMirror code editor
advanced whole-model editor
```

Do not keep all of these as flags on a generic text field.

## 7. Specialized field registry

If multiple custom fields exist, introduce a small registry/adapter mechanism rather than extending a giant `FieldConfig` union forever.

Conceptual contract:

```ts
interface CustomFieldDefinition<TValue = unknown> {
  type: string;
  component: Type<unknown>;
  normalize?(value: unknown): TValue;
}
```

Keep implementation Angular-appropriate; the goal is decoupling, not unnecessary runtime dynamism.

## Tests

### Pure logic

```text
tree filter
selection strategy
add/remove/move
record duplicate validation
array reorder
```

### Component

```text
Tree keyboard navigation
Tree picker open/close/focus
selection announcement
array add/remove labels
KeyValueEditor errors
Credential secret visibility behavior
JSON parse error preserves draft
```

### Form integration

One representative form must contain:

```text
array
record/key-value
tree
credential/custom field
JSON/code field
```

and pass value/validation/dirty-state flows through FormInput.

## Definition of Done

- Tree logic is no longer concentrated in one god component.
- Generic FormConfig no longer carries OAuth/credential internals.
- Record behavior is a reusable KeyValueEditor.
- Array behavior is a clean repeater pattern.
- Group renderer is structural and internal.
- JSON/code editors have clear responsibilities.
- Complex-field tests cover pure logic and form integration.
- Shared public API does not expose unnecessary internal renderer classes.