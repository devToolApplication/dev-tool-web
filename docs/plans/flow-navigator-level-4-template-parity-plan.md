# Flow Navigator Level 4 Plan - Template Parity Polish

Date: 2026-05-29

## Objective

Polish custom minimap so it feels close to the `joint-demos/ai-agent-builder` template while staying inside the current Angular shared component architecture.

This level assumes levels 1-3 are complete.

## Target Feature List

Minimap should include:
- Compact header/menu with plus, minus, fit, close.
- Zoom percentage display.
- Live viewport rectangle.
- Drag viewport to pan.
- Optional collapsed rail or compact icon.
- Selected node highlight.
- Node type color/tone in minimap.
- Good keyboard and screen reader behavior.
- Responsive behavior on narrow screens.
- Storybook controls for minimap config.

## Proposed Public Config

Extend `FlowToolbarConfig` or add `FlowNavigatorConfig`.

Recommended model:

```ts
export interface FlowNavigatorConfig {
  visible?: boolean;
  width?: number;
  height?: number;
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  controls?: Array<'zoomIn' | 'zoomOut' | 'fit' | 'close'>;
  showZoom?: boolean;
  showViewport?: boolean;
  draggableViewport?: boolean;
  collapsible?: boolean;
}
```

Add input to `FlowBuilderComponent`:

```ts
@Input() navigator: FlowNavigatorConfig | null = { visible: true };
```

Keep backward compatibility:
- `resolvedCapabilities.navigator` still decides if feature is allowed.
- `navigatorOpen()` still decides current open state.
- If `navigator.visible === false`, do not render it.

## Files To Modify

- `src/app/shared/ui/flow-builder/models/flow-command.model.ts`
- `src/app/shared/ui/flow-builder/models/flow-capability.model.ts`
- `src/app/shared/ui/flow-builder/models/flow-viewport.model.ts`
- `src/app/shared/ui/flow-builder/models/index.ts`
- `src/app/shared/ui/flow-builder/components/flow-builder/flow-builder.component.ts`
- `src/app/shared/ui/flow-builder/components/flow-builder/flow-builder.component.html`
- `src/app/shared/ui/flow-builder/components/flow-builder/flow-builder.component.css`
- `src/app/shared/ui/flow-builder/components/flow-navigator/flow-navigator.component.ts`
- `src/app/shared/ui/flow-builder/components/flow-navigator/flow-navigator.component.html`
- `src/app/shared/ui/flow-builder/components/flow-navigator/flow-navigator.component.css`
- `src/app/shared/ui/flow-builder/joint/joint-flow-engine.ts`
- `src/app/core/i18n/common/common.i18n.json`
- `src/app/shared/ui/flow-builder/components/flow-builder/flow-builder.stories.ts`

## UX Details

### Placement

Default: bottom-left.

CSS classes:
- `.flow-builder__navigator-panel--bottom-left`
- `.flow-builder__navigator-panel--bottom-right`
- `.flow-builder__navigator-panel--top-left`
- `.flow-builder__navigator-panel--top-right`

Use `FlowNavigatorConfig.position`.

### Size

Default:
- width: 300
- height: 190 with controls

Use config:

```html
<app-flow-navigator
  [width]="resolvedNavigator.width ?? 300"
  [height]="resolvedNavigator.height ?? 190"
></app-flow-navigator>
```

### Zoom Percent

Engine snapshot should include:

```ts
zoomPercent: number;
```

Or derive:

```ts
Math.round(snapshot.scale * 100)
```

Render as compact text:

```html
<span class="flow-navigator__zoom">{{ zoomPercent }}%</span>
```

Keep it secondary, not visually stronger than controls.

### Collapsed State

Two possible behaviors:

1. Close only.
   - Existing toolbar minimap button reopens it.
   - Simpler and acceptable.

2. Collapsed rail.
   - Minimap collapses to a small floating square button.
   - User can reopen from the square.

Recommended for template parity:
- Add `collapsed` local state in `FlowBuilderComponent`.
- Keep `navigatorOpen()` for full hidden/open.
- Add `navigatorCollapsed = signal(false)`.
- Close/hide still uses `toggleNavigator`.
- Collapse uses `navigatorCollapsed.set(true)`.

Do not add collapse until the base controls are stable.

### Node Tone In Minimap

Minimap can use the same node `status` and type tone:
- `success`, `warning`, `danger`, `primary`, `muted`.

Implement helper:

```ts
nodeToneClass(node: FlowNode): string
```

Classes:
- `.flow-navigator__node--tone-primary`
- `.flow-navigator__node--tone-success`
- `.flow-navigator__node--tone-warning`
- `.flow-navigator__node--tone-danger`
- `.flow-navigator__node--tone-muted`

This requires passing `nodeTypes` to navigator or resolving tone in builder.

Recommended:
- Add `@Input() nodeTypes: FlowNodeTypeDefinition[] = []` to navigator.
- Add `nodeTone(node)`.

## Architecture Rules

- Navigator remains a pure view/control component.
- JointJS-specific math stays in `JointFlowEngine` or plain helper functions.
- `FlowBuilderComponent` orchestrates events between navigator and canvas.
- `FlowCanvasComponent` exposes engine events but does not render minimap UI.
- Avoid adding global services for minimap state.

## Implementation Phases

### Phase 4.1 - Config Model

1. Add `FlowNavigatorConfig`.
2. Export model.
3. Add `@Input() navigator`.
4. Add `resolvedNavigator` getter.
5. Pass config fields to `app-flow-navigator`.
6. Update Storybook args to show controls.

Acceptance:
- Existing stories render with defaults.
- Users can hide navigator with `[navigator]="{ visible: false }"`.

### Phase 4.2 - Position And Size

1. Add position classes to builder panel.
2. Add width/height inputs to navigator.
3. Replace hard-coded `mapWidth/mapHeight` with inputs and getters.
4. Ensure mobile behavior does not overlap inspector.

Acceptance:
- Minimap can appear bottom-right and top-right.
- Storybook controls can demonstrate positions.

### Phase 4.3 - Zoom Percent And Tone

1. Add zoom percent display.
2. Pass node types.
3. Add tone classes.
4. Tune CSS colors with existing tokens.

Acceptance:
- Zoom percent changes on zoom.
- Selected/status nodes remain readable.

### Phase 4.4 - Collapsed Rail

1. Add collapse control distinct from close.
2. Add collapsed button.
3. Add i18n keys.
4. Add keyboard handling.

Acceptance:
- Collapse hides minimap body but leaves reopen affordance.
- Close hides minimap entirely and toolbar can reopen.

### Phase 4.5 - Accessibility And Polish

1. Review aria labels for icon buttons.
2. Add focus-visible states.
3. Ensure 24px minimum target on desktop and 32px on touch.
4. Add `touch-action: none` only to draggable viewport.
5. Check high contrast against app tokens.

Acceptance:
- Keyboard users can use controls.
- Screen reader labels are meaningful.
- No text overflow in narrow viewport.

## I18n Keys

Add:
- `shared.flowBuilder.navigator.title`
- `shared.flowBuilder.navigator.zoomIn`
- `shared.flowBuilder.navigator.zoomOut`
- `shared.flowBuilder.navigator.fit`
- `shared.flowBuilder.navigator.close`
- `shared.flowBuilder.navigator.collapse`
- `shared.flowBuilder.navigator.expand`
- `shared.flowBuilder.navigator.viewport`
- `shared.flowBuilder.navigator.zoomPercent`

## Storybook Updates

Update `FlowBuilder` stories:
- `AIAgentWorkflow`: full minimap controls and viewport.
- `EmptyCanvas`: controls visible, no viewport until content exists or viewport shows empty canvas.
- `LargeGraph`: best story for viewport drag.
- Add optional story `Navigator Positions` if useful.

## Verification

Run:

```powershell
npm.cmd run build
npm.cmd run build-storybook
```

Browser checks:
- Desktop 1782x900: AI Agent Workflow.
- Desktop 1782x900: Large Graph.
- Mobile 390x844: Empty Canvas.
- Interactions:
  - zoom in
  - zoom out
  - fit
  - close
  - reopen
  - collapse
  - expand
  - drag viewport
  - select minimap node

Optional Playwright checks:
- `.flow-navigator__action--zoom-in` exists.
- `.flow-navigator__zoom` changes after zoom.
- `.flow-navigator__viewport` moves after drag.
- `.flow-builder__navigator-panel--bottom-right` applies when config changes.

## Risks

- Feature creep can make minimap too dominant.
  - Mitigation: keep compact, opacity restrained, no large text.
- Too many config options can complicate shared API.
  - Mitigation: ship defaults and keep options optional.
- Drag math may break on scale changes.
  - Mitigation: source all math from one snapshot and one mapping helper.
- Storybook iframe can hide pointer capture bugs.
  - Mitigation: test both Storybook and app route if available.

## Definition Of Done

- Visual behavior is close enough to template for minimap/menu.
- API is documented in story controls or docs.
- Build and Storybook build pass.
- Browser smoke tests cover desktop and mobile.
- No direct third-party UI components are introduced.

