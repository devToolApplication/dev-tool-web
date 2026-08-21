# F06 — Overlay, Layout and Action Architecture

## Goal

Replace manual DOM overlay infrastructure, clean structural layout responsibilities and ensure generic action UI stays presentation-only.

## F06.1 — Rewrite Drawer with Angular CDK

Current manual patterns to delete:

```text
AfterViewChecked append overlay to body
document.body.appendChild/removeChild
manual body overflow lock
document:keydown.tab focus trap
querySelectorAll focusable elements
manual trigger focus bookkeeping where CDK can own it
setTimeout focus initialization
```

Use Angular CDK:

```text
Overlay
OverlayRef
ComponentPortal / TemplatePortal
BlockScrollStrategy
backdropClick
keydownEvents / escape handling
FocusTrap / cdkTrapFocus
FocusMonitor where useful
```

Expected behavior:

```text
open/close controlled state
backdrop close configurable
Escape close configurable
scroll blocked while open
focus enters drawer
focus stays in drawer
focus returns to trigger after close
stacking works with Dialog/Confirm
SSR/test friendliness improved by no scattered global DOM mutation
```

## F06.2 — Align Dialog and ConfirmDialog

Avoid separate overlay stacks with different focus/backdrop implementations.

Common infrastructure can provide:

```text
overlay creation
backdrop
focus trap
scroll strategy
z-index/stacking
escape behavior
```

Confirm config should be typed for presentation:

```ts
interface ConfirmDialogConfig {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'default' | 'warning' | 'destructive';
  requireText?: string;
}
```

Business decision of *when* to confirm remains feature/application-owned.

## F06.3 — SectionPanel becomes structural

Keep:

```text
title
subtitle
collapsible/collapsed
actions slot
content slot
optional density/visual treatment
```

Remove:

```text
loading
error
empty
emptyTitle
emptyDescription
retry
```

## F06.4 — Introduce ContentState

Create one public pattern for state composition where it is genuinely reused:

```ts
type ContentState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'empty'; title?: string; description?: string }
  | { kind: 'content' };
```

Or an equivalent component API.

Do not make every layout component independently implement loading/error/empty/retry.

## F06.5 — PageShell/PageHeader final alignment

Coordinate with F03:

```text
PageShell = width/layout
PageHeader = title/subtitle/breadcrumb/status/page actions
ContentState = loading/error/empty
Feature = orchestration
```

No nested state-shell stack.

## F06.6 — ActionToolbar presentation only

F01 removes auth/confirm. F06 finishes UX behavior:

Rules:

```text
at most one primary action
secondary frequent actions visible
3+ low-frequency actions collapse into More
More menu keyboard accessible
Escape closes menu
focus behavior is explicit
variants only primary/secondary/ghost/destructive
```

If a menu needs an overlay, use the common/CDK overlay mechanism, not manual body append.

## Tests

```text
Drawer focus enter/trap/restore
Drawer backdrop/Escape behavior
Drawer scroll strategy
Dialog/Confirm stacking
SectionPanel collapse only, no content-state orchestration
ContentState loading/error/empty/content
ActionToolbar one-primary and More behavior
keyboard/a11y tests for overlay menus
```

## Search gates

```bash
rg "document\.body|appendChild|removeChild|querySelectorAll|document:keydown\.tab" src/app/shared/ui/overlay
rg "loading|error|empty|retry" src/app/shared/ui/layout/section-panel
```

Manual overlay DOM matches expected zero except narrowly justified browser helpers outside overlay infrastructure.

## Definition of Done

- Drawer/Dialog/Confirm use consistent CDK-backed overlay infrastructure;
- manual focus trap/body portal/scroll management removed;
- SectionPanel structural only;
- ContentState handles reusable state presentation;
- ActionToolbar is presentation-only and accessible;
- quality + Storybook gates pass.
