# Workflow Builder Layout + Node Drawer Implementation Plan

## 1. Mục tiêu

Refactor màn hình Workflow Builder để ưu tiên không gian cho canvas và giảm cảm giác chật do layout 3 cột hiện tại.

Layout đích:

```text
Page Header + actions
────────────────────────────────────────────────────────
Thông tin chung                                      [▲]
Name | Description | Max parallel | Status
────────────────────────────────────────────────────────
┌──────── Node Palette ────────┬─────────────────────────┐
│                              │                         │
│                              │         CANVAS          │
│                              │                         │
└──────────────────────────────┴─────────────────────────┘
Problems · 0                                         [▲]

Click node
                                  ┌──────────────────────┐
                                  │ Node Drawer          │
                                  │ AI Gate / Code Gate  │
                                  │ Logic / Start / End  │
                                  │                      │
                                  │ Existing Inspector   │
                                  │                      │
                                  └──────────────────────┘
```

Yêu cầu chính:

- Đưa phần `Thông tin chung` lên trên canvas.
- Bỏ inspector cố định bên phải.
- Canvas chiếm phần lớn chiều rộng và chiều cao còn lại.
- Click node thì mở `Drawer` bên phải.
- Tái sử dụng `WorkflowNodeInspectorComponent`, không viết lại form node.
- Không thay đổi workflow model, graph engine, API contract hoặc persistence nếu không bắt buộc.
- Giữ nguyên cơ chế global Save hiện tại.
- Không tạo thêm nút `Save node` trong phase này.
- Giữ đầy đủ translate, theme token và shared UI convention hiện tại.

---

## 2. Phạm vi code

### Phase 1 - Feature-local, bắt buộc

Ưu tiên chỉ sửa trong `workflow-studio`:

```text
src/app/features/workflow-studio/pages/workflow-builder-page.component.ts
src/app/features/workflow-studio/pages/workflow-builder-page.component.html
src/app/features/workflow-studio/pages/workflow-builder-page.component.css
src/app/features/workflow-studio/pages/workflow-builder-page.component.spec.ts
```

Có thể sửa thêm nếu cần cho focused validation issue:

```text
src/app/features/workflow-studio/inspector/workflow-node-inspector.component.ts
src/app/features/workflow-studio/inspector/workflow-node-inspector.component.html
```

### Phase 2 - Shared UI, làm sau khi Phase 1 ổn định

Chỉ sửa shared `FlowBuilder` khi cần collapsible palette:

```text
src/app/shared/ui/patterns/flow-builder/models/flow-template.model.ts
src/app/shared/ui/patterns/flow-builder/components/flow-builder/flow-builder.component.ts
src/app/shared/ui/patterns/flow-builder/components/flow-builder/flow-builder.component.html
src/app/shared/ui/patterns/flow-builder/components/flow-builder/flow-builder.component.css
src/app/shared/ui/patterns/flow-builder/components/flow-builder/flow-builder.component.spec.ts
```

Không được hard-code riêng CSS để ẩn palette từ `workflow-studio` nếu capability này nên là behavior dùng chung.

---

## 3. Phase 1 - Refactor layout Workflow Builder

### 3.1. Bỏ layout 3 cột hiện tại

Không render theo kiểu:

```text
Metadata | Canvas | Inspector
```

Thay bằng:

```text
Header
General Info
Workspace / Canvas
Problems
Drawer overlay
```

### 3.2. General Info đặt trên canvas

Phần thông tin workflow gồm tối thiểu:

- Name
- Description
- Max parallel
- Status / saved state nếu đang có

Desktop:

```text
Name | Description | Max parallel | Status
```

Tablet/mobile:

- Cho wrap xuống 2 hoặc 1 cột.
- Không dùng fixed width khiến canvas bị ép.

General Info là feature UI state, không tạo thêm store domain riêng.

Có thể thêm:

```ts
readonly generalInfoCollapsed = signal(false);

 toggleGeneralInfo(): void {
   this.generalInfoCollapsed.update(value => !value);
 }
```

Nếu collapsed, chỉ giữ summary bar nhỏ:

```text
Workflow name · Max parallel · Saved/Unsaved
```

### 3.3. Canvas là vùng chính

Workspace phải dùng phần chiều cao còn lại của viewport.

Nguyên tắc:

- Không dùng height cố định nhỏ.
- Không để metadata/inspector chiếm permanent horizontal space.
- `min-height: 0` đúng chỗ để flex child scroll/resize đúng.
- Canvas phải hoạt động tốt ở ít nhất:
  - 1600x900
  - 1366x768
  - 1024px width

Pseudo CSS:

```css
.workflow-builder-page {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.workflow-builder__workspace {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
}

.workflow-builder__canvas {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
}
```

Không copy literal style nếu project đang có token/layout utility tương đương.

---

## 4. Phase 1 - Node Inspector chuyển sang Drawer

### 4.1. Source of truth vẫn là WorkflowEditorStore

Không tạo state `selectedNode` riêng nếu chỉ duplicate `selectedNodeId`.

Dùng computed:

```ts
readonly selectedNode = computed(() => {
  const nodeId = this.store.selectedNodeId();
  if (!nodeId) return null;
  return this.store.nodes().find(node => node.id === nodeId) ?? null;
});

readonly nodeDrawerOpen = computed(() => !!this.selectedNode());
```

Close drawer phải clear selection:

```ts
closeNodeDrawer(): void {
  this.store.selectNode(null);
}
```

### 4.2. Dùng shared Drawer

Không tạo component drawer riêng cho workflow nếu shared UI đã có `app-drawer`.

Pseudo template:

```html
<app-drawer
  [open]="nodeDrawerOpen()"
  position="right"
  size="md"
  [title]="selectedNodeTitle()"
  [subtitle]="selectedNode()?.id ?? ''"
  (closed)="closeNodeDrawer()"
>
  <app-workflow-node-inspector />
</app-drawer>
```

Nếu shared drawer API thực tế khác, bám đúng API hiện có. Không tự tạo props mới chỉ để match pseudo code.

### 4.3. Interaction rule

Bắt buộc:

1. Click node A -> select node A -> Drawer mở.
2. Drawer đang mở, click node B -> Drawer không flicker close/open; content chuyển sang node B.
3. Click blank canvas -> clear selection -> Drawer đóng.
4. Delete selected node -> Store clear selection -> Drawer tự đóng.
5. Escape -> đóng drawer theo shared Drawer behavior nhưng không phá shortcut hiện có.
6. Readonly mode -> Drawer vẫn xem được node nhưng form không được mutate.

---

## 5. Không thêm `Save node`

Inspector hiện tại chỉnh trực tiếp vào `WorkflowEditorStore` và đánh dấu workflow dirty.

Vì vậy Phase 1 giữ semantics:

```text
Edit node field
  -> updateNodePatch(...)
  -> workflow dirty
  -> global Save
  -> persistence.save(...)
```

Không thêm:

```text
Save node
Cancel node
Local node draft
```

Nếu thêm các behavior trên sẽ phải thiết kế thêm local draft state, rollback, validation boundary và conflict với global undo/redo. Đây không nằm trong scope hiện tại.

---

## 6. Validation issue -> mở đúng node

`WorkflowProblemsPanel` đã select validation issue qua store.

Behavior đích:

```text
Click validation issue
  -> selectValidationIssue(issue)
  -> nếu issue.nodeId tồn tại
  -> selectedNodeId = issue.nodeId
  -> Drawer tự mở
  -> Inspector hiển thị đúng node
```

Nếu `focusedValidationIssue.field` có giá trị thì ưu tiên focus/scroll tới đúng field hoặc đúng section trong inspector.

Không tạo event bus mới nếu store hiện tại đã đủ.

---

## 7. Problems panel

Phase 1 không cần rewrite `WorkflowProblemsPanelComponent`.

Phase 2 có thể chỉnh UX:

- Không có issue -> chỉ hiện một compact bar.
- Có issue -> hiện count + expand/collapse.
- Không để vùng `Không có vấn đề` chiếm chiều cao đáng kể.

Behavior selection issue hiện tại phải giữ nguyên.

---

## 8. Phase 2 - Collapsible Node Palette

Sau khi layout mới chạy ổn định, nếu canvas vẫn thiếu chỗ thì thêm capability vào shared `FlowBuilder`.

Mục tiêu API backward-compatible, ví dụ:

```ts
export interface FlowPaletteConfig {
  visible?: boolean;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}
```

Default phải giữ behavior cũ:

```ts
collapsible = false
defaultCollapsed = false
```

Shared component quản lý local UI state:

```ts
readonly paletteOpen = signal(true);
```

Không persist vào workflow domain model.

Không làm breaking change cho các consumer khác của `FlowBuilderModule`.

---

## 9. Translate rules

Mọi text mới phải đi qua hệ thống translate hiện tại.

Không hard-code label user-facing như:

```text
General information
Collapse
Expand
Node settings
Close
```

Nếu thiếu key thì bổ sung đúng namespace `workflowStudio.*` hoặc namespace shared UI phù hợp.

Không tạo hai key khác nhau cho cùng một ý nghĩa nếu project đã có key dùng chung.

---

## 10. Theme rules

Không hard-code màu hex/rgb cho workflow-specific UI nếu design token đã tồn tại.

Ưu tiên:

```css
var(--app-surface)
var(--app-card-surface)
var(--app-border)
var(--app-border-soft)
var(--app-text)
var(--app-text-muted)
var(--app-primary)
```

Light/dark mode phải tự hoạt động qua token.

Không dùng selector PrimeNG nội bộ nếu shared component đã expose wrapper/token hợp lệ.

---

## 11. Clean code rules

### Component page

Page component chỉ orchestration:

- route/load
- save/publish/run
- selection orchestration
- drawer/open state derived from store
- view command

Không nhét business graph rule hoặc node validation logic mới vào page.

### Store

Chỉ sửa store nếu thật sự cần cho state domain/editor.

Không đưa các state thuần UI sau vào store:

```text
generalInfoCollapsed
nodeDrawerAnimation
paletteHover
```

### Shared UI

Không để `WorkflowStudio` biết implementation detail của JointJS/PrimeNG drawer nếu shared component đã abstract.

### Duplication

Không duplicate node-type switch ở page nếu `WorkflowNodeInspectorComponent` đã chịu trách nhiệm chọn:

```text
START
CODE_GATE
AI_GATE
LOGIC
END
```

---

## 12. Test plan

### 12.1. WorkflowBuilderPageComponent tests - bắt buộc

Bổ sung test cho các case:

```ts
it('opens node drawer when a node is selected');
it('closes node drawer and clears selection');
it('switches drawer content when another node is selected');
it('closes drawer when selected node is deleted');
it('opens the correct node from a validation issue');
it('keeps readonly node inspector non-mutating');
it('keeps global save behavior after editing a node in drawer');
it('keeps undo redo delete fit-view and escape shortcuts working');
```

### 12.2. Regression bắt buộc giữ

Không được làm hỏng các test hiện có về:

- create route
- edit route
- first save -> navigate to edit URL
- dirty route guard
- readonly published version
- Ctrl/Cmd + S
- Delete
- Undo / Redo
- Fit View
- Escape
- input focus shortcut guard
- auto layout
- zoom in/out/reset

### 12.3. Shared FlowBuilder tests - Phase 2

Nếu thêm collapsible palette:

```ts
it('keeps palette visible by default for existing consumers');
it('allows palette collapse only when configured');
it('restores configured default collapsed state');
it('does not mutate flow definition when palette is toggled');
```

---

## 13. Manual acceptance checklist

### Desktop 1600x900

- [ ] General Info nằm trên canvas.
- [ ] Không còn inspector cố định bên phải.
- [ ] Canvas rộng rõ rệt so với hiện tại.
- [ ] Click AI Gate mở drawer đúng inspector.
- [ ] Click Code Gate chuyển drawer sang đúng inspector.
- [ ] Close drawer clear selection.
- [ ] Click blank canvas đóng drawer.
- [ ] Save workflow vẫn dùng global Save.
- [ ] Undo/Redo vẫn hoạt động sau khi chỉnh node.
- [ ] Validation issue mở đúng node.
- [ ] Light theme hiển thị đúng.
- [ ] Dark theme hiển thị đúng.

### 1366x768

- [ ] General Info không làm canvas mất quá nhiều chiều cao.
- [ ] Drawer không che toàn bộ canvas.
- [ ] Toolbar không wrap lỗi.
- [ ] Problems panel không chiếm diện tích thừa khi empty.

### 1024px

- [ ] General Info wrap hợp lý.
- [ ] Canvas còn sử dụng được.
- [ ] Drawer responsive.
- [ ] Không horizontal overflow ngoài ý muốn.

---

## 14. Thứ tự thực hiện đề xuất

### PR/commit 1 - Layout + Drawer

1. Refactor page HTML.
2. Refactor page CSS.
3. Thêm selectedNode/nodeDrawerOpen computed.
4. Dùng shared Drawer.
5. Clear selection khi close.
6. Chạy/update unit test.
7. Kiểm tra desktop + tablet.

### PR/commit 2 - UX polish

1. General Info collapse.
2. Compact Problems bar.
3. Validation focus đúng field/section.
4. Test regression.

### PR/commit 3 - Shared palette capability

Chỉ làm nếu sau 2 bước trên vẫn cần thêm diện tích canvas.

1. Extend `FlowPaletteConfig` backward-compatible.
2. Implement palette local UI state.
3. Add toggle UI.
4. Add shared tests.
5. Verify Storybook/consumer regression.

---

## 15. Definition of Done

Chỉ coi task hoàn thành khi:

- Workflow Builder không còn layout 3 cột cố định.
- Canvas là vùng chính của màn hình.
- Inspector node chạy trong right Drawer.
- Existing node inspector được tái sử dụng.
- Selection/validation/delete/readonly hoạt động đúng.
- Global Save semantics không đổi.
- Không breaking shared UI contract.
- Không hard-code text mới ngoài translate system.
- Không hard-code theme color khi token đã tồn tại.
- Unit test cũ pass.
- Unit test mới cho drawer pass.
- Manual responsive/light/dark acceptance pass.

## 16. Không nằm trong scope

Không tự ý làm trong task này:

- Thay workflow API contract.
- Thay workflow persistence format.
- Thay graph engine.
- Rewrite toàn bộ node inspectors.
- Tạo local Save/Cancel cho từng node.
- Thay undo/redo architecture.
- Tạo Flow Builder v2 chạy song song.
- Refactor unrelated shared components.
