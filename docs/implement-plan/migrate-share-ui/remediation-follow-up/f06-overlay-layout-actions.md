# F06 — Overlay, Layout and Action Boundaries

## Goal

Replace manual overlay/focus DOM management and make layout components structural instead of application-state orchestrators.

## Scope

```text
src/app/shared/ui/overlay/drawer/
src/app/shared/ui/overlay/confirm-dialog/
src/app/shared/ui/layout/page-shell/
src/app/shared/ui/layout/section-panel/
src/app/shared/ui/layout/action-toolbar/
src/app/shared/ui/layout/filter-panel/
src/app/shared/ui/layout/card/
```

## 1. Drawer -> Angular CDK

Use Angular CDK primitives already available in the repo:

```text
Overlay
Portal
FocusTrap / cdkTrapFocus
BlockScrollStrategy
Escape/backdrop handling
focus restoration
```

Delete manual behavior:

```text
AfterViewChecked append overlay
appendChild(document.body)
removeChild(document.body)
document.body.style.overflow
manual document Tab listener
querySelectorAll focusable list
setTimeout initial focus hacks where CDK handles lifecycle
```

Acceptance:

```text
open focuses expected first element
Tab/Shift+Tab stay inside
Escape closes when allowed
backdrop closes when allowed
loading can block close if intended
close restores trigger focus
nested/long content remains usable
mobile drawer behaves correctly
```

## 2. ConfirmDialog

Keep a typed generic confirm service/host with explicit destructive semantics.

Example:

```ts
confirm({
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive,
  requireText
})
```

Do not let presentational Table/Toolbar automatically invent business confirmation policy.

## 3. PageShell structural only

Remove loading/error/empty/retry state ownership. It should manage width/spacing/regions only.

## 4. SectionPanel structural only

Remove:

```text
loading
error
empty
retry
```

Keep title/subtitle/actions/collapse only if collapse is genuinely structural.

Introduce/use an explicit `ContentState` pattern where common loading/error/empty/content switching is useful.

## 5. ActionToolbar

By this phase it should be permission-agnostic and confirmation-agnostic.

Enforce one dominant primary action. Put 3+ secondary actions into overflow as appropriate.

## 6. Card

Remove fake `interactive` behavior unless the component renders/contains actual semantic interactive controls.

## 7. FilterPanel

Keep frequent filters visible. Move advanced filters into drawer/panel. Show applied filters as removable chips with Clear All.

## Tests

```text
Drawer focus trap/restore/Escape/backdrop
Confirm destructive behavior
PageShell structural rendering
SectionPanel no state orchestration
ActionToolbar placement and keyboard overflow
FilterPanel applied-chip behavior
```

## Search gates

```bash
rg "AfterViewChecked|appendChild\(|body\.style\.overflow|querySelectorAll<HTMLElement>|document:keydown.tab" src/app/shared/ui/overlay
rg "@Input\(\) loading|@Input\(\) error|@Input\(\) empty|@Output\(\) retry" src/app/shared/ui/layout/page-shell src/app/shared/ui/layout/section-panel
```

Expected: manual overlay/focus management removed; PageShell/SectionPanel state orchestration removed.

## Definition of Done

- Drawer uses CDK overlay/focus/scroll facilities;
- manual body portal/focus trap removed;
- ConfirmDialog generic and typed;
- PageShell/SectionPanel structural;
- ActionToolbar business-agnostic;
- FilterPanel follows visible/advanced/applied-filter UX;
- tests pass.
