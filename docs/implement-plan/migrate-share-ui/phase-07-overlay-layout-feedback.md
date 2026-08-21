# Phase 07 — Overlay, Layout và Feedback Rewrite

## Mục tiêu

Sửa trực tiếp overlay/layout/feedback hiện tại để loại bỏ custom focus trap/DOM overlay handling, giảm smart container và thống nhất page visual language.

## Scope

### Overlay

```text
src/app/shared/ui/overlay/
  confirm-dialog/
  drawer/
```

Ngoài ra review duplicate:

```text
src/app/shared/ui/primitives/dialog/
src/app/shared/ui/primitives/confirm-dialog/
src/app/shared/ui/primitives/base-popup/
```

### Layout

```text
src/app/shared/ui/layout/
  action-toolbar/
  card/
  filter-panel/
  page-header/
  page-shell/
  responsive-grid/
  section-panel/
```

### Feedback

- Alert
- EmptyState
- ErrorState
- ErrorPage
- LoadingSkeleton
- skeleton wrappers
- progress/status components

## 1. Drawer -> Angular CDK

Current manual behavior phải bỏ:

- append node vào `document.body`;
- tự save/restore body overflow;
- document keydown listener;
- custom Tab focus trap;
- manual focusable query;
- manual trigger restoration.

Dùng Angular CDK:

```text
Overlay
Portal
FocusTrap / cdkTrapFocus
BlockScrollStrategy
OverlayKeyboardDispatcher hoặc dialog primitive phù hợp
```

Pseudo service:

```ts
class DrawerService {
  open<TData, TResult>(
    component: ComponentType<unknown>,
    config: DrawerConfig<TData>
  ): DrawerRef<TResult> {
    const overlayRef = this.overlay.create({
      positionStrategy: ...,
      scrollStrategy: this.overlay.scrollStrategies.block(),
      hasBackdrop: true
    });

    // attach portal
    // focus initial element
    // backdrop/Escape handling
    // restore focus on close
  }
}
```

Pseudo panel:

```html
<section
  role="dialog"
  aria-modal="true"
  [attr.aria-labelledby]="titleId"
  cdkTrapFocus
  [cdkTrapFocusAutoCapture]="true"
>
  ...
</section>
```

## 2. ConfirmDialog

Giữ typed confirmation cho destructive high-risk action.

API:

```ts
confirm({
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive: true,
  requireText?: {
    expected: resourceName
  }
})
```

Không dùng generic:

```text
Are you sure? Yes / No
```

Pseudo:

```text
Delete "production-db"?

This action permanently deletes the connection and cannot be undone.

Type production-db to confirm
[                     ]

Cancel       Delete connection
```

Tests:

- initial focus.
- Escape cancel nếu allowed.
- focus trapped.
- focus restore.
- destructive submit disabled until typed match.
- async action double-submit prevented.
- error preserves dialog input.

## 3. Dialog duplicate cleanup

Chọn một overlay stack.

Không giữ:

```text
primitives/dialog
overlay/confirm-dialog
primitives/confirm-dialog
base-popup
```

nếu chúng overlap responsibility.

Trong phase này migrate consumer và xóa duplicate đã thay thế.

## 4. SectionPanel

Rewrite thành structural section hoặc giảm responsibility.

Bỏ builtin branching:

```text
loading
error
empty
retry
```

ra khỏi `SectionPanel`.

Target:

```html
<app-section-panel
  title="Runtime"
  subtitle="Execution behavior"
>
  <app-content-state
    [loading]="loading"
    [error]="error"
    [empty]="empty"
  >
    ...
  </app-content-state>
</app-section-panel>
```

Tốt hơn nếu rename direct thành `Section`, nhưng không giữ cả hai.

### Section visual

Default:

- no glass;
- no heavy border;
- no nested card;
- spacing + optional divider.

## 5. Card

Card chỉ là independent surface.

Bỏ generic `interactive=true` nếu host không có semantic link/button.

Nếu card clickable:

```html
<app-card>
  <a class="card-link" ...>...</a>
</app-card>
```

Không biến `<div>` thành fake interactive control.

## 6. FilterPanel

Rewrite compact:

Desktop:

```text
[ Search................ ] [Status ▼] [Owner ▼] [Filters]
Status: Running ×  Owner: Me ×   Clear all
```

Rare filters mở Drawer/Popover.

Không render giant filter card mặc định trên table.

Pseudo:

```ts
interface FilterDefinition {
  id: string;
  label: string;
  type: 'text' | 'select' | 'date-range' | 'boolean';
  priority: 'quick' | 'advanced';
}
```

## 7. ActionToolbar

Rules:

- max one primary action;
- secondary visible khi frequent;
- 3+ low-frequency -> More menu;
- destructive không primary trừ task thực sự destructive.

Pseudo:

```text
Refresh     More ▾                         Create job
```

## 8. ContentState

Tạo/chuẩn hóa một compositional state component thay cho duplicate loading/error/empty logic.

Pseudo:

```html
@if (loading) {
  <ng-content select="[loading]" />
} @else if (error) {
  <app-error-state ... />
} @else if (empty) {
  <app-empty-state ... />
} @else {
  <ng-content />
}
```

Không ép tất cả container phải biết state.

## 9. Feedback cleanup

### Giữ

- Alert
- EmptyState
- ErrorState
- ErrorPage
- LoadingSkeleton
- RealtimeProgressBar nếu có use case.

### Review/delete wrapper

- SkeletonCard
- SkeletonForm
- SkeletonTable

Giữ chỉ nếu chúng thể hiện skeleton layout thực sự reused. Nếu chỉ wrap `LoadingSkeleton` bằng vài props, collapse.

## Test plan

### Overlay

- focus trap.
- Escape.
- backdrop.
- nested overlay.
- focus restore.
- body scroll restored.
- async confirm.
- typed confirm.
- mobile full-height drawer.
- reduced motion.

### Layout

- PageShell width.
- Section no nested state responsibility.
- Card non-interactive semantics.
- ActionToolbar overflow at narrow widths.
- FilterPanel applied filters removable.

### Feedback

- ErrorState retry button semantics.
- EmptyState optional primary action.
- Alert role/politeness theo severity.
- loading skeleton respects reduced motion.

### Storybook

Overlay stories:

```text
Drawer default
Drawer long content
Drawer form
Confirm destructive
Confirm typed
Confirm async error
Mobile drawer
```

Layout stories:

```text
PageShell form/content/data
Section
Card
FilterPanel quick+advanced
ActionToolbar overflow
```

Theme:

```text
light
dark
390px
```

## Definition of Done

- Drawer không tự append body/focus trap bằng document query.
- overlay duplicates đã giảm về một stack.
- SectionPanel không xử lý loading/error/empty nội bộ.
- FilterPanel compact + applied filters visible.
- Card không có fake interactive behavior.
- tests focus/keyboard pass.
