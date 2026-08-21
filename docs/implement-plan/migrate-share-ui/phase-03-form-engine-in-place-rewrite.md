# Phase 03 — Rewrite FormInput và Form Engine tại chỗ

## Mục tiêu

Rewrite trực tiếp `src/app/shared/ui/patterns/form-input` thành form engine đơn giản, composable, accessibility-first.

Không tạo `FormInputV2`. Selector/path hiện tại có thể được giữ hoặc rename một lần, nhưng implementation cũ phải bị thay thế, không chạy song song.

## Current area

```text
src/app/shared/ui/patterns/form-input/
  form-input.ts
  form-input.html
  form-input.css
  models/form-config.model.ts
  component/
    field-array-renderer/
    field-block/
    field-group-renderer/
    field-record-renderer/
    field-renderer/
    field-secret-metadata-renderer/
    field-tree-renderer/
    form-section-card/
    form-section-nav/
    form-status-panel/
    json-field-block/
    readonly-field/
    readonly-section/
    smart-form-shell/
    sticky-form-actions/
```

## Components phải xóa trong phase này

### `smart-form-shell`

Xóa.

Lý do:

- trộn page heading;
- API error;
- validation summary;
- loading;
- 3-column workspace;
- section nav;
- status panel;
- submit action.

`FormInput` không cần một mega-shell.

### `form-status-panel`

Xóa.

Các metric như:

- mode;
- total fields;
- completed sections;
- error count;
- warning count;

không xứng đáng với permanent sidebar.

### `readonly-field` / `readonly-section`

Xóa khỏi generic form engine.

Read-only detail sẽ dùng data-display component, không disabled form.

## Components rewrite

### `form-input`

Giữ là public entry point.

Responsibility mới:

- nhận schema/config;
- xây field state;
- evaluate conditional rule;
- validation;
- dirty/touched;
- external errors;
- emit value/submit state;
- render sections/fields.

Không chịu:

- page title;
- breadcrumb;
- CRUD;
- page loading;
- feature API;
- sticky footer placement;
- section status sidebar.

### `form-section-card`

Rename trực tiếp thành `form-section` hoặc rewrite selector/path ngay trong phase.

Không giữ card visual.

Pseudo:

```html
<section
  class="form-section"
  [id]="'form-section-' + section.id"
  [attr.aria-labelledby]="'form-section-title-' + section.id"
>
  @if (section.title) {
    <header class="form-section__header">
      <h2 [id]="'form-section-title-' + section.id">
        {{ section.title }}
      </h2>

      @if (section.description) {
        <p>{{ section.description }}</p>
      }
    </header>
  }

  <div class="form-section__fields">
    <ng-content></ng-content>
  </div>
</section>
```

Visual:

```text
Section title
description

field
field

------------------------

Next section
```

Không default border/card/badge.

### `form-section-nav`

Giữ nhưng chỉ render khi form đủ dài.

Rules:

```ts
showSectionNav =
  sections.length >= 4 ||
  estimatedVisibleFieldCount >= 15;
```

Có thể cho caller override, nhưng default không show với form ngắn.

Desktop: sticky left navigation.

Mobile: dropdown/select-like section jumper.

### `sticky-form-actions`

Rewrite in place thành action bar đơn giản.

Không dùng success button.

Pseudo:

```html
<footer class="form-actions">
  <div class="form-actions__state">
    @if (submitting) { Saving… }
    @else if (dirty) { Unsaved changes }
  </div>

  <div class="form-actions__buttons">
    @if (showCancel) {
      <app-button variant="secondary">Cancel</app-button>
    }

    <app-button
      variant="primary"
      type="submit"
      [loading]="submitting"
    >
      {{ submitLabel }}
    </app-button>
  </div>
</footer>
```

Review errors là secondary action chỉ hiện khi submit invalid.

## Rewrite FormConfig

Current config đang trộn schema + layout + UX shell.

Mục tiêu giảm config:

```ts
interface FormConfig {
  sections?: FormSectionConfig[];
  fields: FieldConfig[];
  validators?: Record<string, FormCustomValidator>;
}

interface FormSectionConfig {
  id: string;
  title: string;
  description?: string;
  optional?: boolean;
  collapsible?: boolean; // chỉ dùng cho advanced section có lý do
  hiddenWhen?: string;
}

interface BaseFieldConfig {
  name: string;
  type: FieldType;
  label: string;
  description?: string;
  helpText?: string;

  required?: boolean;
  visibleWhen?: string;
  disabledWhen?: string;
  requiredWhen?: string;

  validation?: ValidationRule[];

  width?: 'short' | 'medium' | 'full';
}
```

Bỏ:

```text
GridWidth = 1/2 | 1/3 | 1/4 | 1/6 | full
layout.mode = smart/wizard...
labelPlacement
showStatusPanel
stickyFooter
readonlyMode = disabled-controls
sectionNavigation = tabs
density ở mọi nested node
variant ở group
```

Wizard là một workflow pattern khác, không nhét vào generic form.

## Field renderer

`field-renderer` vẫn internal.

Pseudo:

```ts
switch (field.type) {
  case 'text':
    return InputText;
  case 'textarea':
    return InputArea;
  case 'number':
    return InputNumber;
  case 'select':
    return Select;
  case 'checkbox':
    return Checkbox;
  case 'date':
    return DatePicker;
  case 'group':
    return FieldGroupRenderer;
  case 'array':
    return FieldArrayRenderer;
  case 'tree':
    return ComplexFieldHost;
}
```

Public API không export `FieldRenderer`.

## Conditional rules

Tách expression evaluation khỏi component view.

Pseudo:

```ts
class FormRuleEngine {
  visible(field, model, context): boolean
  disabled(field, model, context): boolean
  required(field, model, context): boolean
}
```

`FormInput` gọi rule engine, renderer không parse expression.

## Validation flow

### Client

```text
user types
  -> field value changes
  -> validate field
  -> do not aggressively show error before touched
```

### Submit

```text
submit
  -> mark relevant fields touched
  -> validate all
  -> if invalid:
       render ValidationSummary
       scroll/focus first error
     else:
       emit formSubmit(value)
```

### API error

```text
feature receives API field errors
  -> passes externalErrors map to FormInput
  -> FormInput maps error by field path
  -> FormField renders same inline error
```

Không clear model sau recoverable API error.

## Form layout

Default one-column.

Pseudo CSS:

```css
.form-section__fields {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--app-space-6);
}

.field--short {
  max-width: 14rem;
}

.field--medium {
  max-width: 32rem;
}

.field--full {
  width: 100%;
}
```

Chỉ field group chuyên biệt mới được 2-column.

## FormInput template target

```html
<form (ngSubmit)="onSubmit()" novalidate>
  @if (apiError) {
    <app-alert variant="danger" [message]="apiError" />
  }

  @if (submitted() && validationItems().length) {
    <app-validation-summary
      [items]="validationItems()"
      (itemClick)="focusField($event.fieldPath)"
    />
  }

  <div class="form-workspace" [class.form-workspace--with-nav]="showNav()">
    @if (showNav()) {
      <app-form-section-nav
        [sections]="resolvedSections()"
        (sectionSelect)="scrollToSection($event)"
      />
    }

    <main>
      @for (section of resolvedSections(); track section.id) {
        <app-form-section [section]="section">
          @for (field of section.fields; track field.path) {
            <app-field-renderer
              [field]="field"
              [submitted]="submitted()"
            />
          }
        </app-form-section>
      }
    </main>
  </div>

  <ng-content select="[form-actions]" />
</form>
```

Action bar có thể do page compose ngoài form nếu cần sticky viewport behavior.

## Test plan

### Unit — FormConfig/rule engine

- visibleWhen true/false.
- disabledWhen.
- requiredWhen.
- cross-field custom validation.
- hidden field không block submit nếu policy là ignore hidden.
- field path stable cho nested group/array.

### Unit — FormInput

- initial value render đúng.
- valueChange emit đúng model.
- dirty false -> true khi user change.
- reset dirty semantics nếu còn reset.
- submit valid emit formSubmit.
- submit invalid không emit formSubmit.
- validation summary chứa đúng field.
- summary click focus field.
- external error map vào field.
- sửa field có thể clear external field error theo policy.

### Section

- form 1–3 sections không show nav mặc định.
- form dài show nav.
- mobile nav không render desktop sidebar.
- active section update theo scroll.
- heading hierarchy đúng.

### A11y

- một `<form>` semantic.
- mỗi field có accessible name.
- first invalid field được focus sau invalid submit.
- summary link/button keyboard accessible.
- section nav keyboard accessible.
- errors dùng text, không color-only.

### Integration

Dùng một schema representative:

```text
General
Runtime
Authentication
Limits
Advanced
```

bao gồm:

- text;
- number;
- select;
- checkbox;
- group;
- array;
- conditional required field;
- server error.

### Storybook

Stories bắt buộc:

```text
Short form
Long sectioned form
Validation errors
API error
Conditional fields
Submitting
Mobile
Dark theme
```

### Regression

Chọn `Job Form` làm reference consumer ngay cuối phase hoặc đầu Phase 04.

## Definition of Done

- `SmartFormShell` deleted.
- `FormStatusPanel` deleted.
- generic readonly renderer deleted.
- `FormInput` không render page/form title shell.
- layout config đã giảm mạnh.
- section không còn card-heavy.
- section navigation responsive.
- invalid submit focus đúng field.
- consumer reference chạy bằng implementation mới, không có FormInputV2.
