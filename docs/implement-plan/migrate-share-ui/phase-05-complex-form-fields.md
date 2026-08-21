# Phase 05 — Complex Form Fields: Array, Record, Tree, Secret, JSON, Code

## Mục tiêu

Giảm tải generic form engine bằng cách tách các field phức tạp thành editor có boundary rõ. Vẫn sửa code hiện tại tại chỗ; không tạo bộ v2 song song.

## Scope hiện tại

Trong `src/app/shared/ui/patterns/form-input/component/`:

- `field-array-renderer`
- `field-record-renderer`
- `field-tree-renderer`
- `field-secret-metadata-renderer`
- `json-field-block`
- `field-group-renderer`

`field-tree-renderer` đặc biệt đang quá lớn và có nhiều responsibility.

## 1. Array field

### Rename/repurpose

`field-array-renderer` -> `repeater-field` hoặc giữ path nhưng rewrite implementation.

Nếu rename, migrate import trong cùng commit/phase.

### UX đơn giản

Primitive behavior:

```text
Endpoints

Endpoint 1
  Name
  URL
  Timeout
  [Remove]

Endpoint 2
  ...

[+ Add endpoint]
```

Không card chồng card nếu item đơn giản.

### Reorder

Support:

```text
Move up
Move down
```

Drag-drop có thể thêm nhưng không phải cách duy nhất.

Pseudo state:

```ts
interface RepeaterState<T> {
  items: Signal<T[]>;

  add(initial?: Partial<T>): void;
  remove(index: number): void;
  move(index: number, target: number): void;
}
```

Test:

- add/remove/move.
- stable field path after reorder.
- validation error đi theo đúng item.
- keyboard-only reorder.
- cannot remove required minimum item nếu schema quy định.

## 2. Record field -> KeyValueEditor

Generic record thường là:

- headers;
- metadata;
- labels;
- env vars.

UI target:

```text
Key                  Value
[Authorization]      [Bearer ...]      Remove
[Content-Type]       [application/json] Remove

+ Add entry
```

Pseudo:

```ts
type KeyValueEntry = {
  id: string;
  key: string;
  value: string;
};

class KeyValueEditor {
  entries = signal<KeyValueEntry[]>([]);
}
```

Validation:

- duplicate key;
- empty key;
- required value;
- custom key pattern.

Tests:

- add/remove.
- duplicate keys.
- API error for one row.
- focus new row after add.
- Remove has accessible name including key where possible.

## 3. Group field

`field-group-renderer` chỉ render children.

Bỏ khỏi group config:

```text
variant
density
collapsed visual card
```

Group data != visual section.

Pseudo:

```html
<div class="field-group">
  @for (child of field.children(); track child.path) {
    <app-field-renderer [field]="child" />
  }
</div>
```

Two-column chỉ cho cặp semantic.

## 4. Tree field

### Boundary mới

Tree hiện có nhiều mode trong một renderer:

```text
view
select
builder
manage
search
filter
presets
drag/drop
lazy
virtual
picker
advanced JSON
node CRUD
```

Không để generic field renderer quản tất cả.

Tách responsibility thành complex UI package, nhưng không chạy hai version.

Target file organization có thể là:

```text
src/app/shared/ui/patterns/tree/
  tree-viewer/
  tree-selector/
  tree-editor/
  tree-picker/
  models/
```

Sau khi chuyển, xóa `field-tree-renderer`.

Form integration chỉ là bridge mỏng:

```text
tree field schema
  -> open/render TreeSelector hoặc TreeEditor
  -> commit selected/value
```

### Mode policy

- `view` -> TreeViewer.
- `select` -> TreeSelector.
- `builder/manage` -> TreeEditor.
- picker dialog/drawer -> TreePicker.

Không một component có tất cả flags.

Pseudo:

```ts
switch (treeConfig.mode) {
  case 'view':
    return TreeViewer;
  case 'select':
    return TreeSelector;
  case 'builder':
  case 'manage':
    return TreeEditor;
}
```

Tốt hơn nữa: schema type tách rõ thay vì mode flag.

### Tests

TreeSelector:

- single/multiple/checkbox selection.
- keyboard expand/collapse.
- search.
- disabled node reason.
- selected state accessible.

TreeEditor:

- add/remove/replace/move.
- keep-children/drop-children behavior.
- confirmation cho destructive replace.
- drag drop có keyboard alternative.
- validation errors visible.

Performance:

- lazy load.
- large tree/virtualization nếu thực sự dùng.

## 5. Secret Metadata

Không để `BaseFieldConfig` phình vì OAuth-specific labels.

Tách specialized editor.

Target:

```text
SecretMetadataEditor
CredentialEditor
OAuthCredentialEditor
```

Pseudo:

```ts
type Credential =
  | { type: 'basic'; username: string; password: SecretValue }
  | { type: 'oauth2'; grantType: ...; clientId: string; clientSecret: SecretValue; tokenUrl: string }
  | { type: 'token'; token: SecretValue };
```

Renderer:

```html
<app-select label="Credential type" ... />

@switch (credential.type) {
  @case ('basic') { ... }
  @case ('oauth2') { ... }
  @case ('token') { ... }
}
```

Security UX:

- secret không echo full value.
- edit existing secret có `unchanged` state.
- clear/replace secret là explicit action.
- copy action chỉ nếu product requirement cho phép.

Tests:

- type switch preserves only intended data.
- secret masked.
- replace secret.
- API validation.
- no secret in aria-label/title accidentally.

## 6. JSON field

Hai use case tách rõ:

### Inline JSON field

```text
FormField
  JsonEditor
```

### Advanced whole-model JSON

Không nhét vào mọi form.

Feature compose một `Advanced JSON` disclosure nếu cần.

Pseudo:

```ts
class JsonEditor {
  text = signal('');
  parsed = computed(() => safeParse(text()));

  commit() {
    if (!parsed().ok) {
      showParseError();
      return;
    }

    valueChange.emit(parsed().value);
  }
}
```

Tests:

- valid JSON.
- invalid JSON preserves text.
- error shows line/column nếu editor support.
- apply explicitly; invalid không overwrite model.

## 7. Code field

Nếu CodeMirror đã có trong project:

- code field dùng dedicated code editor component;
- generic textarea không biết language/editor state.

Tests:

- value synchronization.
- readonly.
- keyboard focus escape strategy.
- large text.
- validation.

## Public API rule

Public:

```text
FormInput
TreeSelector / TreeEditor nếu feature cần trực tiếp
KeyValueEditor nếu reuse ngoài form
JsonEditor
CodeEditor
```

Internal:

```text
FieldRenderer
GroupRenderer
form-to-complex-field bridge
```

## Test plan tổng

### Unit

Mỗi specialized editor test state transition độc lập.

### Form integration

Một form representative chứa:

- repeater;
- record/key-value;
- tree selector;
- secret editor;
- JSON field.

Verify:

```text
model -> renderer -> edit -> form model
validation -> field summary
dirty state
submit
reset/initialization
```

### A11y

- add/remove buttons có accessible names.
- row/item reorder keyboard.
- tree semantics.
- secret toggle accessible.
- JSON error announced/associated.

### Storybook

Mỗi complex editor có standalone stories, không chỉ story thông qua full FormInput.

## Definition of Done

- `field-tree-renderer` mega component không còn tồn tại.
- OAuth/secret-specific config không làm generic field model tiếp tục phình.
- array/record editor có keyboard operations.
- JSON invalid input không làm mất user text.
- public API chỉ expose specialized editor có reuse value.
