# F05 — Complex Form Field Decomposition

## Goal

Break god renderers into reusable UI components plus pure logic. Keep Form Engine generic and keep feature/domain-specific credential structures outside generic configuration.

## F05.1 — Tree architecture

Current `FieldTreeRenderer` owns too much: filtering, debounce, selection algorithms, picker state, mutation, keyboard/focus behavior, confirmation, JSON editor and rendering.

Target structure:

```text
patterns/form-input/complex/tree/
  tree-view/
  tree-editor/
  tree-node/
  tree-toolbar/
  tree-picker/
  tree-selection-panel/

patterns/form-input/complex/tree/logic/
  tree-filter.ts
  tree-selection.ts
  tree-mutation.ts
  tree-view-model.ts
```

Responsibilities:

```text
TreeView           -> read-only hierarchy presentation
TreeEditor         -> editor composition/orchestration
TreeNode           -> one tree node presentation/keyboard semantics
TreeToolbar        -> search/filter/view commands
TreePicker         -> add/replace source selection UI
TreeSelectionPanel -> selected item summary/actions
logic/*            -> pure immutable transformations/selectors
```

`FieldTreeRenderer` may remain only as an internal adapter:

```ts
field state -> TreeEditor/TreeView input/output contract
```

It must not contain hundreds of lines of business/UI algorithms.

## F05.2 — Tree pure logic tests

Test logic without Angular TestBed:

```text
filter tree by query
filter selected/leaf mode
selection state propagation
leafOnly/all/parentAndChildren strategy
clear selection
select descendants
move/add/remove/replace node
preserve/drop children replacement behavior
flatten/view-model paths
```

UI tests then focus on event wiring and accessibility.

## F05.3 — Record -> KeyValueEditor

Create a reusable `KeyValueEditor` pattern/primitives composition.

`FieldRecordRenderer` only bridges:

```text
FieldState<Record<string, unknown>>
  -> rows [{key,value}]
  -> KeyValueEditor
  -> updated record
```

Pure functions should handle row<->record conversion and validation.

Readonly uses `KeyValueList`, not disabled inputs.

## F05.4 — Secret/Credential editors

Generic `FormConfig` must not encode OAuth/client secret business schema such as:

```text
tokenUrl
clientId
clientSecret
grantType
scope
username
password
```

Create explicit editors/contracts where those concepts belong, e.g.:

```text
CredentialEditor
OAuthCredentialEditor
SecretMetadataEditor
```

If generic FormInput must support extensions, use a custom field registry/renderer token rather than hardcoding all feature credential schemas into `FieldConfig`.

Readonly credential presentation is masked and copy behavior must be explicit/secure.

## F05.5 — JSON and Code editors

Separate:

```text
JsonEditor
CodeEditor
JsonViewer
```

Responsibilities:

- JSON syntax/parse validation in JsonEditor;
- CodeMirror/code language behavior in CodeEditor;
- readonly display in JsonViewer/code block;
- FieldRenderer only adapts Form state.

Do not bury editable advanced JSON inside Tree renderer; TreeEditor may compose JsonEditor as an optional advanced tool.

## F05.6 — Array repeater

Keep Array renderer thin. Extract pure immutable operations:

```ts
addItem<T>()
removeItem<T>()
moveItem<T>()
```

UI provides clear add/remove/reorder controls, accessible labels and stable identity.

## Tests

```text
Tree pure logic suite
Tree readonly hierarchy
Tree editor keyboard/select behaviors
KeyValueEditor add/remove/edit/duplicate-key validation
credential editor masking + required semantics
JSON parse error / valid apply
Code editor value propagation
array add/remove/reorder identity
```

## Search/review gates

Review size/responsibility of:

```text
FieldTreeRenderer
FieldSecretMetadataRenderer
FieldRecordRenderer
JsonFieldBlock
FieldArrayRenderer
```

Search feature credential terms in generic form config:

```bash
rg "tokenUrl|clientId|clientSecret|grantType|username|password|scope" src/app/shared/ui/patterns/form-input/models
```

Expected generic model business credential matches: zero, unless a consciously documented generic extension boundary requires a neutral type.

## Definition of Done

- Tree god component decomposed;
- tree algorithms are pure/tested;
- readonly TreeView reusable;
- record uses KeyValueEditor;
- feature/domain credential schema removed from generic FormConfig;
- JSON/Code editors have clear responsibility;
- array operations are simple/tested;
- thin internal field adapters only;
- quality gates pass.
