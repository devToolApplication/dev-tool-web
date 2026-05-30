# Flow Navigator Level 1 Plan - Controls Only

Date: 2026-05-29

## Objective

Add a compact minimap menu that looks and behaves like the template basics:
- `+` zoom in
- `-` zoom out
- fit to content
- collapse or hide minimap

This level intentionally does not implement viewport rectangle sync or drag-to-pan.

## Current Baseline

`FlowNavigatorComponent`:
- Inputs: `value`, `selectedId`
- Output: `nodeSelect`
- Fixed dimensions: `mapWidth = 300`, `mapHeight = 160`
- Renders node boxes as buttons.

`FlowBuilderComponent`:
- Owns the navigator panel.
- Already has `executeCommand('zoomIn')`, `zoomOut`, `fit`, `toggleNavigator`.
- Shows navigator when `resolvedCapabilities.navigator && navigatorOpen()`.

## API Design

Add outputs to `FlowNavigatorComponent`:

```ts
@Output() readonly zoomIn = new EventEmitter<void>();
@Output() readonly zoomOut = new EventEmitter<void>();
@Output() readonly fit = new EventEmitter<void>();
@Output() readonly close = new EventEmitter<void>();
```

No new command enum is required because `FlowBuilderComponent` already has commands.

Optional input:

```ts
@Input() title = 'shared.flowBuilder.navigator.title';
@Input() zoomLabel: string | null = null;
```

If adding `zoomLabel` is too early, skip it in level 1.

## UI Design

Add a header row inside minimap:

```html
<div class="flow-navigator__header">
  <span class="flow-navigator__title">...</span>
  <div class="flow-navigator__actions">
    <button aria-label="Zoom in">+</button>
    <button aria-label="Zoom out">-</button>
    <button aria-label="Fit">...</button>
    <button aria-label="Close">...</button>
  </div>
</div>
```

Visual rules:
- Keep header height around 28-32px.
- Use icon-only controls.
- Buttons must be 24x24 or 28x28 with stable dimensions.
- The minimap body remains below header.
- On hover/focus, use `--app-chart-primary-fill` and `--app-primary`.
- Do not use text-heavy labels inside the minimap.

Suggested icons:
- `+` plain text symbol for zoom in.
- `-` plain text symbol for zoom out.
- `pi pi-arrows-alt` or CSS text `[]` for fit. If using icon class, it is only CSS class on native element, not a third-party component.
- `pi pi-times` or `x` for close.

## Files To Modify

- `src/app/shared/ui/flow-builder/components/flow-navigator/flow-navigator.component.ts`
- `src/app/shared/ui/flow-builder/components/flow-navigator/flow-navigator.component.html`
- `src/app/shared/ui/flow-builder/components/flow-navigator/flow-navigator.component.css`
- `src/app/shared/ui/flow-builder/components/flow-builder/flow-builder.component.html`
- `src/app/shared/ui/flow-builder/components/flow-builder/flow-builder.component.ts`
- `src/app/core/i18n/common/common.i18n.json`
- `src/app/shared/ui/flow-builder/components/flow-builder/flow-builder.stories.ts`

## Implementation Steps

1. Add i18n keys.
   - `shared.flowBuilder.navigator.title`
   - `shared.flowBuilder.navigator.zoomIn`
   - `shared.flowBuilder.navigator.zoomOut`
   - `shared.flowBuilder.navigator.fit`
   - `shared.flowBuilder.navigator.close`

2. Update `FlowNavigatorComponent`.
   - Add outputs listed above.
   - Add `trackBy` is not needed because Angular `@for track node.id` is already present.
   - Keep `nodeStyle()` behavior unchanged.

3. Update navigator template.
   - Wrap existing grid/nodes in `.flow-navigator__body`.
   - Add header/actions before body.
   - Use native `<button type="button">`.
   - Add translated `aria-label` and `title`.

4. Update navigator CSS.
   - Convert `.flow-navigator` to flex column.
   - Add `.flow-navigator__header`.
   - Add `.flow-navigator__actions`.
   - Add `.flow-navigator__action`.
   - Move existing absolute grid/nodes into `.flow-navigator__body`.
   - Preserve existing `mapWidth/mapHeight` as total panel size or change to body size explicitly.

5. Wire in `FlowBuilderComponent`.
   - In template:
     ```html
     <app-flow-navigator
       ...
       (zoomIn)="executeCommand('zoomIn')"
       (zoomOut)="executeCommand('zoomOut')"
       (fit)="executeCommand('fit')"
       (close)="executeCommand('toggleNavigator')"
     ></app-flow-navigator>
     ```
   - No TS change needed unless command execution needs a wrapper.

6. Update Storybook notes.
   - Remove any note that minimap controls are missing.
   - Ensure `AIAgentWorkflow`, `EmptyCanvas`, `LargeGraph` show controls.

## Acceptance Criteria

- Minimap has visible plus, minus, fit, close controls.
- `+` calls paper zoom in.
- `-` calls paper zoom out.
- fit calls current `fitContent()`.
- close hides minimap.
- Selecting a node from minimap still works.
- Controls do not resize the minimap while hovering.
- Keyboard tab can reach controls and node buttons.

## Verification

Run:

```powershell
npm.cmd run build
npm.cmd run build-storybook
```

Browser checks:
- Open `Shared/UI/FlowBuilder/AI Agent Workflow`.
- Click `+`, verify canvas zooms in.
- Click `-`, verify canvas zooms out.
- Click fit, verify graph recenters.
- Click close, verify minimap disappears.
- Click toolbar minimap command, verify minimap reappears.
- Click a minimap node, verify inspector selects the node.

Playwright smoke idea:

```ts
await page.locator('.flow-navigator__action--zoom-in').click();
await page.locator('.flow-navigator__action--zoom-out').click();
await page.locator('.flow-navigator__action--fit').click();
await page.locator('.flow-navigator__action--close').click();
```

## Risks

- Header consumes body height and makes nodes cramped.
  - Mitigation: treat `mapHeight` as panel height and reduce body height with CSS, or increase default panel to 300x190.
- Close action can be confused with delete.
  - Mitigation: tooltip and title must say minimap close.

## Rollback

Revert only:
- New navigator outputs.
- Header/actions markup and CSS.
- Event wiring in `flow-builder.component.html`.
- New i18n keys.

