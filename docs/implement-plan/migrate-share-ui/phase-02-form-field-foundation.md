# Phase 02 — FormField và Control UX Foundation

## Mục tiêu

Tạo một field contract duy nhất cho label, help, description, error và accessibility; sau đó sửa trực tiếp InputText/InputArea/InputNumber/Select/Checkbox/Radio/Date/Password/Autocomplete để dùng contract này.

Không tạo một bộ control mới chạy song song. Control hiện tại được rewrite.

## Scope

### Foundation cần sửa/thêm

- `src/app/shared/ui/primitives/input-text/**`
- `src/app/shared/ui/primitives/input-area/**`
- `src/app/shared/ui/primitives/input-number/**`
- `src/app/shared/ui/primitives/select/**`
- `src/app/shared/ui/primitives/select-multi/**`
- `src/app/shared/ui/primitives/auto-complete/**`
- `src/app/shared/ui/primitives/check-box/**`
- `src/app/shared/ui/primitives/radio-button/**`
- `src/app/shared/ui/primitives/date-picker/**`
- `src/app/shared/ui/primitives/password/**`
- field UI wrapper hiện có trong form (`field-block`) sẽ được chuyển trách nhiệm thành `FormField`.

## Quyết định kiến trúc

Primitive input chỉ render control.

`FormField` chịu:

- label;
- required/optional marker;
- description;
- help text;
- error;
- control id;
- `aria-describedby`;
- layout spacing.

```text
FormField
  Label
  Description
  Control slot
  Hint/Error
```

## Thay đổi `field-block`

`field-block` hiện là internal của form engine. Rewrite nó thành field foundation và có thể rename trực tiếp thành `form-field`.

Nếu rename path/selector:

```text
component/field-block
  -> component/form-field
```

Cập nhật toàn bộ import/reference trong cùng phase.

Không giữ cả `field-block` lẫn `form-field`.

## FormField API

Pseudo TypeScript:

```ts
interface FormFieldInputs {
  controlId: string;
  label: string;
  description?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  optional?: boolean;
  disabled?: boolean;
}

get describedBy(): string | null {
  return [
    description ? `${controlId}-description` : null,
    hint && !error ? `${controlId}-hint` : null,
    error ? `${controlId}-error` : null
  ].filter(Boolean).join(' ') || null;
}
```

Pseudo HTML:

```html
<div class="form-field" [class.form-field--invalid]="!!error">
  <div class="form-field__label-row">
    <label [for]="controlId">{{ label }}</label>

    @if (required) {
      <span aria-hidden="true">*</span>
    } @else if (optional) {
      <span class="form-field__optional">Optional</span>
    }
  </div>

  @if (description) {
    <p [id]="controlId + '-description'">{{ description }}</p>
  }

  <ng-content></ng-content>

  @if (error) {
    <p
      [id]="controlId + '-error'"
      class="form-field__error"
    >
      {{ error }}
    </p>
  } @else if (hint) {
    <p [id]="controlId + '-hint'" class="form-field__hint">
      {{ hint }}
    </p>
  }
</div>
```

Control nhận:

```html
<input
  [id]="controlId"
  [attr.aria-invalid]="error ? 'true' : null"
  [attr.aria-describedby]="describedBy"
/>
```

## Label strategy

Bỏ floating label làm default.

Không dùng placeholder `" "` để kích hoạt float-label.

Default:

```text
Job name
Used in logs and monitoring.
[ Nightly backup              ]
```

Placeholder chỉ là example/format hint:

```text
Repository URL
[ https://github.com/org/repo ]
```

không thay label.

## InputText

Thay đổi:

- `autocomplete` thành input configurable.
- thêm `name`, `inputmode`, `spellcheck` nếu hợp lý.
- không hard-code `autocomplete="off"`.
- error không tự render nếu field wrapper đã render.
- primitive không biết `label/helpText/errorMessage`.

Pseudo:

```ts
@Component(...)
class InputTextComponent extends BaseInput<string> {
  inputId = input.required<string>();
  placeholder = input<string>();
  autocomplete = input<string>();
  inputMode = input<string>();
  readonly = input(false);
}
```

## InputArea

Chuẩn hóa:

- rows/min/max;
- resize behavior;
- JSON/code mode không nhét toàn bộ editor logic vào textarea primitive.
- JSON validation sẽ nằm ở specialized field phase 05.

## Number

- min/max/step semantics;
- display prefix/suffix là field adornment;
- không biến currency/percent thành các visual variants không cần thiết.

## Select / Autocomplete / MultiSelect

Contract chung:

```ts
interface SelectOption<T> {
  label: string;
  value: T;
  disabled?: boolean;
}
```

Yêu cầu:

- loading state;
- empty state;
- clear action có accessible label;
- keyboard navigation;
- option selected state;
- không dùng color-only selected state.

## Checkbox / Radio / Switch

Checkbox/radio label nằm cạnh control nhưng vẫn dùng field group semantics khi cần.

Ví dụ radio:

```html
<fieldset>
  <legend>Retry policy</legend>
  ...
</fieldset>
```

Không dùng một label HTML sai semantic cho cả group.

## Readonly

Primitive có thể có native `readonly` khi input cần copy/select text.

Nhưng page detail/read-only form không được render hàng loạt disabled controls. Việc xóa readonly form presentation sẽ thực hiện ở Phase 03/04.

## Layout

Default field width:

```text
full available form content width
```

Control có max-width theo use case, không theo grid fraction.

Suggested utility:

```ts
type FieldWidth = 'short' | 'medium' | 'full';
```

Ví dụ:

- short: port/retry/count;
- medium: name/type/select;
- full: URL/textarea/code.

## Test plan

### Unit — FormField

- `label[for]` khớp control id.
- required marker render nhưng không là nguồn semantic duy nhất.
- description id vào `aria-describedby`.
- error thay hint trong visual output.
- control có `aria-invalid=true` khi error.
- nhiều description id nối đúng.

### Unit — controls

Mỗi control:

- CVA writeValue;
- user change gọi onChange;
- blur gọi onTouched;
- disabled state;
- readonly state nếu hỗ trợ;
- null/empty value behavior;
- không tự generate inaccessible label.

### Keyboard

- Select: ArrowUp/ArrowDown/Enter/Escape.
- Autocomplete: keyboard chọn option.
- Checkbox: Space.
- Radio: Arrow keys.
- DatePicker: keyboard mở/đóng/chọn hoặc library semantic được giữ.

### Validation

- error render sau touch/submit theo policy;
- recoverable error không clear input;
- API field error có thể bind vào cùng field error UI.

### Storybook

Mỗi critical control có stories:

```text
default
with description
with hint
required
invalid
disabled
readonly where relevant
light
dark
mobile width
```

### A11y

- no placeholder-only story;
- visible focus;
- error relationship đúng;
- group controls có legend/accessible name;
- control target size phù hợp.

## Definition of Done

- field UI logic tập trung tại một contract;
- primitive không còn mang label/help/error duplicated logic;
- InputText không hard-code autocomplete off;
- form controls critical đã migrate;
- không còn floating-label default;
- Storybook a11y pass cho form field foundation.
