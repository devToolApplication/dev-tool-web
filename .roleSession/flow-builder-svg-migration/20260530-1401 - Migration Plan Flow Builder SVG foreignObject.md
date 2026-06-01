# Dev FE Role: Migration Plan — Flow Builder sang SVG + foreignObject

## Meta
- **Role:** Dev FE Role
- **Date:** 2026-05-30 14:01
- **Session:** flow-builder-svg-migration
- **Status:** Planning

## Input
- **Task:** Chuyển flow-builder từ HTML overlay rendering sang SVG + foreignObject (giống JointJS+ ai-agent-builder template)
- **Scope:** `shared/ui/flow-builder/` + `features/admin/trade-bot-management/share/rule-flow/`
- **Constraint:** Giữ nguyên Angular custom templates, inspector form panel, rule expression logic

---

## Architecture Decision

### Approach được chọn: SVG + foreignObject Hybrid

Render nodes bằng JointJS custom shapes có `<foreignObject>` chứa Angular templates. Edges render native bằng JointJS links. Bỏ hoàn toàn HTML overlay layer.

### Target Architecture

```
Paper SVG (single layer — no z-index issues)
├── <g class="joint-cell joint-element"> (node)
│   ├── <rect selector="body"> (border, background, selection highlight)
│   ├── <foreignObject selector="content"> (Angular template mount point)
│   │   └── <div class="flow-node-fo-root"> (Angular rendered content)
│   ├── <circle selector="portIn"> (top port magnet)
│   └── <circle selector="portOut"> (bottom port magnet)
├── <g class="joint-cell joint-link"> (edge — native JointJS)
│   ├── <path class="connection"> (line)
│   └── <path class="marker-target"> (arrow)
└── ...
```

### Alternatives considered

| Approach | Lý do không chọn |
|----------|-----------------|
| Giữ HTML overlay (hiện tại) | Z-index workaround, 2 rendering systems, position sync overhead |
| Full SVG (no Angular) | Mất template flexibility, không dùng được pipes/directives/i18n |
| @joint/plus commercial | Chi phí $5000/year, vendor lock-in |

### Rationale
- Single rendering layer giải quyết triệt để z-index conflict
- foreignObject cho phép giữ Angular templates (i18n, pipes, shared components)
- Native JointJS interactions (drag, connect, select) — bỏ custom overlay logic
- @joint/core (free) đủ API cho approach này
- Performance tốt hơn (bỏ position sync giữa 2 layers)

---

## Migration Phases

### Phase 1: Foundation — Custom Shape + Angular Bridge (Sprint 1)

**Goal:** Tạo infrastructure cho SVG + foreignObject rendering

**Files tạo mới:**
| File | Mô tả |
|------|--------|
| `joint/joint-flow-html-shape.ts` | Custom JointJS Element shape với foreignObject markup |
| `joint/joint-flow-html-view.ts` | Custom ElementView mount Angular templates vào foreignObject |
| `joint/joint-flow-view-registry.ts` | Registry quản lý Angular ComponentRef/ViewRef cho mỗi node |
| `core/flow-angular-bridge.service.ts` | Service inject Angular ViewContainerRef, tạo/destroy template instances |

**Files sửa:**
| File | Thay đổi |
|------|----------|
| `joint/joint-flow-renderer.ts` | Thêm case render `FlowHtmlShape` thay vì transparent rect |
| `joint/joint-flow-engine.ts` | Register custom view, handle foreignObject lifecycle |
| `joint/joint-flow-paper-options.ts` | Thêm `cellViewNamespace` cho custom views |
| `flow-builder.module.ts` | Provide `FlowAngularBridgeService` |

**Deliverable:** Render 1 node type (`rule-group`) bằng foreignObject + Angular template. Verify edges render native.

**Technical Details:**

```typescript
// joint-flow-html-shape.ts
import * as joint from '@joint/core';

export const FlowHtmlShape = joint.dia.Element.define('flowBuilder.HtmlNode', {
  attrs: {
    body: {
      width: 'calc(w)',
      height: 'calc(h)',
      rx: 8, ry: 8,
      fill: 'var(--app-card-surface, #ffffff)',
      stroke: 'var(--app-border, #d8dee8)',
      strokeWidth: 1.5,
    },
    content: {
      width: 'calc(w)',
      height: 'calc(h)',
      x: 0, y: 0,
    },
    portIn: { /* top center */ },
    portOut: { /* bottom center */ },
  },
}, {
  markup: [
    { tagName: 'rect', selector: 'body' },
    { tagName: 'foreignObject', selector: 'content' },
    { tagName: 'circle', selector: 'portIn' },
    { tagName: 'circle', selector: 'portOut' },
  ],
});
```

```typescript
// joint-flow-html-view.ts
import * as joint from '@joint/core';

export class FlowHtmlNodeView extends joint.dia.ElementView {
  private angularRoot: HTMLDivElement | null = null;

  render() {
    super.render();
    this.mountAngularContent();
    return this;
  }

  private mountAngularContent() {
    const fo = this.findNode('content') as SVGForeignObjectElement;
    if (!fo) return;
    
    this.angularRoot = document.createElement('div');
    this.angularRoot.className = 'flow-node-fo-root';
    this.angularRoot.style.width = '100%';
    this.angularRoot.style.height = '100%';
    fo.appendChild(this.angularRoot);
    
    // Angular bridge sẽ mount template vào angularRoot
    const flowNodeId = this.model.get('flowNodeId');
    this.notify('html:mount', { el: this.angularRoot, nodeId: flowNodeId });
  }

  onRemove() {
    const flowNodeId = this.model.get('flowNodeId');
    this.notify('html:unmount', { nodeId: flowNodeId });
    super.onRemove();
  }
}
```

```typescript
// flow-angular-bridge.service.ts
@Injectable()
export class FlowAngularBridgeService {
  private viewRefs = new Map<string, EmbeddedViewRef<any>>();

  constructor(private vcr: ViewContainerRef) {}

  mount(nodeId: string, hostEl: HTMLElement, template: TemplateRef<any>, context: any) {
    const viewRef = this.vcr.createEmbeddedView(template, context);
    viewRef.detectChanges();
    for (const rootNode of viewRef.rootNodes) {
      hostEl.appendChild(rootNode);
    }
    this.viewRefs.set(nodeId, viewRef);
  }

  unmount(nodeId: string) {
    const viewRef = this.viewRefs.get(nodeId);
    if (viewRef) {
      viewRef.destroy();
      this.viewRefs.delete(nodeId);
    }
  }

  update(nodeId: string, context: any) {
    const viewRef = this.viewRefs.get(nodeId);
    if (viewRef) {
      Object.assign(viewRef.context, context);
      viewRef.detectChanges();
    }
  }
}
```

---

### Phase 2: Node Migration (Sprint 2-3)

**Goal:** Migrate tất cả 4 node types sang foreignObject rendering

**Sprint 2 — Simple nodes:**
| Node Type | Complexity | Notes |
|-----------|-----------|-------|
| `rule-group` | Low | Operator label + count badge |
| `rule-not` | Low | NOT chip + child label |
| `rule-ref` | Low | REF chip + rule code |

**Sprint 3 — Complex nodes:**
| Node Type | Complexity | Notes |
|-----------|-----------|-------|
| `rule-condition` | High | Multi-line expression, operator chip, params summary |

**Files sửa:**
| File | Thay đổi |
|------|----------|
| `rule-flow-node-catalog.ts` | Thay `shape: 'html'` bằng `shape: 'foreignObject'` hoặc custom config |
| `joint-flow-renderer.ts` | `createNodeShape` dùng `FlowHtmlShape` cho foreignObject nodes |
| `joint-flow-engine.ts` | Handle `html:mount`/`html:unmount` events, bridge Angular templates |
| `flow-canvas.component.ts` | Inject `FlowAngularBridgeService`, listen paper events |
| `rule-config-form.component.html` | Templates giữ nguyên (chỉ mount point thay đổi) |

**Key challenges:**
- Angular template context update khi node data thay đổi
- foreignObject sizing khi content thay đổi (auto-resize)
- Pointer events trong foreignObject (click, hover, context menu)

**Solutions:**
```typescript
// flow-canvas.component.ts — handle mount/unmount
ngAfterViewInit() {
  this.engine = new JointFlowEngine({...});
  
  // Listen for foreignObject mount requests
  this.engine.paper.on('html:mount', ({ el, nodeId }) => {
    const node = this.value?.nodes.find(n => n.id === nodeId);
    if (!node) return;
    const template = this.findTemplateForNode(node);
    if (template) {
      this.angularBridge.mount(nodeId, el, template.templateRef, {
        $implicit: node, node, data: node.data ?? {}
      });
    }
  });

  this.engine.paper.on('html:unmount', ({ nodeId }) => {
    this.angularBridge.unmount(nodeId);
  });
}
```

---

### Phase 3: Remove Overlay Layer (Sprint 4)

**Goal:** Bỏ hoàn toàn FlowNodeOverlayHostComponent và overlay edges

**Files xóa:**
| File | Lý do |
|------|-------|
| `components/flow-node-overlay-host/` (toàn bộ) | Không cần — nodes render trong SVG |

**Files sửa:**
| File | Thay đổi |
|------|----------|
| `flow-canvas.component.ts` | Bỏ overlay host reference, bỏ `linkDragging` state |
| `flow-canvas.component.html` | Bỏ `<app-flow-node-overlay-host>` |
| `flow-canvas.component.css` | Bỏ z-index rules |
| `flow-builder.module.ts` | Bỏ `FlowNodeOverlayHostComponent` declaration |
| `index.ts` | Bỏ export |

**Interactions migration:**
| Interaction | Hiện tại (overlay) | Mới (native JointJS) |
|-------------|-------------------|---------------------|
| Node click | `(pointerdown)` on overlay div | `element:pointerclick` paper event |
| Node drag | Overlay pointer capture | `element:pointermove` + JointJS `interactive.elementMove` |
| Context menu | `(contextmenu)` on overlay div | `element:contextmenu` paper event |
| Port drag | `(pointerdown)` on port div | `element:magnet:pointerdown` paper event |
| Add button (+) | Overlay HTML button | JointJS tool (custom `joint.dia.ToolView`) hoặc giữ HTML button ngoài canvas |

**Add button (+) approach:**
Dùng JointJS `elementTools` — tạo custom tool hiển thị khi hover node:
```typescript
const AddButtonTool = joint.elementTools.Button.extend({
  options: {
    markup: [{ tagName: 'circle', ... }, { tagName: 'text', ... }],
    x: '50%',
    y: '100%',
    offset: { y: 16 },
    action: (evt, elementView) => {
      // Emit add node event
    }
  }
});
```

---

### Phase 4: Polish & Optimize (Sprint 5)

**Goal:** Connection animations, hover effects, performance, full test coverage

**Tasks:**
1. **Custom connector** — cubic bezier (giống template) thay manhattan router
2. **Connection animation** — smooth path drawing khi connect
3. **Hover effects** — highlight node border, show ports on hover (native JointJS highlighting)
4. **Selection** — native JointJS selection highlighting (stroke change)
5. **Performance** — lazy render foreignObject content (chỉ mount khi visible)
6. **Accessibility** — ARIA labels trên SVG elements
7. **Tests** — Update tất cả Playwright tests, unit tests

**Custom connector (thay manhattan):**
```typescript
// Giống template — straight connector với cubic corners
export const flowConnector: joint.connectors.Connector = (
  sourcePoint, targetPoint, routePoints, _, linkView
) => {
  return joint.connectors.straight(sourcePoint, targetPoint, routePoints, {
    cornerType: 'cubic',
    cornerRadius: 10,
  });
};
```

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| foreignObject browser compat (Safari) | Low | Medium | Test Safari 16+, fallback SVG-only |
| Angular CD trong foreignObject | Medium | High | Manual `detectChanges()`, OnPush strategy |
| Event conflicts (SVG vs foreignObject) | Medium | Medium | `stopPropagation` + JointJS `interactive` config |
| Zoom scaling text trong foreignObject | Medium | Low | CSS counter-scale hoặc fixed font-size |
| Breaking existing Playwright tests | High | Low | Update selectors progressively |
| Performance regression nhiều nodes | Low | Medium | Lazy mount, virtual scrolling cho >50 nodes |
| JointJS @joint/core API limitations | Low | High | Verify API trước Phase 1, fallback plan |

---

## Migration Checklist (per phase)

### Phase 1 Done khi:
- [ ] `FlowHtmlShape` render trong paper SVG
- [ ] foreignObject chứa Angular template content
- [ ] Edges (JointJS links) render visible (không bị che)
- [ ] Pan/zoom hoạt động đúng (foreignObject scale theo)
- [ ] Build pass, no regressions

### Phase 2 Done khi:
- [ ] Tất cả 4 node types render bằng foreignObject
- [ ] Node data changes update template content
- [ ] Node resize khi content thay đổi
- [ ] Ports visible và functional
- [ ] Inspector form vẫn hoạt động khi select node

### Phase 3 Done khi:
- [ ] FlowNodeOverlayHostComponent đã xóa
- [ ] Tất cả interactions hoạt động native (click, drag, connect, context menu)
- [ ] Add button (+) hoạt động
- [ ] Không còn z-index CSS hacks
- [ ] Playwright tests pass

### Phase 4 Done khi:
- [ ] Custom connector (cubic bezier)
- [ ] Hover/selection effects
- [ ] Performance OK với 30+ nodes
- [ ] Full Playwright test coverage
- [ ] Documentation updated

---

## Files Affected Summary

| Category | Files | Action |
|----------|-------|--------|
| New (Phase 1) | 4 files | Create |
| Modified (Phase 2-3) | ~12 files | Modify |
| Deleted (Phase 3) | ~5 files (overlay host) | Delete |
| Tests | ~8 files | Update |
| **Total** | **~29 files** | |

---

## Next Role
- **Role:** Dev FE Role (self — implementation)
- **Action required:** Bắt đầu Phase 1 — tạo FlowHtmlShape + FlowHtmlNodeView + Angular Bridge
- **Priority:** Major
- **First file:** `joint/joint-flow-html-shape.ts`
