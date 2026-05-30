# Flow Navigator Level 2 Plan - Viewport Rectangle Sync

Date: 2026-05-29

## Objective

Show the current visible paper viewport as a rectangle inside the minimap. This makes the minimap feel like the template and prepares for drag-to-pan in level 3.

This level does not make the viewport draggable yet.

## User Experience

The minimap should show:
- Flow nodes as small boxes.
- A viewport rectangle showing the current canvas visible area.
- Rectangle updates when user pans, zooms, auto-layouts, fits, or resizes canvas.

The viewport rectangle should be subtle:
- Border: `--app-primary`
- Fill: transparent or low-opacity primary fill
- Pointer cursor remains default in level 2

## Required Engine Data

`JointFlowEngine` must expose:
- Current paper scale.
- Current paper translation.
- Current container size.
- Current content bounds or graph bounds.

Add a public snapshot model:

```ts
export interface FlowViewportSnapshot {
  scale: number;
  translateX: number;
  translateY: number;
  clientWidth: number;
  clientHeight: number;
  contentBounds: {
    minX: number;
    minY: number;
    width: number;
    height: number;
  };
}
```

Better location:
- `src/app/shared/ui/flow-builder/models/flow-command.model.ts` if considered UI event.
- Or a new `flow-viewport.model.ts` under `models`.

Recommended: create `models/flow-viewport.model.ts` and export it from `models/index.ts`.

## Component API

Update `FlowNavigatorComponent` inputs:

```ts
@Input() viewport: FlowViewportSnapshot | null = null;
```

Add helper:

```ts
viewportStyle(): Record<string, string> | null
```

The navigator already calculates bounds from nodes. Use the same minimap coordinate system for the viewport rectangle.

## Coordinate Mapping

The visible local paper area can be derived from the inverse transform:

Given:
- client viewport size: `clientWidth`, `clientHeight`
- scale: `s`
- translation: `tx`, `ty`

Visible local bounds:

```ts
const visibleLeft = -tx / s;
const visibleTop = -ty / s;
const visibleWidth = clientWidth / s;
const visibleHeight = clientHeight / s;
```

Then map local bounds to minimap:

```ts
const scale = Math.min(
  (mapWidth - padding * 2) / navigatorBounds.width,
  (bodyHeight - padding * 2) / navigatorBounds.height
);

left = padding + (visibleLeft - bounds.minX) * scale;
top = padding + (visibleTop - bounds.minY) * scale;
width = visibleWidth * scale;
height = visibleHeight * scale;
```

Important: navigator bounds must include both graph content and visible viewport, otherwise the rectangle can be clipped when user pans outside content.

Recommended helper:

```ts
get navigationBounds(): NavigatorBounds {
  return union(nodeBounds, visibleBounds)
}
```

## Files To Modify

- `src/app/shared/ui/flow-builder/models/flow-viewport.model.ts`
- `src/app/shared/ui/flow-builder/models/index.ts`
- `src/app/shared/ui/flow-builder/joint/joint-flow-engine.ts`
- `src/app/shared/ui/flow-builder/components/flow-canvas/flow-canvas.component.ts`
- `src/app/shared/ui/flow-builder/components/flow-builder/flow-builder.component.ts`
- `src/app/shared/ui/flow-builder/components/flow-builder/flow-builder.component.html`
- `src/app/shared/ui/flow-builder/components/flow-navigator/flow-navigator.component.ts`
- `src/app/shared/ui/flow-builder/components/flow-navigator/flow-navigator.component.html`
- `src/app/shared/ui/flow-builder/components/flow-navigator/flow-navigator.component.css`

## Implementation Steps

1. Add viewport model.
   - Create `flow-viewport.model.ts`.
   - Export from `models/index.ts`.

2. Add engine snapshot.
   - Add `getViewportSnapshot(): FlowViewportSnapshot`.
   - Use `this.paper.scale()` and `this.paper.translate()`.
   - Use `this.options.el.clientWidth/clientHeight`.
   - Use graph bbox:
     ```ts
     const bbox = this.graph.getBBox(this.graph.getCells(), { useModelGeometry: true });
     ```
   - If no cells, return content bounds `{ minX: 0, minY: 0, width: 1, height: 1 }`.

3. Add engine viewport changed callback.
   - Add callback to `FlowEngineCallbacks`:
     ```ts
     onViewportChange?: (snapshot: FlowViewportSnapshot) => void;
     ```
   - Call it after:
     - `fitContent()`
     - `zoomIn()`
     - `zoomOut()`
     - `resetZoom()`
     - panning mousemove or mouseup
     - `resizeToContainer()`
     - `autoLayout()` if it changes content position then fit may call it too

4. Throttle viewport events.
   - Avoid firing too much on mousemove.
   - Use `requestAnimationFrame` inside `JointFlowEngine`:
     ```ts
     private viewportChangeFrame = 0;
     private scheduleViewportChange(): void { ... }
     ```
   - Cancel frame in `destroy()`.

5. Pass snapshot out of canvas.
   - Add output:
     ```ts
     @Output() readonly viewportChange = new EventEmitter<FlowViewportSnapshot>();
     ```
   - Wire engine callback to emit.

6. Store snapshot in `FlowBuilderComponent`.
   - Add signal:
     ```ts
     readonly viewport = signal<FlowViewportSnapshot | null>(null);
     ```
   - Add `onViewportChange(snapshot)` setter.
   - Pass `[viewport]="viewport()"` to navigator.

7. Render viewport in navigator.
   - Add div:
     ```html
     @if (viewportStyle(); as style) {
       <div class="flow-navigator__viewport" [ngStyle]="style"></div>
     }
     ```
   - Put viewport above grid and below node boxes or above node boxes depending on visual.
   - Recommended z-order:
     - grid: 0
     - nodes: 1
     - viewport: 2

8. Update navigator bounds.
   - Include visible viewport bounds when computing scale.
   - Memoization is optional; the node count is small.

## Acceptance Criteria

- Viewport rectangle appears in minimap.
- It updates after zoom in/out.
- It updates after ctrl-wheel zoom.
- It updates after blank canvas pan.
- It updates after fit.
- It stays within minimap body or is clipped cleanly.
- Existing minimap node click still works.
- No layout shift in minimap controls.

## Verification

Run:

```powershell
npm.cmd run build
npm.cmd run build-storybook
```

Manual browser checks:
- Open AI Agent Workflow story.
- Pan blank canvas.
- Zoom with minimap `+` and toolbar zoom.
- Use Ctrl+wheel zoom.
- Click fit.
- Confirm rectangle moves and resizes.

Optional Playwright checks:
- Assert `.flow-navigator__viewport` exists.
- Read its bounding rect before and after zoom.
- Ensure width/height changes after zoom.

## Risks

- Viewport math can be inverted if `paper.translate()` semantics are misunderstood.
  - Mitigation: compare with `paper.clientToLocalPoint()` at canvas corners if formula is off.
- Async JointJS rendering can produce stale graph bbox.
  - Mitigation: schedule viewport update on next animation frame after render/fit.
- Minimap bounds may jump when panning outside graph.
  - Mitigation: union content bounds and viewport bounds.

## Rollback

Remove:
- `FlowViewportSnapshot` model.
- Engine viewport snapshot/callback.
- Canvas/Builder viewport outputs.
- Navigator viewport input and DOM.

