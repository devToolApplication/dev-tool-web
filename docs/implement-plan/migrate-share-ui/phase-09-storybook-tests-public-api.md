# Phase 09 — Storybook, Test Matrix và Public API Cleanup

## Mục tiêu

Khóa chất lượng của shared UI sau rewrite và thu nhỏ public API. Đây là phase hardening cuối, nhưng test phải được viết dần ở từng phase.

## 1. Storybook theme matrix

Preview hiện không được chỉ ép light theme.

Story decorator / toolbar:

```ts
globalTypes = {
  theme: {
    defaultValue: 'light',
    toolbar: {
      items: ['light', 'dark']
    }
  }
}
```

Decorator:

```ts
(document.documentElement.dataset.theme = context.globals.theme)
```

Critical story phải chạy:

```text
light
dark
```

## 2. Viewport matrix

Critical stories:

```text
Desktop 1440
Laptop 1024
Tablet 768
Mobile 390
```

Không cần snapshot mọi component ở mọi width nếu chi phí quá cao, nhưng bắt buộc cho:

- PageShell;
- FormInput;
- SectionNavigation;
- StickyFormActions;
- Table;
- FilterPanel;
- Drawer/Confirm;
- ActionToolbar.

## 3. Story taxonomy

### Foundation

```text
Button
FormField
InputText
InputNumber
Select
Checkbox
Radio
DatePicker
Badge
Alert
```

### Layout

```text
PageShell
PageHeader
Section
Card
ActionToolbar
FilterPanel
```

### Patterns

```text
FormInput
Table
TreeSelector
TreeEditor
KeyValueEditor
JsonEditor
```

### Overlay

```text
Drawer
Dialog
Confirm
```

## 4. Interaction tests

### Button

- keyboard click.
- disabled/loading.
- focus.

### FormInput

- fill form.
- conditional field.
- invalid submit.
- focus first error.
- correct submit payload.

### Table

- sort keyboard.
- select row.
- action menu.
- pagination.

### Drawer/Confirm

- open.
- trap focus.
- Escape/backdrop.
- confirm.
- restore focus.

## 5. Accessibility gate

`addon-a11y` continue ở error mode cho critical stories.

Checklist automated + manual:

```text
accessible names
heading order
focus visible
aria-invalid / describedby
aria-sort
dialog label
keyboard operation
contrast
color independence
reduced motion
```

## 6. Visual regression

Chromatic critical set:

```text
Button states
FormField states
Short Form
Long Form
Form errors
Table desktop
Table mobile
Drawer
Confirm
PageShell
FilterPanel
```

Không snapshot decorative noise không cần thiết.

Mục tiêu regression là interaction-critical layout.

## 7. Public API cleanup

Current `SharedModule` không được export implementation detail.

Public export categories:

```text
primitives
layout
feedback
overlay
data-display
patterns
```

Internal không export:

```text
FieldRenderer
FieldGroupRenderer
Repeater internal row
TableCell
TableFilter implementation
Tree internal node renderer
Form rule engine implementation
```

Pseudo barrel:

```ts
// patterns/form-input/index.ts
export { FormInputComponent } from './form-input';
export type {
  FormConfig,
  FieldConfig,
  FormValidationError
} from './models/form-config.model';

// DO NOT export ./component/field-renderer
```

## 8. SharedModule strategy

Không bắt buộc rewrite toàn app sang standalone trong cùng chương trình nếu scope quá lớn.

Nhưng shared UI mới/sửa nên ưu tiên standalone nếu Angular architecture hiện tại support.

Mục tiêu cuối:

- `SharedModule` chỉ re-export public component cần compatibility với feature module;
- không import/export mọi internal renderer;
- feature mới có thể import standalone component trực tiếp.

Pseudo:

```ts
const PUBLIC_SHARED_COMPONENTS = [
  ButtonComponent,
  FormInputComponent,
  TableComponent,
  PageShellComponent,
  ...
];
```

Internal component chỉ import trong owning pattern.

## 9. Static architecture checks

Có thể thêm test/lint đơn giản.

### Table boundary

Fail nếu `patterns/table` import:

```text
core/auth
core/http
features/
```

### Form boundary

Fail nếu `patterns/form-input` import feature modules.

### Internal exports

Fail nếu barrel export file dưới:

```text
/component/internal/
```

Pseudo Node test:

```ts
expect(findImports('shared/ui/patterns/table', [
  'core/auth',
  'core/http',
  'features/'
])).toEqual([]);
```

## 10. Test pyramid

```text
Unit
  lots, fast
Interaction/Storybook
  critical UI behavior
Integration
  form/table composition
E2E
  feature critical flow
Visual
  critical layout/state
Manual
  complex keyboard/screen-reader spot checks
```

Không dựa chỉ vào snapshot.

## 11. Final deletion gate

Repository search phải không còn runtime reference tới các target deleted:

```text
BaseCrudPage
SmartFormShell
FormStatusPanel
readonly-field
readonly-section
legacy button severity values
duplicate confirm/dialog implementations đã chọn xóa
```

## 12. Final acceptance scenarios

### Scenario A — Create Job

```text
open
fill
conditional validation
submit invalid
focus first error
fix
submit
server error preserves data
submit success
```

### Scenario B — Edit Job long form

```text
section nav
dirty state
save
unsaved guard
mobile section navigation
dark theme
```

### Scenario C — Job Management

```text
filter
sort
paginate
select
row action
drawer
confirm delete
mobile record list
```

### Scenario D — Complex configuration

```text
array
key/value
tree
secret
JSON
validation
submit
```

## Definition of Done

- Storybook không chỉ test light.
- critical patterns có mobile story.
- critical keyboard interactions automated.
- public barrels không export internal renderers.
- architecture dependency checks có coverage.
- build/test/storybook/chromatic/E2E critical flow pass.
- repo search xác nhận legacy target đã bị xóa.
