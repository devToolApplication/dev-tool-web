# R07 — Overlay, Layout and Action Boundary Cleanup

## Objective

Replace manual overlay/focus code with Angular CDK, remove state orchestration from structural layout components, and make shared action components presentation-only.

## Scope

```text
src/app/shared/ui/overlay/drawer/**
src/app/shared/ui/overlay/confirm-dialog/**
src/app/shared/ui/primitives/dialog/**
src/app/shared/ui/primitives/confirm-dialog/**
src/app/shared/ui/primitives/base-popup/**
src/app/shared/ui/layout/action-toolbar/**
src/app/shared/ui/layout/section-panel/**
src/app/shared/ui/layout/card/**
src/app/shared/ui/layout/filter-panel/**
feedback/content-state area
```

## 1. Rewrite Drawer using Angular CDK

Delete manual behavior:

```text
append overlay node to document.body
manual document.body overflow changes
document keydown Tab focus trap
manual querySelectorAll focusables
manual overlay DOM removal
manual global Escape handling where CDK can own it
```

Use Angular CDK primitives:

```text
Overlay
Portal
cdkTrapFocus / FocusTrap
BlockScrollStrategy
backdrop handling
overlay keyboard dispatcher or appropriate dialog primitive
```

Target panel:

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

Restore focus to the trigger when the overlay closes.

## 2. ConfirmDialog typed behavior

Keep one confirmation stack.

Target API:

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
});
```

High-risk destructive actions should support typed confirmation when required.

Async confirm must prevent double submission and preserve user input on recoverable error.

## 3. Remove overlay duplicates

Choose one implementation responsibility and migrate consumers before deleting overlapping primitives.

Review:

```text
primitives/dialog
primitives/confirm-dialog
primitives/base-popup
overlay/confirm-dialog
overlay/drawer
```

Do not leave thin legacy wrappers exported after the consumer migration.

## 4. ActionToolbar becomes presentation-only

Remove direct `PermissionService` dependency.

Do not encode auth policy in the action model.

Target:

```ts
export interface ActionToolbarAction {
  id: string;
  label: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  visible?: boolean;
  disabled?: boolean;
  loading?: boolean;
  tooltip?: string;
  placement?: 'primary' | 'secondary' | 'more';
}
```

Feature resolves permissions and business confirmation.

If a generic UI-only confirm behavior is retained, ensure it does not require feature/auth knowledge.

Toolbar rules:

```text
max one primary action
frequent secondary actions visible
3+ low-frequency actions -> More
normal destructive actions not primary
```

## 5. Simplify SectionPanel

Remove built-in state inputs:

```text
loading
error
empty
retry
```

SectionPanel/Section should be structural:

```text
title
subtitle
optional divider
optional collapse for justified advanced sections
actions slot
content
```

Default visual should not be heavy card/glass chrome.

## 6. ContentState owns loading/error/empty composition

Introduce or standardize one compositional state pattern:

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

Containers should not each reimplement state branching.

## 7. Card semantics

Card is an independent surface, not a generic clickable div.

Delete generic fake `interactive=true` behavior if it only adds hover/cursor styles. If navigation/action is required, use a real link/button within the card.

## 8. FilterPanel cleanup

Target compact filter UI:

```text
[ Search................ ] [Status ▼] [Owner ▼] [Filters]
Status: Running ×  Owner: Me ×  Clear all
```

Frequent filters stay visible. Advanced filters use a controlled expandable panel/drawer/popover according to actual UX; applied filters must always remain visible/removable.

Do not make Table own the filter engine.

## Tests

### Overlay

```text
initial focus
focus trap
Escape close when allowed
backdrop close policy
focus restore
body scroll block/restore
nested overlay behavior
async confirmation
typed confirmation
mobile full-height drawer
reduced motion
```

### Action/layout

```text
ActionToolbar one primary
More menu keyboard behavior
Section has no built-in state branching
Card has no fake interactive semantics
FilterPanel removable chips / clear all
```

## Search gates

Expected zero:

```bash
rg "document\.body\.appendChild|document\.body\.style\.overflow|document:keydown\.tab" src/app/shared/ui/overlay
rg "PermissionService" src/app/shared/ui/layout/action-toolbar
```

Inspect duplicate overlay exports after migration and delete obsolete implementations.

## Definition of Done

- Drawer uses CDK overlay/focus/scroll primitives.
- Manual body append/focus trap code is gone.
- One confirmation/dialog stack remains per responsibility.
- ActionToolbar has no auth/application dependency.
- SectionPanel does not own loading/error/empty/retry.
- Card does not provide fake interactivity.
- FilterPanel is compact and composable outside Table.
- Overlay/focus/keyboard tests pass.