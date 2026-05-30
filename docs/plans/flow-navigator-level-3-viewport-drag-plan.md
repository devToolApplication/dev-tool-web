# Flow Navigator Level 3 Plan - Drag Viewport To Pan

Date: 2026-05-29

## Objective

Allow dragging the minimap viewport rectangle to pan the main canvas, matching the expected behavior from flow-builder templates.

This level depends on level 2 viewport rectangle sync.

## User Experience

User can:
- Hover the viewport rectangle and see grab cursor.
- Drag the rectangle inside the minimap.
- Main canvas pans live or on drag end.
- Releasing pointer keeps the canvas at the new position.

Recommended behavior:
- Live pan while dragging for desktop.
- Use pointer events so mouse and touch both work.
- Do not start drag from node mini buttons unless the target is the viewport rectangle.

## New API

Add output to `FlowNavigatorComponent`:

```ts
@Output() readonly viewportPan = new EventEmitter<{ centerX: number; centerY: number }>();
```

Meaning:
- `centerX`, `centerY` are local paper coordinates that should become the center of the main canvas viewport.

Alternative output:

```ts
@Output() readonly viewportTranslate = new EventEmitter<{ x: number; y: number }>();
```

Do not use raw translate output in navigator. Navigator should not know JointJS translation semantics. Emit local paper center.

Add method to `JointFlowEngine`:

```ts
panToLocalCenter(centerX: number, centerY: number): void
```

Implementation:

```ts
const scale = this.paper.scale().sx;
const width = this.options.el.clientWidth;
const height = this.options.el.clientHeight;
this.paper.translate(
  width / 2 - centerX * scale,
  height / 2 - centerY * scale
);
this.scheduleViewportChange();
```

## Coordinate Mapping

When user drags in minimap:

1. Convert pointer position to minimap body coordinates:

```ts
const rect = body.getBoundingClientRect();
const x = event.clientX - rect.left;
const y = event.clientY - rect.top;
```

2. Convert minimap coordinate to local paper coordinate:

```ts
const localX = bounds.minX + (x - padding) / minimapScale;
const localY = bounds.minY + (y - padding) / minimapScale;
```

3. Emit `{ centerX: localX, centerY: localY }`.

4. Builder calls engine pan:

```ts
this.canvas?.engineInstance?.panToLocalCenter(centerX, centerY);
```

## Component State

In `FlowNavigatorComponent`:

```ts
private draggingViewport = false;
private activePointerId: number | null = null;
```

Handlers:
- `onViewportPointerDown(event)`
- `onViewportPointerMove(event)`
- `onViewportPointerUp(event)`
- `onViewportPointerCancel(event)`

Use `setPointerCapture`:

```ts
(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
```

Because pointer events on document can be brittle in Storybook iframe.

## Files To Modify

- `src/app/shared/ui/flow-builder/components/flow-navigator/flow-navigator.component.ts`
- `src/app/shared/ui/flow-builder/components/flow-navigator/flow-navigator.component.html`
- `src/app/shared/ui/flow-builder/components/flow-navigator/flow-navigator.component.css`
- `src/app/shared/ui/flow-builder/components/flow-builder/flow-builder.component.ts`
- `src/app/shared/ui/flow-builder/components/flow-builder/flow-builder.component.html`
- `src/app/shared/ui/flow-builder/joint/joint-flow-engine.ts`
- `src/app/shared/ui/flow-builder/components/flow-builder/flow-builder.stories.ts`

## Implementation Steps

1. Confirm level 2 exists.
   - `FlowNavigatorComponent` has `viewport`.
   - `.flow-navigator__viewport` renders correctly.
   - Builder has `viewportChange` signal.

2. Add engine method.
   - Add `panToLocalCenter(centerX, centerY)`.
   - Use current scale.
   - Call `scheduleViewportChange()`.
   - Guard against invalid numbers.

3. Add navigator output.
   - Add `viewportPan`.
   - Implement coordinate conversion helper:
     ```ts
     private localPointFromNavigatorEvent(event: PointerEvent): { x: number; y: number } | null
     ```

4. Add template event bindings.
   - On viewport rectangle:
     ```html
     (pointerdown)="onViewportPointerDown($event)"
     (pointermove)="onViewportPointerMove($event)"
     (pointerup)="onViewportPointerUp($event)"
     (pointercancel)="onViewportPointerCancel($event)"
     ```
   - Add `role="slider"` is not ideal for 2D pan. Prefer `role="button"` with aria label.

5. Add CSS.
   - `.flow-navigator__viewport { cursor: grab; touch-action: none; }`
   - `.flow-navigator__viewport--dragging { cursor: grabbing; }`
   - Add visual elevation while dragging.

6. Wire Builder.
   - In template:
     ```html
     (viewportPan)="onNavigatorViewportPan($event)"
     ```
   - In TS:
     ```ts
     onNavigatorViewportPan(event: { centerX: number; centerY: number }): void {
       this.canvas?.engineInstance?.panToLocalCenter(event.centerX, event.centerY);
     }
     ```

7. Behavior tuning.
   - Decide whether panning should happen on pointerdown immediately.
   - Recommended: pointerdown pans to clicked position, then pointermove continues.
   - Add `event.preventDefault()` and `event.stopPropagation()` so minimap node selection does not trigger.

## Acceptance Criteria

- Dragging viewport rectangle pans the main canvas.
- Viewport rectangle position follows the drag.
- Releasing pointer ends drag cleanly.
- Dragging outside minimap still works until pointerup because of pointer capture.
- Node selection in minimap still works when clicking node boxes.
- No page text selection during drag.
- Touch drag works in mobile viewport if browser supports pointer events.

## Verification

Run:

```powershell
npm.cmd run build
npm.cmd run build-storybook
```

Manual browser checks:
- Open Large Graph story.
- Fit graph.
- Drag minimap viewport right/down.
- Main canvas should pan opposite direction visually so the selected viewport changes.
- Click a minimap node after dragging; selection still works.
- Resize Storybook viewport and repeat.

Playwright smoke:

```ts
const viewport = page.locator('.flow-navigator__viewport');
const before = await viewport.boundingBox();
await viewport.dragTo(page.locator('.flow-navigator__body'), {
  targetPosition: { x: 240, y: 100 },
});
const after = await viewport.boundingBox();
expect(after?.x).not.toBe(before?.x);
```

## Risks

- Drag-to-pan can fight with node click if z-index is wrong.
  - Mitigation: viewport should be a separate layer and stop propagation.
- Graph bounds can change while dragging if nodes are moving.
  - Mitigation: use current navigation bounds on every pointer move.
- Pan feels too sensitive.
  - Mitigation: map pointer to viewport center, not delta times arbitrary multiplier.

## Rollback

Remove:
- `panToLocalCenter()` from engine.
- `viewportPan` output and pointer handlers.
- Builder event binding and handler.
- Drag CSS.

