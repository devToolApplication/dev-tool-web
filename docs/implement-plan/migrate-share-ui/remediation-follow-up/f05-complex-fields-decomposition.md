# F05 — Complex Form Field Decomposition

## Goal

Stop generic form internals from becoming domain editors. Split Tree/Array/Record/Secret/JSON responsibilities into composable components and pure logic.

## Scope

```text
src/app/shared/ui/patterns/form-input/component/field-array-renderer/
src/app/shared/ui/patterns/form-input/component/field-record-renderer/
src/app/shared/ui/patterns/form-input/component/field-tree-renderer/
src/app/shared/ui/patterns/form-input/component/field-secret-metadata-renderer/
src/app/shared/ui/patterns/form-input/component/json-field-block/
```

## 1. Tree decomposition

Current Tree renderer owns too many responsibilities: search, filters, selection, picker, mutation, JSON, keyboard, focus, confirmation, caching and presentation.

Target structure:

```text
complex/tree/
  tree-editor/
  tree-view/
  tree-picker/
  tree-toolbar/
  tree-selection-panel/
  tree-node/
  logic/
    tree-filter.ts
    tree-selection.ts
    tree-mutation.ts
    tree-view-model.ts
```

`FieldTreeRenderer` may remain only as an internal form adapter:

```text
FieldState <-> TreeEditor/TreeView
```

It should not contain tree algorithms.

## 2. Extract pure tree logic

Pure functions should handle:

```text
filtering
flattening
selection state
ancestor expansion
add/remove/replace/move
preset application
```

Unit test these without Angular TestBed.

## 3. Array/repeater

Create a reusable repeater behavior:

```text
add
remove
reorder
keyboard reorder
stable item identity
```

Keep array field adapter thin.

## 4. Record -> KeyValueEditor

Create reusable `KeyValueEditor` responsibility. The form adapter only maps field state to/from it.

## 5. Secret metadata -> Credential editor

Remove OAuth/credential-specific properties from generic `FormConfig`.

Create dedicated editor types/components such as:

```text
CredentialEditor
OAuthCredentialEditor
SecretMetadataEditor
```

Generic form schema references a custom field/editor registration instead of knowing `clientId`, `clientSecret`, `tokenUrl`, grant type, username/password fields.

## 6. JSON/code editors

Separate:

```text
JsonEditor
CodeEditor
AdvancedConfigEditor
```

Formatting/validation/expansion behavior belongs to these editors, not generic TextField config.

## 7. Confirmation boundary

Complex editor generic UI may request a destructive confirmation through a generic overlay primitive, but feature/business policy must not be embedded in field schema.

## Tests

Tree pure logic:

```text
filter
selection strategies
add/remove/replace/move
presets
ancestor expansion
```

Component interaction:

```text
readonly tree view
editable tree editor
picker
keyboard navigation
advanced JSON apply/reset
array reorder
key/value add/remove
credential editor field mapping
```

## Search gates

```bash
rg "clientIdPlaceholder|clientSecretPlaceholder|tokenUrlPlaceholder|grantTypeOptions|usernamePlaceholder|passwordPlaceholder" src/app/shared/ui/patterns/form-input/models
rg "class FieldTreeRenderer" -n src/app/shared/ui
```

Review class size and responsibility; Tree adapter should be small enough to understand without scrolling through unrelated algorithms.

## Definition of Done

- Tree algorithms extracted from Angular renderer;
- Tree readonly/edit components separated cleanly;
- array and record use reusable editor responsibilities;
- credential/OAuth schema removed from generic FormConfig;
- JSON/code editing split from generic text control behavior;
- tests cover pure logic and component interaction;
- form adapters remain internal and thin.
