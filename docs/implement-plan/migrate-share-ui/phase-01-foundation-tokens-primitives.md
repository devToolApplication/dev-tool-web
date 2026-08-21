# Phase 01 — Foundation, Tokens và Primitive Contract

## Mục tiêu

Sửa trực tiếp foundation hiện tại để mọi phase sau dùng chung một visual/interaction contract.

Không tạo `tokens-v2.css`, `ButtonV2` hay một primitive tree song song. File/token/component hiện tại được thay đổi tại chỗ.

## Scope chính

### Theme

- `src/theme/tokens.css`
- `src/theme/dark.css`
- `src/theme/layout.css`

### Primitive

- `src/app/shared/ui/primitives/base-input.ts`
- `src/app/shared/ui/primitives/button/**`
- các control primitive đang dùng `BaseInput`
- các duplicate primitive liên quan button/dialog/status sẽ chỉ đánh dấu migration target; chưa xóa hàng loạt trong phase này.

## Vấn đề cần sửa

### 1. Token hiện tại thiên visual-effect hơn foundation

Bổ sung token foundation đầy đủ:

```css
/* spacing */
--app-space-1: 4px;
--app-space-2: 8px;
--app-space-3: 12px;
--app-space-4: 16px;
--app-space-6: 24px;
--app-space-8: 32px;
--app-space-12: 48px;
--app-space-16: 64px;

/* control sizing */
--app-control-height-sm: 32px;
--app-control-height-md: 40px;
--app-control-height-lg: 44px;

/* focus */
--app-focus-width: 2px;
--app-focus-offset: 2px;
--app-focus-ring: color-mix(...);

/* typography */
--app-line-height-tight: 1.25;
--app-line-height-normal: 1.5;
--app-font-weight-medium: 500;
--app-font-weight-semibold: 600;

/* motion */
--app-motion-fast: 120ms;
--app-motion-normal: 180ms;
--app-ease-standard: cubic-bezier(...);
```

### 2. Chuẩn hóa semantic token

Giữ token visual implementation ở mức tối thiểu. Component dùng semantic token:

```text
bg
surface
surface-subtle
surface-elevated

text-primary
text-secondary
text-muted
text-inverse

border
border-strong
border-focus

primary
primary-hover
primary-active

success
warning
danger
info
```

Không tạo một set gradient/shadow riêng cho mỗi button severity.

### 3. Button rewrite tại chỗ

`Button` không được inherit `BaseInput`.

Contract đề xuất:

```ts
type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'destructive';

type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonInputs {
  variant: ButtonVariant;
  size: ButtonSize;
  type: 'button' | 'submit' | 'reset';
  label?: string;
  icon?: string;
  iconOnly?: boolean;
  loading?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
}
```

Bỏ dần semantic cũ:

```text
success
info
warn
help
contrast
```

Mapping consumer phải được sửa, không để compatibility mapper lâu dài.

### 4. Navigation không dùng Button

Nếu action là navigation:

```html
<a app-link [routerLink]="...">...</a>
```

Không đặt `routerLink` trên `<button>`.

### 5. Focus

Không:

```css
outline: none;
transition: all 150ms ease;
```

Dùng:

```css
.app-button {
  transition:
    background-color var(--app-motion-fast) var(--app-ease-standard),
    border-color var(--app-motion-fast) var(--app-ease-standard),
    color var(--app-motion-fast) var(--app-ease-standard);
}

.app-button:focus-visible {
  outline: var(--app-focus-width) solid var(--app-focus-ring);
  outline-offset: var(--app-focus-offset);
}
```

### 6. BaseInput thu nhỏ responsibility

`BaseInput<T>` hiện chứa label/help/tooltip/layout/validation UI.

Đổi thành base CVA tối thiểu hoặc bỏ inheritance nếu không còn cần.

Pseudo contract:

```ts
abstract class BaseInput<T> implements ControlValueAccessor {
  value = signal<T | null>(null);
  disabled = signal(false);

  private onChange = (_: T | null) => {};
  private onTouched = () => {};

  writeValue(value: T | null) {
    this.value.set(value);
  }

  registerOnChange(fn) {
    this.onChange = fn;
  }

  registerOnTouched(fn) {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean) {
    this.disabled.set(disabled);
  }

  protected commit(value: T | null) {
    this.value.set(value);
    this.onChange(value);
  }

  protected touch() {
    this.onTouched();
  }
}
```

Label/help/error chuyển sang Phase 02 `FormField`.

## Consumer migration trong phase

Search toàn repo:

```text
severity="success" -> variant="primary" nếu là primary action
severity="danger"  -> variant="destructive"
severity="secondary" -> variant="secondary" hoặc ghost
text=true -> variant="ghost"
```

Không map máy móc `success -> primary` cho mọi trường hợp. Xem intent của action.

## Pseudocode component

```html
<button
  class="app-button"
  [class]="'app-button--' + variant"
  [type]="type"
  [disabled]="disabled || loading"
  [attr.aria-busy]="loading || null"
  [attr.aria-label]="resolvedAriaLabel"
>
  @if (loading) {
    <app-progress-spinner aria-hidden="true" />
  } @else if (icon) {
    <i [class]="icon" aria-hidden="true"></i>
  }

  @if (!iconOnly && label) {
    <span>{{ label | translateContent }}</span>
  }
</button>
```

## Test plan

### Unit — tokens/contract

- Button default `type=button`.
- `submit` button submit được form.
- disabled/loading không emit click.
- loading set `aria-busy`.
- icon-only bắt buộc có accessible name.
- Button không còn dependency `BaseInput`.
- Button không render `routerLink`.

### Interaction

- Tab focus vào button.
- focus ring chỉ xuất hiện với keyboard focus (`:focus-visible`).
- Enter/Space activate button đúng semantic.
- loading không tạo double-submit.

### Visual

Storybook matrix:

```text
variant: primary / secondary / ghost / destructive
state: default / hover / focus / disabled / loading
size: sm / md / lg
theme: light / dark
```

### Accessibility

- contrast primary text/background.
- destructive không chỉ phụ thuộc màu: label/icon/message vẫn đủ nghĩa.
- icon-only có aria-label.
- focus visible ở light và dark.

### Regression

Migrate ít nhất các usage critical:

- form save/cancel;
- table toolbar;
- confirm dialog;
- drawer footer;
- page primary action.

## Definition of Done

- không có `Button extends BaseInput`;
- button variant cũ đã được bỏ khỏi type;
- không còn `transition: all` trong Button;
- token spacing có 24/32/48/64;
- có common focus token;
- dark theme dùng cùng semantic token contract;
- consumer critical compile và render với contract mới;
- Storybook + a11y pass.
