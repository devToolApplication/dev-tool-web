# FULL SYSTEM REQUIREMENTS + STRICT DONE CHECKLIST

> File này là checklist nghiệm thu duy nhất cho Codex khi triển khai Shared UI / System UI migration.
> Mục tiêu: liệt kê cực chi tiết toàn bộ chức năng hệ thống cần có, cái nào làm xong thì tick vào, và chỉ khi toàn bộ yêu cầu + test pass thì hệ thống mới được coi là **DONE**.

---

## 0. Luật sử dụng file này

### 0.1. Quy tắc tick checkbox

- [ ] Chỉ tick `[x]` khi yêu cầu đã được implement thật trong code hoặc đã được xác nhận không áp dụng bằng ghi chú `N/A: <lý do cụ thể>`.
- [ ] Không được tick nếu mới chỉ viết plan.
- [ ] Không được tick nếu mới chỉ sửa UI nhưng chưa có test phù hợp.
- [ ] Không được tick nếu test chưa chạy.
- [ ] Không được tick nếu test fail.
- [ ] Không được tick nếu chỉ manual check mà đáng ra phải có unit/integration test.
- [ ] Không được tick nếu code có TODO/FIXME liên quan đến requirement đó.
- [ ] Không được tick nếu implementation đang hard-code theo một feature cụ thể trong shared/common.
- [ ] Không được tick nếu requirement bị làm lệch sang scope khác mà chưa ghi chú rõ.
- [ ] Nếu một requirement không áp dụng, phải ghi ngay dưới dòng đó: `N/A reason: ...`.
- [ ] Nếu một requirement bị block, phải ghi ngay dưới dòng đó: `BLOCKED reason: ...`, kèm command/log chứng minh.

### 0.2. Quy tắc kết thúc phiên Codex

- [ ] Codex không được báo `done`, `complete`, `finished`, `xong`, `đã hoàn tất` nếu còn bất kỳ checkbox bắt buộc nào chưa tick hoặc chưa có ghi chú N/A/BLOCKED hợp lệ.
- [ ] Codex phải cập nhật file này trong quá trình làm việc, không được chỉ cập nhật ở cuối bằng mô tả chung chung.
- [ ] Codex phải tạo/cập nhật test executable thật, không được chỉ ghi test case bằng Markdown.
- [ ] Codex phải chạy targeted test cho phần đã sửa.
- [ ] Codex phải chạy full relevant test suite nếu project có script.
- [ ] Codex phải chạy lint nếu project có script.
- [ ] Codex phải chạy typecheck nếu project có script.
- [ ] Codex phải chạy build nếu project có script.
- [ ] Codex phải tự sửa lỗi test/lint/type/build rồi chạy lại, không được dừng ở lần fail đầu tiên.
- [ ] Codex chỉ được kết thúc `BLOCKED` nếu blocker ngoài khả năng sửa trong repo: thiếu secret, service ngoài không chạy, dependency không cài được, permission/sandbox không cho phép.
- [ ] Nếu kết thúc `BLOCKED`, Codex phải ghi rõ command đã chạy, output lỗi, phần nào chưa verify, và bước tiếp theo cụ thể.

### 0.3. Definition of Done tổng

Hệ thống chỉ được coi là **DONE** khi tất cả điều kiện sau đều đạt:

- [ ] Tất cả requirement trong file này đã được tick hoặc có N/A/BLOCKED hợp lệ.
- [ ] Tất cả component shared UI bắt buộc đã có implementation đúng tầng.
- [ ] Tất cả feature page đã migrate theo checklist hoặc có ghi chú N/A rõ.
- [ ] Không còn `window.confirm` trong flow đã migrate.
- [ ] Không còn raw JSON dài hiển thị mặc định ở màn người dùng thường.
- [ ] Không còn shared/common import feature/domain-specific model/service/module.
- [ ] Không còn hard-code màu trong component TS.
- [ ] Không có `.only`, `.skip`, `fit`, `fdescribe`, test rỗng, hoặc `expect(true).toBe(true)` trong test mới/sửa.
- [ ] Targeted tests pass.
- [ ] Full relevant tests pass.
- [ ] Lint pass hoặc không có script lint và đã ghi rõ.
- [ ] Typecheck pass hoặc không có script typecheck và đã ghi rõ.
- [ ] Build pass hoặc không có script build và đã ghi rõ.
- [ ] Codex đã review diff cuối cùng và xác nhận không có unrelated change.
- [ ] Codex đã điền Test Traceability Matrix đầy đủ.
- [ ] Codex đã điền Final Completion Report ở cuối file.

---

## 1. Session Kickoff Checklist

Codex phải làm các bước này trước khi sửa code lớn.

### 1.1. Đọc context và xác định phạm vi

- [ ] Đọc file này trước khi sửa code.
- [ ] Xác định framework chính của project.
- [ ] Xác định package manager: npm/yarn/pnpm/bun.
- [ ] Xác định test framework: Jest/Vitest/Karma/Jasmine/Playwright/Cypress/khác.
- [ ] Xác định script build hiện có trong package config.
- [ ] Xác định script lint hiện có trong package config.
- [ ] Xác định script test hiện có trong package config.
- [ ] Xác định script typecheck hiện có trong package config.
- [ ] Xác định convention đặt test file của repo.
- [ ] Xác định convention đặt component file của repo.
- [ ] Xác định routing/module/standalone pattern nếu project là Angular.
- [ ] Xác định các shared folder hiện có.
- [ ] Xác định các feature pages hiện có.
- [ ] Xác định các component đang bị đặt sai tầng.
- [ ] Xác định các flow nguy hiểm đang dùng `window.confirm`.
- [ ] Xác định các màn đang show raw JSON mặc định.
- [ ] Xác định các table/form/tree cần migrate.
- [ ] Ghi lại file code dự kiến thay đổi vào matrix.
- [ ] Ghi lại file test dự kiến tạo/sửa vào matrix.

### 1.2. Audit trước khi implement

- [ ] Tìm toàn bộ import từ `shared/component`.
- [ ] Tìm toàn bộ import từ `shared/ui`.
- [ ] Tìm import ngược chiều giữa shared/component và shared/ui.
- [ ] Tìm shared/common import feature module/model/service/type.
- [ ] Tìm component common chứa trade-specific/job-specific/account-specific logic.
- [ ] Tìm `window.confirm`.
- [ ] Tìm hard-code màu trong component TS.
- [ ] Tìm JSON preview/raw JSON đang hiển thị mặc định.
- [ ] Tìm table không có loading state.
- [ ] Tìm table không có empty state.
- [ ] Tìm table không có error state.
- [ ] Tìm form không có validation summary.
- [ ] Tìm form không chống double submit.
- [ ] Tìm form không có dirty guard nếu có edit flow.
- [ ] Tìm tree field tự validate riêng ngoài form engine.
- [ ] Tìm action nguy hiểm thiếu confirm.
- [ ] Tìm drawer/dialog thiếu focus handling.
- [ ] Tìm icon-only button thiếu aria-label/tooltip.
- [ ] Tìm field dùng placeholder thay label.

### 1.3. Kế hoạch nhỏ nhưng không dừng ở plan

- [ ] Chia việc thành các nhóm nhỏ có thể test được.
- [ ] Ưu tiên làm component nền P0 trước.
- [ ] Ưu tiên test component nền ngay sau khi tạo/sửa.
- [ ] Sau khi component nền pass test, mới migrate feature page.
- [ ] Không được dừng sau khi viết plan nếu không bị blocker ngoài repo.
- [ ] Không được kết thúc phiên khi mới hoàn thành một phần nhưng chưa ghi rõ phần chưa làm.

---

## 2. Architecture Requirements

### 2.1. Ranh giới tầng shared/component

`shared/component` chỉ chứa primitive/wrapper nhỏ, không chứa workflow lớn.

- [ ] `shared/component` chỉ chứa primitive UI nhỏ.
- [ ] `shared/component` không chứa page layout lớn.
- [ ] `shared/component` không chứa workflow nghiệp vụ.
- [ ] `shared/component` không import từ `shared/ui`.
- [ ] `shared/component` không import feature module.
- [ ] `shared/component` không import feature model.
- [ ] `shared/component` không gọi API.
- [ ] `shared/component` không chứa business rule.
- [ ] `shared/component` không chứa trade-specific enum/status/type.
- [ ] `shared/component` không chứa copy text nghiệp vụ cụ thể.
- [ ] Primitive wrapper có API đơn giản, generic, reusable.
- [ ] Primitive wrapper có disabled/readonly/error state nếu là input/action.
- [ ] Primitive wrapper có aria-label/label contract nếu tương tác được.
- [ ] Primitive wrapper có test render cơ bản.
- [ ] Primitive wrapper có test interaction nếu có click/input/output.

### 2.2. Ranh giới tầng shared/ui

`shared/ui` chứa reusable UI pattern/common UX block.

- [ ] `shared/ui` chứa feedback pattern: empty/error/loading/alert.
- [ ] `shared/ui` chứa overlay pattern: confirm/dialog/drawer.
- [ ] `shared/ui` chứa layout pattern: page shell/header/section/filter/action toolbar.
- [ ] `shared/ui` chứa data-display pattern: badge/copy/json/key-value/diff/timeline.
- [ ] `shared/ui` chứa table pattern generic.
- [ ] `shared/ui` chứa form pattern generic.
- [ ] `shared/ui` chứa tree field pattern generic trong form.
- [ ] `shared/ui` không import feature module.
- [ ] `shared/ui` không import feature model.
- [ ] `shared/ui` không import feature service.
- [ ] `shared/ui` không biết trade/rule/strategy/backtest/paper-trade/cache/log nghiệp vụ.
- [ ] `shared/ui` không tự gọi API feature.
- [ ] `shared/ui` chỉ emit event để page/service xử lý nghiệp vụ.
- [ ] `shared/ui` nhận mapping/formatter/badgeMap từ feature.
- [ ] `shared/ui` không chứa domain column type như `pnl`, `side`, `trade-status`.
- [ ] `shared/ui` không chứa domain validator cụ thể.
- [ ] `shared/ui` có public API rõ ràng.
- [ ] `shared/ui` có tests cho behavior public.

### 2.3. Ranh giới feature/shared/ui

Component có nghiệp vụ riêng phải nằm trong feature module.

- [ ] Feature-specific UI nằm trong feature/shared/ui hoặc folder feature tương ứng.
- [ ] Feature-specific UI được phép map domain DTO sang common UI model.
- [ ] Feature-specific UI được phép định nghĩa badgeMap theo domain.
- [ ] Feature-specific UI được phép đăng ký custom validator domain.
- [ ] Feature-specific UI không đẩy domain logic xuống shared/common.
- [ ] Feature page gọi service/API, shared UI chỉ render/emit.
- [ ] Feature page giữ orchestration nghiệp vụ.
- [ ] Feature page dùng ConfirmDialog cho action nguy hiểm.
- [ ] Feature page dùng Drawer/JsonViewer cho detail/raw/debug data.
- [ ] Feature page có regression test/manual flow tương ứng.

### 2.4. Dependency direction

Chiều phụ thuộc đúng:

```text
shared/component -> shared/ui -> feature/shared/ui -> feature/pages
```

- [ ] `shared/component -> shared/ui` không xảy ra.
- [ ] `shared/ui -> feature` không xảy ra.
- [ ] `shared/ui -> domain model` không xảy ra.
- [ ] `shared/ui -> feature service` không xảy ra.
- [ ] `feature/shared/ui -> shared/ui` được phép.
- [ ] `feature/pages -> feature/shared/ui` được phép.
- [ ] `feature/pages -> shared/ui` được phép.
- [ ] Không có circular dependency mới.
- [ ] Barrel export không gây import cycle.
- [ ] Test hoặc static check đã xác nhận dependency direction.

### 2.5. Cấu trúc thư mục mục tiêu

- [ ] Có `shared/ui/feedback` cho EmptyState/ErrorState/LoadingSkeleton/Alert.
- [ ] Có `shared/ui/overlay` cho ConfirmDialog/Drawer/DialogShell nếu cần.
- [ ] Có `shared/ui/layout` cho PageShell/PageHeader/SectionPanel/FilterPanel/ActionToolbar.
- [ ] Có `shared/ui/data-display` cho Badge/CopyableText/KeyValueList/JsonViewer/DiffViewer/Timeline.
- [ ] Có `shared/ui/table` cho DataTable và types/helpers liên quan.
- [ ] Có `shared/ui/forms` cho FormInput/ConfigTemplateForm/ValidationSummary/Tree field.
- [ ] Có `shared/component` chỉ cho primitives nhỏ.
- [ ] Có index/barrel export nếu repo đang dùng convention này.
- [ ] Không duplicate component cùng mục đích ở nhiều nơi.
- [ ] Deprecated component cũ có migration hoặc wrapper tạm rõ ràng.
- [ ] File naming nhất quán với repo.
- [ ] Selector/class naming nhất quán với repo.
- [ ] Test file đặt cạnh component hoặc theo convention hiện có.

### 2.6. Design token/style

- [ ] Có token chung cho color semantic: default/info/success/warning/danger/muted.
- [ ] Có token cho text color chính/phụ/muted/error/warning/success.
- [ ] Có token cho border color.
- [ ] Có token cho background surface/card/page/overlay.
- [ ] Có token cho spacing.
- [ ] Có token cho radius.
- [ ] Có token cho shadow/elevation.
- [ ] Có token cho focus ring.
- [ ] Component TS không hard-code màu hex.
- [ ] Component TS không hard-code style nghiệp vụ.
- [ ] Variant dùng semantic token, không dùng domain name.
- [ ] Contrast đủ đọc cho badge/alert/button/danger state.
- [ ] Dark mode không bị phá nếu project hỗ trợ.
- [ ] Responsive breakpoint dùng token/convention hiện có.
- [ ] Test/snapshot/visual/manual check đã cover variant chính.

---

## 3. Shared UI Feedback Requirements

### 3.1. EmptyStateComponent

#### Implementation

- [x] Có component EmptyState ở đúng folder shared/ui/feedback.
- [x] Có title bắt buộc hoặc fallback rõ ràng.
- [x] Có description optional.
- [x] Có icon optional.
- [x] Có primary action optional.
- [x] Có secondary action optional.
- [x] Có slot/content projection nếu framework hỗ trợ.
- [x] Dùng được trong page.
- [x] Dùng được trong card.
- [x] Dùng được trong table.
- [x] Dùng được trong drawer.
- [x] Không chứa copy nghiệp vụ hard-code.
- [x] Không tự gọi API.
- [x] Action chỉ emit event hoặc nhận callback theo convention.
- [x] Có alignment/size variant nếu cần.
- [x] Có aria semantics hợp lý.
- [x] Empty state phân biệt được no data và no filter result qua input từ page.

#### UX

- [x] Empty title dễ hiểu.
- [x] Empty description gợi ý bước tiếp theo.
- [x] Primary action nổi bật nếu có hành động tiếp theo.
- [x] Secondary action không lấn primary.
- [x] Không để vùng trắng khi không có data.
- [x] Mobile không vỡ layout.
- [x] Text dài không tràn.

#### Tests

- [x] Test render title.
- [x] Test render description.
- [x] Test không render action khi không truyền action.
- [x] Test render primary action khi truyền action.
- [x] Test click primary action emit đúng.
- [x] Test render secondary action khi truyền action.
- [x] Test dùng được với projected content/slot nếu có.
- [x] Test empty input/null không crash.
- [x] Test accessibility label/role cơ bản nếu áp dụng.

### 3.2. ErrorStateComponent

#### Implementation

- [x] Có component ErrorState ở đúng folder shared/ui/feedback.
- [x] Có title lỗi dễ hiểu.
- [x] Có message chi tiết.
- [x] Có retry action optional.
- [x] Có copy error detail optional nếu phù hợp.
- [x] Có error code/request id optional nếu phù hợp.
- [x] Có variant/info severity nếu dùng cho warning/error.
- [x] Không chỉ dựa vào toast.
- [x] Không expose stack trace mặc định cho người dùng thường.
- [x] Có safe fallback khi error object null/undefined/string/object.
- [x] Không tự gọi API retry; chỉ emit retry.
- [x] Dùng được trong page/table/card/drawer/form alert.

#### UX

- [x] Message nói rõ điều gì sai.
- [x] Retry button rõ ràng.
- [x] Copy detail không làm rối UI chính.
- [x] Error state không làm mất filter/input hiện tại.
- [x] Error state có spacing nhất quán.
- [x] Mobile không vỡ layout.

#### Tests

- [x] Test render title/message.
- [x] Test retry action emit đúng.
- [x] Test không crash với string error.
- [x] Test không crash với object error.
- [x] Test copy detail nếu có.
- [x] Test không expose raw stack mặc định nếu có stack.
- [x] Test accessibility cơ bản.

### 3.3. LoadingSkeletonComponent

#### Implementation

- [x] Có component LoadingSkeleton ở đúng folder shared/ui/feedback.
- [x] Có variant card.
- [x] Có variant table.
- [x] Có variant form.
- [x] Có variant detail.
- [x] Có số row/line configurable.
- [x] Không hard-code kích thước quá cụ thể khiến khó tái dùng.
- [x] Có aria-busy hoặc loading semantics nếu áp dụng.
- [x] Có thể dùng khi initial load.
- [x] Có thể dùng khi refresh nhẹ.
- [x] Không làm layout shift quá mạnh.

#### UX

- [x] Loading không để màn trắng.
- [x] Skeleton gần giống layout thực tế.
- [x] Refresh không làm mất data cũ nếu page chọn giữ data.
- [x] Animation không quá nặng.
- [x] Mobile không vỡ layout.

#### Tests

- [x] Test render variant card.
- [x] Test render variant table.
- [x] Test render variant form.
- [x] Test render số row/line theo input.
- [x] Test input không hợp lệ có fallback.
- [x] Test aria/loading semantics nếu áp dụng.

### 3.4. AlertComponent

#### Implementation

- [x] Có AlertComponent nếu project chưa có alert generic phù hợp.
- [x] Hỗ trợ variant info/success/warning/danger.
- [x] Có title optional.
- [x] Có message/content.
- [x] Có close/dismiss optional.
- [x] Có action optional.
- [x] Không dùng màu làm tín hiệu duy nhất.
- [x] Dùng token semantic.
- [x] Không chứa business copy.

#### Tests

- [x] Test render từng variant.
- [x] Test dismiss emit đúng nếu có.
- [x] Test action emit đúng nếu có.
- [x] Test title optional.
- [x] Test accessibility role nếu dùng alert/status.

Evidence: Feedback implementation verified in src/app/shared/ui/feedback/{empty-state,error-state,loading-skeleton,alert}; stories covered by src/app/shared/ui/shared-ui-foundation.stories.ts::FeedbackStates; targeted command PASS: npm.cmd test -- --include=src/app/shared/ui/feedback/empty-state/empty-state.component.spec.ts --include=src/app/shared/ui/feedback/error-state/error-state.component.spec.ts --include=src/app/shared/ui/feedback/loading-skeleton/loading-skeleton.component.spec.ts --include=src/app/shared/ui/feedback/alert/alert.component.spec.ts --watch=false --reporters=default (4 files, 17 tests).

---

## 4. Shared UI Overlay Requirements

### 4.1. ConfirmDialogService / ConfirmDialogComponent

#### Implementation

- [x] Có ConfirmDialogService hoặc pattern tương đương ở shared/ui/overlay.
- [x] Có title.
- [x] Có message mô tả hậu quả.
- [x] Có confirmText configurable.
- [x] Có cancelText configurable.
- [x] Có variant info/warning/danger.
- [x] Có loading state khi confirm đang xử lý.
- [x] Có error state nếu action fail trong dialog flow.
- [x] Có config closeOnBackdrop.
- [x] Có config closeOnEsc.
- [x] Có focus trap.
- [x] Focus ban đầu vào cancel hoặc dialog theo UX an toàn với danger action.
- [x] Focus trả về trigger sau khi đóng nếu framework hỗ trợ.
- [x] Không dùng `window.confirm` ở các flow đã migrate.
- [x] Confirm trả result rõ: confirmed/cancelled/dismissed.
- [x] Confirm action nguy hiểm không chạy khi user cancel.
- [x] Service/component không biết nghiệp vụ cụ thể.
- [x] Confirm dialog có thể dùng cho delete/reset/cancel/evict/stop.

#### UX

- [x] Danger action có style danger rõ.
- [x] Message nói rõ hậu quả, không generic kiểu `Are you sure?` đơn độc.
- [x] Cancel dễ nhìn.
- [x] Dialog không đóng ngoài ý muốn khi loading.
- [x] ESC/backdrop behavior nhất quán.
- [x] Keyboard navigation hoạt động.
- [x] Mobile không tràn màn.

#### Tests

- [x] Test mở dialog với title/message.
- [x] Test confirm trả confirmed.
- [x] Test cancel trả cancelled.
- [x] Test ESC/backdrop theo config.
- [x] Test danger variant render đúng.
- [x] Test loading disable buttons đúng.
- [x] Test error state nếu confirm action fail.
- [x] Test focus/keyboard cơ bản nếu test environment hỗ trợ.
- [x] Test đã thay ít nhất một flow `window.confirm` bằng ConfirmDialog trong feature migration.

### 4.2. DrawerComponent

#### Implementation

- [x] Có DrawerComponent ở shared/ui/overlay.
- [x] Có header slot/config.
- [x] Có title.
- [x] Có subtitle optional.
- [x] Có body slot.
- [x] Có footer action slot.
- [x] Có loading state.
- [x] Có error state.
- [x] Có empty state nếu dùng cho detail không data.
- [x] Có size sm/md/lg/xl/full.
- [x] Có side left/right nếu cần.
- [x] Có close button.
- [x] Có config closeOnBackdrop.
- [x] Có config closeOnEsc.
- [x] Có focus trap.
- [x] Có scroll body riêng, header/footer cố định nếu phù hợp.
- [x] Dùng được cho detail preview.
- [x] Dùng được cho raw JSON.
- [x] Dùng được cho log/payload/detail.
- [x] Không tự gọi API.
- [x] Không chứa domain logic.

#### UX

- [x] Drawer không làm mất context list phía sau.
- [x] Drawer detail có title rõ.
- [x] Drawer loading không để body trắng.
- [x] Drawer error có retry hoặc action phù hợp.
- [x] Footer action không che nội dung.
- [x] Mobile có full-screen behavior nếu cần.
- [x] Backdrop/ESC không gây mất unsaved data nếu có form dirty.

#### Tests

- [x] Test open/close drawer.
- [x] Test render title/body/footer.
- [x] Test size variant.
- [x] Test loading state.
- [x] Test error state.
- [x] Test closeOnEsc/closeOnBackdrop theo config.
- [x] Test action slot/projection nếu có.
- [x] Test accessibility focus/aria cơ bản nếu áp dụng.

Evidence: Overlay implementation verified in src/app/shared/ui/overlay/{confirm-dialog,drawer}; targeted command PASS: npm.cmd test -- --include=src/app/shared/ui/overlay/confirm-dialog/confirm-dialog-host.component.spec.ts --include=src/app/shared/ui/overlay/drawer/drawer.component.spec.ts --watch=false --reporters=default (2 files, 14 tests); Storybook build PASS: npm.cmd run build-storybook -- --output-dir .tmp/storybook-overlay-check.

---

## 5. Shared UI Layout Requirements

### 5.1. PageShellComponent

#### Implementation

- [x] Có PageShell ở shared/ui/layout.
- [x] Có breadcrumb slot/config.
- [x] Có title.
- [x] Có subtitle optional.
- [x] Có status badge generic optional.
- [x] Có action area.
- [x] Có summary slot.
- [x] Có filter/toolbar slot.
- [x] Có content slot.
- [x] Có loading state cấp page.
- [x] Có error state cấp page.
- [x] Có empty state cấp page nếu phù hợp.
- [x] Có responsive layout.
- [x] Không chứa feature-specific copy.
- [x] Không tự gọi API.
- [x] Không import feature.

#### UX

- [x] Header page nhất quán giữa các feature.
- [x] Breadcrumb không làm vỡ title.
- [x] Actions align rõ.
- [x] Summary không chen vào content chính trên mobile.
- [x] Filter/toolbar có spacing rõ.
- [x] Loading/error không trắng màn.

#### Tests

- [x] Test render title/subtitle.
- [x] Test render breadcrumb nếu truyền.
- [x] Test render actions slot.
- [x] Test render summary slot.
- [x] Test loading state.
- [x] Test error state.
- [x] Test content projection.

### 5.2. PageHeaderComponent

- [x] Có PageHeader ở shared/ui/layout.
- [x] Title hiển thị rõ.
- [x] Subtitle optional.
- [x] Breadcrumb optional.
- [x] Status optional.
- [x] Actions align phải.
- [x] Title dài không vỡ layout.
- [x] Có responsive behavior.
- [x] Có test render title/subtitle/actions/status.
- [x] Có test title dài hoặc fallback class nếu áp dụng.

### 5.3. SectionPanelComponent

- [x] Có SectionPanel ở shared/ui/layout.
- [x] Có title.
- [x] Có description optional.
- [x] Có header action optional.
- [x] Có collapsible option.
- [x] Có collapsed default option.
- [x] Có error indicator khi section chứa lỗi.
- [x] Có content slot.
- [x] Có footer slot optional.
- [x] Dùng được trong form dài.
- [x] Dùng được trong detail page.
- [x] Có test render title/content.
- [x] Có test collapse/expand.
- [x] Có test error indicator.

### 5.4. FilterPanelComponent

#### Implementation

- [x] Có FilterPanel ở shared/ui/layout.
- [x] Hỗ trợ simple filters.
- [x] Hỗ trợ advanced filters collapsed.
- [x] Có Apply action.
- [x] Có Reset action.
- [x] Có Clear all action nếu nhiều filter.
- [x] Hiển thị active filter count.
- [x] Hỗ trợ text filter.
- [x] Hỗ trợ select filter.
- [x] Hỗ trợ multi-select filter.
- [x] Hỗ trợ date-range filter.
- [x] Hỗ trợ number-range filter.
- [x] Hỗ trợ boolean filter.
- [x] Hỗ trợ autocomplete filter nếu cần.
- [x] Option async có loading state.
- [x] Option async có error retry.
- [x] Không tự gọi API nếu table/page quản lý query.
- [x] Emit filter changes rõ ràng.
- [x] Có debounce cho search/autocomplete nếu áp dụng.

#### Tests

- [x] Test render simple filter.
- [x] Test render advanced collapsed.
- [x] Test apply emit đúng payload.
- [x] Test reset clear đúng payload.
- [x] Test active filter count.
- [x] Test option loading/empty/error nếu có.
- [x] Test debounce search nếu có.

### 5.5. ActionToolbarComponent

- [x] Có ActionToolbar ở shared/ui/layout.
- [x] Primary action rõ.
- [x] Secondary actions rõ.
- [x] More actions menu.
- [x] Danger action tách riêng hoặc variant rõ.
- [x] Loading/disabled per action.
- [x] Tooltip/disabled reason cho action disabled.
- [x] Icon-only action có aria-label.
- [x] More menu keyboard accessible nếu có.
- [x] Toolbar responsive/wrap không vỡ.
- [x] Toolbar không chứa business logic.
- [x] Có test primary action click.
- [x] Có test disabled action không emit.
- [x] Có test more action click.
- [x] Có test danger variant/confirm integration nếu áp dụng.

Evidence: Layout implementation verified in src/app/shared/ui/layout/{page-shell,page-header,section-panel,filter-panel,action-toolbar}; targeted command PASS: npm.cmd test -- --include=src/app/shared/ui/layout/page-shell/page-shell.component.spec.ts --include=src/app/shared/ui/layout/page-header/page-header.component.spec.ts --include=src/app/shared/ui/layout/section-panel/section-panel.component.spec.ts --include=src/app/shared/ui/layout/filter-panel/filter-panel.component.spec.ts --include=src/app/shared/ui/layout/action-toolbar/action-toolbar.component.spec.ts --watch=false --reporters=default (5 files, 17 tests).

---

## 6. Shared UI Data Display Requirements

### 6.1. BadgeComponent

- [x] Có Badge ở shared/ui/data-display.
- [x] Hỗ trợ variant default/info/success/warning/danger/muted.
- [x] Không map domain status trong badge common.
- [x] Nhận label từ ngoài.
- [x] Hỗ trợ size sm/md.
- [x] Hỗ trợ icon optional.
- [x] Contrast đủ đọc.
- [x] Badge không chỉ dựa vào màu, có text.
- [x] Dùng token semantic.
- [x] Có test render label.
- [x] Có test từng variant.
- [x] Có test icon optional.
- [x] Có test fallback variant.

### 6.2. CopyableTextComponent

- [x] Có CopyableText ở shared/ui/data-display.
- [x] Copy text được.
- [x] Có tooltip full value.
- [x] Có shorten/truncate mode cho ID dài.
- [x] Có copied state hoặc toast/event.
- [x] Keyboard accessible.
- [x] Không copy label thay vì value.
- [x] Xử lý null/undefined an toàn.
- [x] Có fallback nếu clipboard API unavailable.
- [x] Có test render text.
- [x] Có test shorten mode.
- [x] Có test copy đúng value.
- [x] Có test copied state/toast/event.
- [x] Có test null/undefined.

### 6.3. KeyValueListComponent

- [x] Có KeyValueList ở shared/ui/data-display.
- [x] Hiển thị label/value.
- [x] Hỗ trợ copyable value.
- [x] Hỗ trợ badge value.
- [x] Hỗ trợ date format generic.
- [x] Hỗ trợ currency format generic.
- [x] Hỗ trợ percent format generic.
- [x] Hỗ trợ boolean format generic.
- [x] Hỗ trợ empty/null fallback.
- [x] Hỗ trợ responsive 1-2 columns.
- [x] Không chứa domain formatter hard-code.
- [x] Có test render items.
- [x] Có test copyable item.
- [x] Có test badge item.
- [x] Có test null fallback.
- [x] Có test responsive class/config nếu áp dụng.

### 6.4. JsonViewerComponent

- [x] Có JsonViewer ở shared/ui/data-display.
- [x] Format JSON đẹp.
- [x] Có raw/formatted toggle nếu yêu cầu.
- [x] Có copy JSON.
- [x] Có collapse/expand nếu implement.
- [x] Có search key nếu implement.
- [x] Xử lý invalid JSON rõ.
- [x] Xử lý null/undefined rõ.
- [x] Không làm vỡ layout với JSON dài.
- [x] Không hiển thị secret nếu config mask secrets.
- [x] Có readonly mode.
- [x] Có editable mode nếu project cần.
  N/A reason: JsonViewer is intentionally readonly; editable JSON is handled by shared/ui/form-input/component/json-field-block for form flows.
- [x] Có apply edited JSON nếu editable.
  N/A reason: JsonViewer does not own editable submit/apply; form JSON apply is handled by json-field-block/config form flow.
- [x] Có test valid JSON render.
- [x] Có test invalid JSON state.
- [x] Có test copy JSON.
- [x] Có test raw/formatted toggle nếu có.
- [x] Có test null/undefined.
- [x] Có test mask secret nếu có.

### 6.5. DiffViewerComponent

- [x] Có DiffViewer ở shared/ui/data-display nếu cần history/audit.
- [x] So sánh before/after.
- [x] Highlight added/removed/changed.
- [x] Dùng được cho config history/audit.
- [x] Có raw JSON fallback.
- [x] Không chứa domain logic.
- [x] Có test render added/removed/changed.
- [x] Có test empty diff.
- [x] Có test invalid input fallback.

### 6.6. TimelineComponent

- [x] Có Timeline ở shared/ui/data-display nếu có event/history/log timeline.
- [x] Generic event model.
- [x] Có icon/status variant.
- [x] Có timestamp.
- [x] Có title.
- [x] Có description optional.
- [x] Có action optional.
- [x] Timestamp format configurable.
- [x] Empty timeline có EmptyState.
- [x] Không chứa domain status mapping.
- [x] Có test render events.
- [x] Có test empty timeline.
- [x] Có test action emit.
- [x] Có test status variant generic.

### 6.7. SummaryMetricCard / ValueDisplay

- [x] Có metric/value component nếu Dashboard/Backtest cần KPI cards.
- [x] Hiển thị label.
- [x] Hiển thị value.
- [x] Hiển thị unit/suffix/prefix optional.
- [x] Hiển thị trend optional bằng semantic generic.
- [x] Hiển thị loading skeleton.
- [x] Hiển thị empty value fallback.
- [x] Hiển thị error state nếu metric load fail.
- [x] Không hard-code domain KPI.
- [x] Có test render value.
- [x] Có test loading/empty/error.
- [x] Có test trend semantic generic.


Evidence: Data display implementation verified in src/app/shared/ui/data-display plus summary-metric-card; targeted command PASS: npm.cmd test -- --include=src/app/shared/ui/data-display/badge/badge.component.spec.ts --include=src/app/shared/ui/data-display/copyable-text/copyable-text.component.spec.ts --include=src/app/shared/ui/data-display/key-value-list/key-value-list.component.spec.ts --include=src/app/shared/ui/data-display/json-viewer/json-viewer.component.spec.ts --include=src/app/shared/ui/data-display/diff-viewer/diff-viewer.component.spec.ts --include=src/app/shared/ui/data-display/timeline/timeline.component.spec.ts --include=src/app/shared/ui/data-display/value-display/value-display.component.spec.ts --include=src/app/shared/ui/summary-metric-card/summary-metric-card.component.spec.ts --watch=false --reporters=default (8 files, 32 tests).
---

## 7. Shared Table Requirements

### 7.1. Core DataTable architecture

- [x] Có shared DataTable ở shared/ui/table.
- [x] DataTable generic theo row type nếu TypeScript hỗ trợ.
- [x] DataTable không import feature/domain model.
- [x] DataTable không gọi API trực tiếp.
- [x] DataTable nhận data từ ngoài.
- [x] DataTable nhận loading từ ngoài.
- [x] DataTable nhận error từ ngoài.
- [x] DataTable nhận empty config từ ngoài.
- [x] DataTable emit query/page/sort/filter event.
- [x] DataTable emit rowClick nếu enabled.
- [x] DataTable emit actionClick cho action row.
- [x] DataTable không xử lý nghiệp vụ action.
- [x] DataTable có types public cho column/action/query event.
- [x] DataTable có tests cho state + events.

### 7.2. Column types bắt buộc

- [x] `text` hiển thị string ngắn, truncate + tooltip nếu dài.
- [x] `number` format số có thousands separator.
- [x] `semantic-number` nhận semantic từ config/function, không tự hiểu nghiệp vụ.
- [x] `percent` format %, có precision.
- [x] `currency` nhận currencyCode/prefix/suffix.
- [x] `date` format ngày.
- [x] `datetime` format ngày giờ.
- [x] `duration` format ms/seconds/minutes dễ đọc.
- [x] `boolean` hiển thị Yes/No hoặc icon theo config.
- [x] `badge` nhận badgeMap từ feature.
- [x] `tag-list` hiển thị list tag, có maxVisibleTags.
- [x] `copyable` copy được value, có toast/tooltip.
- [x] `link` điều hướng hoặc emit action.
- [x] `json` không show raw full, chỉ show button/viewer.
- [x] `custom` cho feature truyền template.
- [x] `actions` dùng action model chung.
- [x] Không thêm `pnl` vào shared column type.
- [x] Không thêm `side` vào shared column type.
- [x] Không thêm `tradeStatus` vào shared column type.
- [x] Không thêm domain-specific column type khác vào shared table.

### 7.3. Column config

- [x] Column có `field` hoặc `valueGetter`.
- [x] Column có `header`.
- [x] Column có `type`.
- [x] Column có visible default hợp lý.
- [x] Column có hideable optional.
- [x] Column có sortable optional.
- [x] Column có width/minWidth optional.
- [x] Column có sticky optional.
- [x] Column có align optional.
- [x] Column có tooltip optional.
- [x] Column có formatter optional.
- [x] Column có badgeMap optional cho badge type.
- [x] Column có semanticFn optional cho semantic number.
- [x] Column có maxVisibleTags optional.
- [x] Column có jsonDisplayMode optional.
- [x] Column config không chứa logic gọi API.
- [x] Column config không import model feature.
- [x] Feature có thể truyền formatter/semanticFn/badgeMap.
- [x] Column dài truncate hợp lý.
- [x] Column quan trọng có thể sticky.
- [x] Column tùy chọn có thể hide/show.

### 7.4. Table action model

- [x] Action có id.
- [x] Action có label.
- [x] Action có icon optional.
- [x] Action có variant default/primary/warning/danger/ghost.
- [x] Action có placement primary/more.
- [x] Action có visible(row) optional.
- [x] Action có disabled(row) optional.
- [x] Action có tooltip static/function optional.
- [x] Action có confirm config optional.
- [x] Action chính hiển thị rõ, không chỉ toàn icon nhỏ.
- [x] Action phụ gom vào more menu.
- [x] Action nguy hiểm dùng variant danger.
- [x] Action nguy hiểm bắt buộc confirm dialog.
- [x] Disabled action có tooltip giải thích.
- [x] Click action không trigger row click.
- [x] Table chỉ emit actionClick, page xử lý nghiệp vụ.
- [x] More menu keyboard accessible.

### 7.5. Table states

#### Loading

- [x] Có skeleton rows hoặc loading overlay.
- [x] Không để màn trắng khi đang load.
- [x] Refresh lại table giữ dữ liệu cũ hoặc hiển thị loading nhẹ theo config.
- [x] Loading state có aria-busy nếu áp dụng.
- [x] Loading state không chặn action không liên quan nếu config cho phép.

#### Empty

- [x] Empty state có title dễ hiểu.
- [x] Empty state có description gợi ý bước tiếp theo.
- [x] Empty state có primary action nếu phù hợp.
- [x] Empty state phân biệt chưa có data và không có kết quả do filter.
- [x] Empty state có reset filter action nếu do filter.
- [x] Empty state dùng EmptyStateComponent shared.

#### Error

- [x] Error state hiển thị ngay trong vùng table.
- [x] Error state có message dễ hiểu.
- [x] Error state có nút Retry.
- [x] Error state không chỉ show toast rồi để table trống.
- [x] Error state không làm mất filter hiện tại.
- [x] Error state dùng ErrorStateComponent shared.

### 7.6. Table toolbar

- [x] Có global search.
- [x] Global search có debounce.
- [x] Có filter toggle.
- [x] Có active filter count.
- [x] Có Clear all filters.
- [x] Có Refresh.
- [x] Refresh emit event, không tự gọi API.
- [x] Có column visibility nếu P1.
- [x] Có density compact/comfortable nếu P1.
- [x] Có export nếu P1.
- [x] Có bulk actions nếu selection enabled.
- [x] Toolbar responsive không vỡ.
- [x] Toolbar không chứa domain logic.

### 7.7. Filter UX

- [x] Filter text hoạt động.
- [x] Filter select hoạt động.
- [x] Filter multi-select hoạt động.
- [x] Filter date-range hoạt động.
- [x] Filter number-range hoạt động.
- [x] Filter boolean hoạt động.
- [x] Filter autocomplete hoạt động nếu có.
- [x] Filter đơn giản nằm trên toolbar.
- [x] Filter nâng cao collapsed mặc định.
- [x] Có Apply/Reset rõ ràng.
- [x] Select/multi-select có loading nếu options async.
- [x] Select/multi-select có empty state nếu không có options.
- [x] Select/multi-select có error retry nếu load options fail.
- [x] Date range dùng date-picker, không nhập text thô nếu project có datepicker.
- [x] Search debounce, không gọi liên tục từng ký tự.
- [x] Filter state có thể sync lên URL nếu page dùng BasePagedList.

### 7.8. Paging/sorting/server-side mode

- [x] Hỗ trợ client-side mode nếu cần.
- [x] Hỗ trợ server-side mode.
- [x] Với dữ liệu lớn, ưu tiên server-side paging/sort/filter.
- [x] Page size có options 10/20/50/100 hoặc config tương đương.
- [x] Sort state rõ: field + direction.
- [x] Khi filter đổi thì reset về page 0.
- [x] Khi load lỗi không reset mất filter hiện tại.
- [x] Có total records.
- [x] QueryChangeEvent có page.
- [x] QueryChangeEvent có size.
- [x] QueryChangeEvent có sort.
- [x] QueryChangeEvent có filters.
- [x] QueryChangeEvent có search.
- [x] Không emit query thừa không cần thiết.

### 7.9. Row click/selection/bulk action

- [x] Có rowClickable.
- [x] Click row mở drawer/detail hoặc emit event.
- [x] Hover row có style rõ.
- [x] Row selected có style riêng.
- [x] Action button không trigger row click.
- [x] Selection mode none/single/multiple.
- [x] Bulk action chỉ hiện khi có selection.
- [x] Bulk action nguy hiểm có confirm.
- [x] Select all page hiện tại hoặc toàn bộ query phải nói rõ.
- [x] Selection reset hợp lý khi data/filter/page đổi.
- [x] Keyboard có thể focus row/action nếu áp dụng.

### 7.10. JSON/array/object trong table

- [x] Không hiển thị raw JSON dài trong cell.
- [x] JSON chỉ hiển thị nút View hoặc preview ngắn.
- [x] Click JSON mở JsonViewer/Drawer.
- [x] Array hiển thị tag-list hoặc count.
- [x] Object hiển thị summary hoặc View detail.
- [x] Long string truncate + tooltip.
- [x] Copyable ID dùng CopyableText.
- [x] JSON viewer không làm vỡ table.

### 7.11. Responsive/accessibility

- [x] Desktop hiển thị table đầy đủ.
- [x] Tablet ẩn optional columns nếu config.
- [x] Mobile có card-list mode hoặc horizontal scroll được kiểm soát.
- [x] Action column sticky trên desktop nếu cần.
- [x] More menu dùng tốt trên mobile.
- [x] Toolbar wrap không vỡ layout.
- [x] Table có aria-label hoặc caption.
- [x] Header sortable có aria-sort.
- [x] Button icon có aria-label/tooltip.
- [x] Row click dùng được bằng keyboard nếu row clickable.
- [x] Focus state rõ.
- [x] Badge không chỉ dựa vào màu.
- [x] Contrast đủ đọc.

### 7.12. Table tests bắt buộc

- [x] Test render loading state.
- [x] Test render empty state.
- [x] Test render error state.
- [x] Test retry emit đúng.
- [x] Test text column.
- [x] Test number column.
- [x] Test percent column.
- [x] Test currency column.
- [x] Test date/datetime column.
- [x] Test boolean column.
- [x] Test badge column nhận badgeMap từ feature.
- [x] Test tag-list maxVisibleTags.
- [x] Test copyable column copy đúng value.
- [x] Test json column mở viewer/drawer hoặc emit event.
- [x] Test custom column/template nếu có.
- [x] Test action visible/disabled.
- [x] Test action confirm.
- [x] Test action click không trigger row click.
- [x] Test row click emit đúng.
- [x] Test sort emit đúng.
- [x] Test page change emit đúng.
- [x] Test search debounce nếu có.
- [x] Test filter apply/reset.
- [x] Test selection single/multiple.
- [x] Test bulk action confirm nếu có.
- [x] Integration test với ít nhất một feature list đã migrate.


Evidence: Shared table verified by table/table-cell/table-filter/base-paged-list targeted suite PASS (4 files, 31 tests) and feature-template-safety PASS (1 file, 5 tests) covering migrated feature list use of app-table.
---

## 8. Shared Form Requirements

### 8.1. Form architecture

- [x] Form pattern nằm trong shared/ui/forms.
- [x] Form common không import feature/domain model.
- [x] Form common không gọi API trực tiếp.
- [x] Form common emit submit/valueChange/validChange.
- [x] Feature page/service xử lý API save/load.
- [x] Form hỗ trợ create mode.
- [x] Form hỗ trợ edit mode.
- [x] Form hỗ trợ view/readonly mode.
- [x] Form hỗ trợ section/group.
- [x] Form hỗ trợ validation summary.
- [x] Form hỗ trợ dirty/pristine state.
- [x] Form hỗ trợ advanced JSON collapsed.
- [x] Form hỗ trợ API error mapping từ page truyền vào.
- [x] Form hỗ trợ disabled/loading state.
- [x] Form có tests cho render/validation/save flow.

### 8.2. Layout form chuẩn

- [x] Form có title rõ.
- [x] Form có description ngắn nếu cần.
- [x] Có mode create/edit/view.
- [x] Section có title.
- [x] Section có description.
- [x] Section có thể collapse/expand.
- [x] Advanced section collapse mặc định.
- [x] Section có indicator nếu bên trong có lỗi.
- [x] Footer action sticky khi form dài.
- [x] Save disabled khi invalid/loading.
- [x] Save có loading state.
- [x] Reset chỉ enable khi dirty.
- [x] Cancel khi dirty có confirm.
- [x] Mobile chuyển 1 cột.
- [x] Footer không che input.

Evidence: Shared form layout verified in `app-form-input`/`app-smart-form-shell`/`app-form-section-card`/`app-sticky-form-actions`; targeted command PASS: `$env:VITEST_POOL='threads'; npm.cmd test -- --include=src/app/shared/ui/form-input/form-input.spec.ts --include=src/app/shared/ui/forms/config-template-form/config-template-form.component.spec.ts --include=src/app/shared/ui/forms/validation-summary/validation-summary.component.spec.ts --include=src/app/shared/ui/base-crud-page/base-crud-page.component.spec.ts --watch=false --reporters=default` (4 files, 26 tests). Save invalid-disable is opt-in through `actions.disableSubmitWhenInvalid`; default submit remains available to surface the validation summary.

### 8.3. Field UX chuẩn

- [ ] Mọi field có label thật.
- [ ] Không dùng placeholder thay label.
- [ ] Required field có dấu * hoặc indicator rõ.
- [ ] Placeholder chỉ là gợi ý.
- [ ] Field khó hiểu có helpText/description.
- [ ] Field có example nếu cần.
- [ ] Disabled state có style riêng.
- [ ] Readonly state có style riêng.
- [ ] Error state có style riêng.
- [ ] Warning state có style riêng.
- [ ] Loading state có style riêng nếu field load async.
- [ ] Error message nằm gần field.
- [ ] Field có tooltip nếu mô tả dài.
- [ ] Error liên kết với input bằng aria nếu áp dụng.
- [ ] Tab order hợp lý.

### 8.4. Field types bắt buộc

- [x] Render text field.
- [x] Render textarea field.
- [x] Render number field.
- [x] Render decimal field.
- [x] Render percent field.
- [x] Render currency field.
- [x] Render select field.
- [x] Render multi-select field.
- [x] Render autocomplete field.
- [x] Render boolean field.
- [x] Render date field.
- [x] Render datetime field.
- [x] Render json field.
- [x] Render code field nếu project cần.
- [x] Render array field.
- [x] Render record field.
- [x] Render tree field.
- [x] Render secret field.
  Evidence note: project secret field is implemented as `secret-metadata` and rendered by `app-field-secret-metadata-renderer`.
- [x] Unsupported field type có fallback/error rõ, không crash silent.

Evidence: Field type rendering verified by `form-input.spec.ts`; targeted command PASS: `$env:VITEST_POOL='threads'; npm.cmd test -- --include=src/app/shared/ui/form-input/form-input.spec.ts --watch=false --reporters=default` (1 file, 20 tests). Coverage includes primitive aliases, date/datetime, JSON/code, array, record, tree, secret-metadata and unsupported fallback.

### 8.5. Select/autocomplete/options UX

- [ ] ID/code có option thì dùng select/autocomplete thay vì bắt nhập text.
- [ ] Option nhiều thì dùng autocomplete/search.
- [ ] Multi value dùng multi-select/tag input.
- [ ] Date/time dùng date-picker/datetime-picker nếu project có.
- [ ] JSON chỉ dùng ở Advanced hoặc field rõ ràng.
- [ ] Option có label dễ hiểu.
- [ ] Option có subtitle/description nếu cần.
- [ ] Option disabled có lý do.
- [ ] Load options có loading state.
- [ ] Load options lỗi có retry.
- [ ] Empty options có hướng dẫn.
- [ ] Autocomplete debounce search.
- [ ] Autocomplete hủy request khi destroy nếu có async.

### 8.6. Validation engine

- [x] Required validate đúng.
- [x] Min validate đúng.
- [x] Max validate đúng.
- [x] Regex validate đúng.
- [x] Expression validation hoạt động.
- [x] Custom validator registry hoạt động.
- [x] Cross-field validation hoạt động.
- [ ] Async validation có loading/debounce nếu cần.
  N/A reason: shared form engine hiện tại không có async validator contract; async option loading được xử lý ở option loader/filter layer, không phải validation engine.
- [x] Error message nói rõ cách sửa.
- [x] BE validation error map về đúng field nếu có.
- [x] Non-field error hiển thị ở form alert.
- [x] Warning và error phân biệt rõ.
- [x] Validation không crash khi value null/undefined.
- [x] Expression runtime error trả validation error dễ hiểu hoặc log safe, không crash form.
- [x] Tree/array/record field cũng đi qua validation engine chung.

Evidence: Validation behavior verified by `form-input.spec.ts` targeted runs in section 19.3 commands 15 and 18, covering required/min/max/regex/expression/custom/cross-field rules, safe expression runtime logging, null/undefined values, array/tree/record required validation, BE field-error mapping, non-field alert, and warning/error summary separation.

### 8.7. ValidationSummary

- [x] Có ValidationSummary ở shared/ui/forms.
- [x] Hiển thị tổng số lỗi.
- [x] Hiển thị danh sách lỗi form.
- [x] Chỉ hiện sau submit hoặc khi có lỗi cần chú ý theo config.
- [x] Click lỗi scroll tới field.
- [x] Click lỗi focus tới field nếu có thể.
- [x] Field/section được highlight khi scroll tới.
- [x] Warning và error phân biệt rõ.
- [x] Tree/array/record field đưa lỗi lên summary.
- [ ] Lỗi node-level tree có path/label dễ hiểu.
- [x] Không duplicate lỗi gây rối.
- [x] Có tests cho click/scroll/focus nếu test environment hỗ trợ.

Evidence: `validation-summary.component.spec.ts` covers render counts/list/warning separation/item click; `form-input.spec.ts` covers submitted-only display, scroll/focus, section error highlight, and array/tree errors in summary. Node-level tree path/label remains in section 9 tree scope.

### 8.8. ConfigTemplateForm generic

- [ ] Render được form từ template.
- [ ] Template có title/description optional.
- [ ] Template có groups.
- [ ] Group có key.
- [ ] Group có label.
- [ ] Group có description optional.
- [ ] Group có collapsed default optional.
- [ ] Field có key.
- [ ] Field có label.
- [ ] Field có type.
- [ ] Field có required optional.
- [ ] Field có defaultValue optional.
- [ ] Field có placeholder optional.
- [ ] Field có description optional.
- [ ] Field có options optional.
- [ ] Field có validations optional.
- [ ] Field có visibleWhen optional.
- [ ] Field có disabledWhen optional.
- [ ] Field có requiredWhen optional.
- [ ] Hỗ trợ defaultValue.
- [ ] Hỗ trợ visibleWhen.
- [ ] Hỗ trợ disabledWhen.
- [ ] Hỗ trợ requiredWhen.
- [ ] Hỗ trợ validations.
- [ ] Sinh payload rõ ràng.
- [ ] Feature có thể map payload sang DTO riêng.
- [ ] Không hard-code rule/indicator/trade trong common.
- [ ] Không gọi API trực tiếp.

### 8.9. Array field

- [ ] Add item.
- [ ] Remove item.
- [ ] Reorder item nếu cần.
- [ ] Validate từng item.
- [ ] Empty array có EmptyState.
- [ ] Item có label rõ.
- [ ] Item error hiển thị đúng vị trí.
- [ ] Remove item có confirm nếu item phức tạp/nguy hiểm theo config.
- [ ] Array update làm form dirty.
- [ ] Array không mutate input ngoài ý muốn.
- [ ] Có test add/remove/reorder/validation.

### 8.10. Record field

- [ ] Add key-value.
- [ ] Key required.
- [ ] Key không trùng.
- [ ] Value validate theo type.
- [ ] Import/export JSON nếu cần.
- [ ] Empty record có EmptyState.
- [ ] Invalid key hiển thị lỗi gần key.
- [ ] Record update làm form dirty.
- [ ] Record không mutate input ngoài ý muốn.
- [ ] Có test add/remove/duplicate key/value validation.

### 8.11. Advanced JSON trong form

- [ ] Advanced JSON collapse mặc định.
- [ ] JSON format đẹp.
- [ ] JSON có copy button.
- [ ] JSON có validate.
- [ ] JSON lỗi hiển thị rõ.
- [ ] JSON editable/readonly theo config.
- [ ] Sửa JSON xong sync lại form nếu enabled.
- [ ] JSON lỗi không làm mất dữ liệu form hiện tại.
- [ ] Secret không lộ trong JSON nếu không được phép.
- [ ] Apply JSON trigger validation.
- [ ] Apply JSON update dirty state.
- [ ] Có test valid JSON apply.
- [ ] Có test invalid JSON không mất data.
- [ ] Có test copy JSON.
- [ ] Có test collapsed default.

### 8.12. Dirty state / unsaved changes

- [x] Form biết pristine/dirty.
- [x] Rời page khi dirty phải confirm.
- [x] Cancel khi dirty phải confirm.
- [x] Reset changes khôi phục initial value.
- [x] Save thành công reset dirty state.
- [ ] Save lỗi giữ nguyên dữ liệu đã nhập.
- [x] Dirty state hoạt động với text field.
- [ ] Dirty state hoạt động với select field.
- [ ] Dirty state hoạt động với array/record/tree field.
- [x] Dirty guard không hiện khi form pristine.
- [x] Dirty guard không block sau khi save thành công.
- [x] Có test dirty/pristine/cancel/reset/save.

Evidence: Dirty/reset behavior verified by `form-input.spec.ts` reset regression and `base-crud-page.component.spec.ts` dirty/pristine confirm regression; targeted command PASS in section 19.3 command 15.

### 8.13. Save flow

- [ ] User bấm Save thì validate toàn bộ form.
- [ ] Nếu invalid, show ValidationSummary.
- [ ] Nếu invalid, không gọi API submit.
- [ ] Nếu valid, disable Save.
- [ ] Nếu valid, hiển thị loading.
- [ ] Không double submit.
- [ ] API gọi ở page/service, không ở form-input common.
- [ ] Thành công: emit/notify để page toast + reset dirty.
- [ ] Lỗi: show form alert.
- [ ] Field error từ BE map đúng field.
- [ ] Non-field error hiển thị trên đầu form.
- [ ] Save lỗi không mất dữ liệu đã nhập.
- [ ] Save button loading.
- [ ] Save disabled khi invalid/loading.
- [ ] Có test invalid không submit.
- [ ] Có test double click chỉ submit một lần.
- [ ] Có test API error mapping.

### 8.14. View/readonly mode

- [ ] Form hỗ trợ create/edit/view.
- [ ] View mode không chỉ render disabled input xấu.
- [ ] View mode có thể dùng KeyValueList/DescriptionList.
- [ ] Có nút Edit nếu có quyền.
- [ ] Field readonly có style riêng.
- [ ] Tooltip giải thích vì sao field disabled nếu cần.
- [ ] Readonly không cho sửa text/select/tree/array/record.
- [ ] Readonly vẫn cho copy value nếu phù hợp.
- [ ] Readonly vẫn cho mở Advanced JSON readonly nếu config.
- [ ] Có test readonly không emit change.
- [ ] Có test view mode render value đẹp.

### 8.15. Form tests bắt buộc

- [x] Test render text field.
- [x] Test render number field.
- [x] Test render select field.
- [x] Test render multi-select field.
- [x] Test render autocomplete field.
- [x] Test render date/datetime field.
- [x] Test render json field.
- [x] Test render array field.
- [x] Test render record field.
- [x] Test render tree field.
- [x] Test required validation.
- [x] Test min/max validation.
- [x] Test regex validation.
- [x] Test expression validation.
- [x] Test custom validator.
- [x] Test cross-field validation.
- [x] Test ValidationSummary click scroll/focus.
- [x] Test dirty guard.
- [x] Test Advanced JSON không hiện mặc định.
- [x] Test Save invalid không gọi API.
- [x] Test Save loading chống double click.
- [x] Test API error không làm mất dữ liệu form.

Evidence: Required form tests are covered by `form-input.spec.ts`, `base-crud-page.component.spec.ts`, `config-template-form.component.spec.ts`, and `validation-summary.component.spec.ts`. Latest targeted proof: section 19.3 commands 15 and 18.

---

## 9. Tree Field Requirements

### 9.1. Nguyên tắc bắt buộc

- [x] Tree là field type trong form, không phải component nghiệp vụ.
- [ ] Tree nằm trong shared/ui/forms vì là form pattern lớn.
- [ ] Primitive select-tree nếu có nằm trong shared/component/selection/select-tree.
- [x] Tree common không biết trade/rule/menu/permission/workflow.
- [x] Feature truyền options.
- [x] Feature truyền node display.
- [x] Feature truyền validator name nếu cần custom validator.
- [x] Feature map DTO riêng.
- [x] Tree không có validation config riêng kiểu minChildren.
- [x] Tree không có validation config riêng kiểu maxChildren.
- [x] Tree không có validation config riêng kiểu maxDepth.
- [x] Tree không có validation config riêng kiểu duplicatePolicy.
- [x] Validation dùng chung `validations` của form-input.
- [x] Tree emit valueChange để FormControl chạy validate.
- [x] Tree nhận errors từ form để hiển thị.

Evidence: `TreeFieldConfig` models `pickerOptions`, `TreeFormNode`, `TreePickerOption`, and generic `treeConfig`; `FieldTreeRendererComponent` is rendered by `app-form-input`, calls `field.setValue(...)`, and renders `field.errors()`. Domain fallbacks `ruleCode/indicatorCode` were removed from shared tree code; targeted command 27 PASS.

### 9.2. Phân tầng component tree

- [ ] `select-tree` không có add/remove/builder.
- [x] `tree-builder` không import feature/domain model.
  N/A reason: repo không có component `tree-builder`; builder behavior nằm trong generic `field-tree-renderer`.
- [x] `tree-child-picker` nhận option generic.
  N/A reason: repo không có component `tree-child-picker`; picker behavior dùng generic `TreePickerOption` trong `field-tree-renderer`.
- [x] `field-tree-renderer` tích hợp với form validation chung.
- [x] Feature tự map data sang TreePickerOption/TreeFormNode.
- [x] Tree builder không gọi API.
- [x] Picker không gọi API nếu options được truyền từ page/service.
- [ ] Picker emit search/filter event nếu options async.
- [ ] Mapper domain nằm ở feature.
- [ ] Validator domain nằm ở feature registry, không nằm trong tree common.

### 9.3. TreeFieldUiConfig

- [ ] Config có mode select/builder.
- [ ] Config có allowAddNode.
- [ ] Config có allowRemoveNode.
- [ ] Config có allowReplaceNode.
- [ ] Config có allowEditNode nếu cần.
- [ ] Config có allowMoveNode.
- [ ] Config có allowDragDrop nếu P2.
- [ ] Config có allowGroupNode.
- [ ] Config có readonly.
- [ ] Config có picker enabled/mode/searchable/filterable/multiSelect.
- [ ] Config có nodeDisplay showIcon/showSubtitle/showDescription/showBadges/showValidationIcon.
- [ ] Config có advancedJson enabled/editable/collapsedByDefault.
- [ ] Config có labels add/remove/replace/move/clear/empty.
- [ ] treeConfig không chứa min/max validation.
- [ ] treeConfig chỉ điều khiển UI/action/labels/picker.
- [ ] Label có thể override theo từng feature.
- [ ] Advanced JSON có thể enable/disable.
- [ ] Readonly mode chỉ cho xem, không cho sửa.

### 9.4. TreeFormNode model

- [ ] Node có id ổn định.
- [ ] Node có label.
- [ ] Node có value.
- [ ] Node có type optional.
- [ ] Node có subtitle optional.
- [ ] Node có description optional.
- [ ] Node có icon optional.
- [ ] Node có badges generic optional.
- [ ] Node có data metadata optional.
- [ ] Node có children optional hoặc array nhất quán.
- [ ] Node có disabled optional.
- [ ] Node có disabledReason optional.
- [ ] Node có readonly optional.
- [ ] `value` dùng để submit/map DTO.
- [ ] `label/subtitle/badges` dùng để hiển thị, không làm logic bắt buộc.
- [ ] Tree không tự map sang DTO nghiệp vụ.
- [ ] Tree không mutate node input ngoài ý muốn.

### 9.5. TreePickerOption model

- [ ] Option có id.
- [ ] Option có label.
- [ ] Option có value.
- [ ] Option có subtitle optional.
- [ ] Option có description optional.
- [ ] Option có icon optional.
- [ ] Option có badges generic optional.
- [ ] Option có disabled optional.
- [ ] Option có disabledReason optional.
- [ ] Option có data optional.
- [ ] Picker không biết domain.
- [ ] Option disabled có lý do.
- [ ] Option có badge generic do feature truyền.
- [ ] Picker có thể single select.
- [ ] Picker có thể multi select nếu config.

### 9.6. Tree builder UX

- [x] Empty state không để vùng trắng.
- [ ] Empty text lấy từ labels config.
- [ ] Action Add chỉ hiện nếu allowAddNode.
- [ ] Add Group chỉ hiện nếu allowGroupNode.
- [ ] Toolbar action bật/tắt theo config.
- [ ] Clear tree phải confirm nếu có data.
- [ ] Validate action trigger form validation chung.
- [ ] Expand/collapse giữ state hợp lý.
- [ ] Node hiển thị label.
- [ ] Node hiển thị subtitle nếu config cho phép.
- [ ] Node hiển thị badges generic.
- [ ] Node disabled có style và disabledReason.
- [ ] Node lỗi có indicator rõ.
- [ ] Text dài truncate + tooltip.
- [ ] Node action không submit form nhầm.

### 9.7. Node actions

- [ ] Add child emit event hoặc mở picker common.
- [x] Replace giữ vị trí node cũ.
- [x] Remove node có children phải confirm.
- [x] Move up disabled đúng ở đầu list.
- [ ] Move down disabled đúng ở cuối list.
- [x] Duplicate tạo id mới.
- [ ] View emit event cho feature mở drawer/detail.
- [ ] Action button không làm mất focus không cần thiết.
- [ ] Action button không trigger parent row/node click sai.
- [ ] Action button không submit form nhầm.
- [x] Remove disabled khi readonly.
- [x] Replace disabled khi readonly.
- [x] Move disabled khi readonly.

Evidence: `field-tree-renderer.spec.ts` now covers replace preserving children, move-up boundary disable, duplicate new id, remove/clear ConfirmDialog, and readonly guard for add/remove/replace/move/advanced JSON mutation. Targeted command PASS in section 19.3 command 20.

### 9.8. Picker UX

- [ ] Picker có drawer/dialog/inline mode.
- [ ] Search có debounce.
- [ ] Filter generic do feature truyền.
- [ ] Loading options có state.
- [ ] Empty options có state.
- [ ] Load error có retry.
- [ ] Disabled option không chọn được.
- [ ] Disabled option có tooltip/lý do.
- [ ] Có preview item nếu data nhiều.
- [ ] Multi-select hoạt động nếu config cho phép.
- [ ] Add selected emit nodes về tree.
- [ ] Picker close không mất selection ngoài ý muốn.
- [ ] Picker keyboard accessible nếu áp dụng.

### 9.9. Tree validation dùng form engine

- [ ] Tree field dùng `validations` chung.
- [ ] Expression nhận `value` là TreeFormNode[].
- [ ] Expression có thể dùng `form` để cross-field validate.
- [ ] Custom validator dùng registry chung của form.
- [ ] ValidationSummary nhận lỗi tree như field bình thường.
- [ ] Click lỗi tree scroll tới tree field.
- [ ] Nếu lỗi có nodeId thì expand path + highlight node.
- [ ] Required tree hoạt động.
- [ ] Expression `value.length <= N` hoạt động.
- [ ] Expression dùng helper countTreeNodes hoạt động.
- [ ] Expression dùng helper treeDepth hoạt động.
- [ ] Expression dùng helper hasDuplicate hoạt động.
- [ ] Runtime error trong expression không crash form.

### 9.10. Tree helpers

- [x] Có helper flattenTree.
- [x] Có helper countTreeNodes.
- [x] Có helper treeDepth.
- [x] Có helper hasDuplicate.
- [x] Có helper hasDisabledNode nếu cần.
- [x] Có helper findTreeNode nếu cần.
- [x] Helper không phụ thuộc domain.
- [x] Helper xử lý null/undefined an toàn.
- [x] Helper xử lý empty array.
- [x] Helper xử lý node thiếu children.
- [x] Helper có unit test.

Evidence: `formValidationHelpers` in `expression.engine.ts` exposes generic helpers only over `TreeFormNode`; `expression.engine.spec.ts` covers flatten/count/depth/duplicate/disabled/find/null/undefined/empty/partial-node cases and expression helper integration. Targeted command PASS in section 19.3 command 20.

### 9.11. Custom validator registry

- [ ] Common có validator registry.
- [ ] Feature có thể đăng ký validator riêng.
- [ ] Validator riêng không nằm trong tree common.
- [ ] Validator có thể trả field-level error.
- [ ] Validator có thể trả nodeId để highlight node.
- [ ] Validator nhận formValue.
- [ ] Validator nhận fieldKey.
- [ ] Validator nhận helpers.
- [ ] Validator unknown trả lỗi rõ hoặc ignore theo convention.
- [ ] Registry có tests.

### 9.12. Error display trong tree

- [ ] Field-level error hiển thị dưới tree.
- [ ] Node-level error hiển thị ngay tại node.
- [ ] Tree-level warning/error phân biệt rõ.
- [ ] Node có lỗi tự expand path nếu click từ summary.
- [ ] Error message không chỉ dùng màu.
- [ ] Lỗi có aria-describedby nếu áp dụng.
- [ ] Lỗi không duplicate quá mức.
- [ ] Lỗi biến mất khi sửa đúng.

### 9.13. Advanced JSON trong tree

- [ ] Advanced JSON collapse mặc định.
- [x] JSON format đẹp.
- [ ] Copy JSON.
- [x] Validate JSON trước khi apply.
- [x] Apply JSON update FormControl value.
- [x] Apply JSON trigger validation chung.
- [x] JSON lỗi không làm mất tree hiện tại.
- [x] Có readonly JSON nếu config không cho sửa.
- [ ] JSON không expose secret nếu có mask config.

Evidence: `field-tree-renderer.spec.ts` covers editable JSON apply, invalid non-array/malformed JSON errors, preserving the current tree after invalid JSON, and no mutation when readonly. `form-input.spec.ts` covers Advanced JSON apply updating a tree field and rerunning shared form-engine expression validation.

### 9.14. Readonly/disabled/accessibility tree

- [x] Readonly không cho Add.
- [x] Readonly không cho Remove.
- [x] Readonly không cho Replace.
- [x] Readonly không cho Move.
- [ ] Readonly vẫn expand/collapse.
- [ ] Readonly vẫn view detail nếu enabled.
- [x] Readonly vẫn xem JSON nếu allowed.
- [ ] Node disabled có style rõ.
- [ ] Node disabled có disabledReason.
- [x] Không cho chọn disabled option.
- [ ] Existing disabled node validation do form quyết định.
- [ ] Tree focus được bằng keyboard.
- [x] Move up/down là alternative cho drag/drop.
- [ ] Action icon có aria-label/tooltip.
- [ ] Error có aria-describedby.
- [ ] Màu không phải tín hiệu duy nhất.

Evidence: component method guards now include `readonlyMode`, disabled field state, and tree readonly config; picker option selection ignores disabled options; move up/down actions are implemented and covered for move-up boundary in `field-tree-renderer.spec.ts`.

### 9.15. Tree tests bắt buộc

- [x] Test tree common không import feature/domain model bằng static/lint/grep nếu có thể.
- [x] Test render empty state.
- [x] Test add node từ picker.
- [x] Test remove node.
- [x] Test replace node.
- [x] Test move up/down nếu enabled.
- [x] Test tree value cập nhật vào form control.
- [x] Test form dirty khi tree thay đổi.
- [x] Test required validation.
- [x] Test expression `value.length <= 5`.
- [x] Test helper countTreeNodes.
- [x] Test helper hasDuplicate.
- [x] Test custom validator.
- [x] Test ValidationSummary hiển thị lỗi tree.
- [x] Test node-level error highlight nếu có nodeId.
- [x] Test Advanced JSON apply thành công chạy validate lại.
- [x] Test Advanced JSON lỗi không mất tree cũ.
- [x] Test readonly mode không cho sửa.
- [ ] Test mobile/responsive nếu có test harness/visual/manual.

Evidence: targeted unit command PASS in section 19.3 command 24; static grep for feature/domain imports in tree shared files returned no matches. Remaining gap: mobile/responsive manual or visual check.

---

## 10. Realtime Progress Requirements

### 10.1. Progress model generic

- [x] Có RealtimeProgressBar/ProgressState component generic nếu hệ thống có job/progress.
- [x] ProgressState không hard-code task trade.
- [x] Hỗ trợ status queued.
- [x] Hỗ trợ status running.
- [x] Hỗ trợ status completed.
- [x] Hỗ trợ status failed.
- [x] Hỗ trợ status cancelled.
- [x] Hỗ trợ percent.
- [x] Hỗ trợ current.
- [x] Hỗ trợ total.
- [x] Hỗ trợ step.
- [x] Hỗ trợ message.
- [x] Hỗ trợ error.
- [ ] Hỗ trợ startedAt/updatedAt nếu cần.
  N/A reason: current progress usage only renders active status, step/message/error, percent/current/total; timestamp display is not required by any current caller.
- [x] Hỗ trợ cancel action nếu config.
- [x] Hỗ trợ retry action nếu config.
- [x] Hỗ trợ view detail action nếu config.
- [x] Không gọi API trực tiếp trong shared component.
- [x] Emit cancel/retry/viewDetail để page xử lý.

### 10.2. Progress UX

- [x] Queued hiển thị chờ xử lý rõ.
- [x] Running hiển thị progress rõ.
- [x] Completed hiển thị success rõ.
- [x] Failed hiển thị error rõ.
- [x] Cancelled hiển thị cancelled rõ.
- [x] Unknown percent có indeterminate mode.
- [ ] Error có detail/copy nếu cần.
  N/A reason: current progress error only needs inline `app-alert`; copy-detail is not required for current progress payload.
- [ ] Cancel action nguy hiểm có ConfirmDialog nếu cần.
  N/A reason: shared progress component only emits `cancel`; caller/page owns destructive confirmation when the domain action requires it.
- [x] Progress update không làm giật layout.
- [x] Progress component responsive.

### 10.3. Progress tests

- [x] Test queued state.
- [x] Test running state.
- [x] Test completed state.
- [x] Test failed state.
- [x] Test cancelled state.
- [x] Test percent/current/total render.
- [x] Test indeterminate mode.
- [x] Test cancel emit.
- [x] Test retry emit.
- [x] Test view detail emit.
- [x] Test error render.

Evidence: `realtime-progress-bar.component.ts/html/css` are generic and domain-free; `realtime-progress-bar.component.spec.ts` covers running percent/current/total/detail/cancel, legacy normalization, queued/completed/cancelled variants, indeterminate running state, failed error alert, and retry emit. Latest full suite PASS in section 19.3 command 25.

---

## 11. Feature Page Migration Requirements

### 11.1. Dashboard

- [ ] Dashboard dùng PageShell.
- [ ] Dashboard dùng PageHeader hoặc header qua PageShell.
- [ ] Dashboard dùng SummaryMetricCard/ValueDisplay cho KPI.
- [ ] Dashboard dùng LoadingSkeleton khi loading.
- [ ] Dashboard dùng EmptyState khi chưa có dữ liệu.
- [ ] Dashboard dùng ErrorState khi load fail.
- [ ] Dashboard card có action rõ.
- [ ] Dashboard status dùng Badge generic hoặc feature badge riêng nếu có nghiệp vụ.
- [ ] Dashboard không show raw JSON mặc định.
- [ ] Dashboard responsive desktop/tablet/mobile.
- [ ] Dashboard có test/component test cho loading/empty/error.
- [ ] Dashboard có regression/manual check mở route thành công.

### 11.2. Market Data

- [ ] Màn Market Data dùng PageShell.
- [ ] Query/Sync/Gaps/Import tách bằng tabs/section.
- [ ] Filter dùng FilterPanel nếu phù hợp.
- [ ] Candle table dùng shared/ui/table đã nâng.
- [ ] Raw candle mở Drawer.
- [ ] Raw JSON dùng JsonViewer.
- [ ] Repair gap dùng ConfirmDialog.
- [ ] Ignore gap dùng ConfirmDialog.
- [ ] Loading dùng component shared.
- [ ] Empty dùng component shared.
- [ ] Error dùng component shared.
- [ ] Sync progress dùng RealtimeProgressBar generic.
- [ ] Market Data không chứa raw JSON mặc định trên main view.
- [ ] Market Data action nguy hiểm có confirm.
- [ ] Market Data table filter/paging vẫn hoạt động.
- [ ] Market Data có test/regression cho table state.
- [ ] Market Data có test/regression cho repair/ignore confirm.

### 11.3. Indicator Config List

- [ ] Indicator Config List dùng PageShell.
- [ ] Indicator Config List dùng FilterPanel.
- [ ] Indicator table dùng shared DataTable.
- [ ] Status dùng badge generic với badgeMap từ feature.
- [ ] Code/ID dùng CopyableText nếu cần.
- [ ] Row click mở preview drawer.
- [ ] Delete dùng ConfirmDialog.
- [ ] Empty state chuẩn.
- [ ] Error state chuẩn.
- [ ] Loading state chuẩn.
- [ ] Paging/filter vẫn hoạt động.
- [ ] Action click không trigger row click sai.
- [ ] Có regression test/manual check list mở được.
- [ ] Có test delete confirm không gọi delete khi cancel.

### 11.4. Rule Config List

- [ ] Rule Config List dùng PageShell.
- [ ] Rule Config List dùng FilterPanel.
- [ ] Rule table dùng shared DataTable.
- [ ] Indicators không hiển thị JSON raw.
- [ ] Indicators hiển thị tag/list/count dễ đọc.
- [ ] Child rules hiển thị số lượng hoặc tag.
- [ ] Row click mở preview drawer.
- [ ] Delete dùng ConfirmDialog.
- [ ] Empty state chuẩn.
- [ ] Error state chuẩn.
- [ ] Loading state chuẩn.
- [ ] Paging/filter vẫn hoạt động.
- [ ] Có regression test/manual check list mở được.
- [ ] Có test delete confirm.

### 11.5. Strategy Config List

- [ ] Strategy Config List dùng PageShell.
- [ ] Strategy Config List dùng FilterPanel.
- [ ] Strategy table dùng shared DataTable.
- [ ] Entry rule hiển thị dễ đọc.
- [ ] Stop-loss rule hiển thị dễ đọc.
- [ ] Take-profit rule hiển thị dễ đọc.
- [ ] Có action chính rõ.
- [ ] Action phụ vào More menu.
- [ ] Delete dùng ConfirmDialog.
- [ ] Empty state chuẩn.
- [ ] Error state chuẩn.
- [ ] Loading state chuẩn.
- [ ] Paging/filter vẫn hoạt động.
- [ ] Có regression test/manual check list mở được.
- [ ] Có test delete confirm.

### 11.6. Config Forms

- [ ] Indicator form dùng SectionPanel.
- [ ] Rule form dùng SectionPanel.
- [ ] Strategy form dùng SectionPanel.
- [x] Form dùng shared form/input/config-template pattern nếu phù hợp.
- [ ] Advanced JSON dùng JsonViewer.
- [ ] Advanced JSON collapsed mặc định.
- [x] Form-level API error dùng Alert/ErrorState.
- [x] Cancel khi dirty dùng ConfirmDialog.
- [x] ValidationSummary hiển thị lỗi tổng.
- [ ] FieldGuidePanel hoặc help panel hiển thị hướng dẫn theo ngữ cảnh nếu có.
- [ ] View mode nếu có dùng KeyValueList/readonly display.
- [x] Save flow chống double submit.
- [x] API field errors map đúng field.
- [ ] Tree field trong rule/strategy dùng validation chung nếu có.
- [ ] Raw/debug JSON không hiện mặc định.
- [ ] Có test create invalid không submit.
- [x] Có test edit dirty cancel confirm.
- [x] Có test API error mapping.
- [x] Có regression/manual check create/edit/save.

### 11.7. Backtest List

- [ ] Backtest List dùng PageShell.
- [ ] Run form dùng form-input nâng cấp.
- [ ] Run history dùng table nâng cấp.
- [ ] Status dùng badge.
- [ ] Run ID dùng CopyableText.
- [ ] RUNNING có ProgressState.
- [ ] FAILED có error tooltip hoặc detail drawer.
- [ ] Cancel run dùng ConfirmDialog.
- [ ] Empty state chuẩn.
- [ ] Error state chuẩn.
- [ ] Loading state chuẩn.
- [ ] Run form chống double submit.
- [ ] Table filter/paging vẫn hoạt động.
- [ ] Có test cancel confirm.
- [ ] Có test running/failed/completed state.
- [ ] Có regression/manual check run history mở được.

### 11.8. Backtest Detail

- [ ] Backtest Detail dùng PageShell.
- [ ] Header có action rõ.
- [ ] KPI cards dùng SummaryMetricCard/ValueDisplay.
- [ ] Lazy load từng tab nếu có nhiều tab.
- [ ] Trade detail mở Drawer.
- [ ] Order detail mở Drawer.
- [ ] Log detail mở Drawer.
- [ ] Snapshot/raw JSON dùng JsonViewer.
- [ ] Errors dùng ErrorState.
- [ ] Loading dùng LoadingSkeleton.
- [ ] Empty tab dùng EmptyState.
- [ ] Không lộ raw JSON mặc định ở main view.
- [ ] Có test/regression cho tab loading/empty/error.
- [ ] Có test/regression cho drawer detail.

### 11.9. Paper Trade

- [ ] Paper Trade dùng PageShell hoặc terminal layout riêng trong feature.
- [ ] Create account chuyển dialog/drawer nếu đang inline lộn xộn.
- [ ] Start session chuyển dialog/drawer nếu phù hợp.
- [ ] Stop dùng ConfirmDialog.
- [ ] Reset dùng ConfirmDialog.
- [ ] Tables dùng shared DataTable.
- [ ] Detail dùng Drawer.
- [ ] Raw JSON dùng JsonViewer.
- [ ] Loading state dùng shared feedback.
- [ ] Empty state dùng shared feedback.
- [ ] Error state dùng shared feedback.
- [ ] Progress dùng RealtimeProgressBar generic.
- [ ] Không đưa paper-trade status vào shared common.
- [ ] Có test stop/reset confirm.
- [ ] Có regression/manual check session flow.

### 11.10. System Logs

- [ ] System Logs dùng PageShell.
- [ ] Filter dùng FilterPanel.
- [ ] Log table dùng shared DataTable.
- [ ] TraceId dùng CopyableText.
- [ ] RunId dùng CopyableText nếu có.
- [ ] Click row mở Drawer.
- [ ] Payload dùng JsonViewer.
- [ ] Empty state chuẩn.
- [ ] Error state chuẩn.
- [ ] Loading state chuẩn.
- [ ] Filter/search/paging vẫn hoạt động.
- [ ] Raw payload không show full trong table cell.
- [ ] Có test/regression cho drawer payload.
- [ ] Có test/regression cho filter.

### 11.11. Cache Monitor

- [ ] Cache Monitor dùng PageShell.
- [ ] Summary dùng MetricCard/KeyValueList.
- [ ] JSON raw chuyển vào JsonViewer Advanced.
- [ ] Evict dùng ConfirmDialog nếu nguy hiểm.
- [ ] Empty state chuẩn.
- [ ] Error state chuẩn.
- [ ] Loading state chuẩn.
- [ ] Cache entries table dùng shared DataTable nếu có list.
- [ ] Refresh emit/call đúng ở page/service.
- [ ] Không show raw JSON mặc định.
- [ ] Có test evict confirm.
- [ ] Có regression/manual check monitor mở được.

---

## 12. Storybook / Demo Requirements

Nếu project có Storybook:

- [x] Có story cho EmptyState.
- [x] Có story cho ErrorState.
- [x] Có story cho LoadingSkeleton.
- [x] Có story cho Alert.
  Evidence: Feedback Storybook items are covered by src/app/shared/ui/shared-ui-foundation.stories.ts::FeedbackStates.
- [x] Có story cho ConfirmDialog.
- [x] Có story cho Drawer.
  Evidence: ConfirmDialog story covered by src/app/shared/ui/shared-ui-foundation.stories.ts::ConfirmDialog; Drawer story covered by ::OverlayAndLayout; Storybook build PASS in .tmp/storybook-overlay-check.
- [x] Có story cho PageShell.
- [x] Có story cho PageHeader.
- [x] Có story cho SectionPanel.
- [x] Có story cho FilterPanel.
- [x] Có story cho ActionToolbar.
  Evidence: Layout stories covered by src/app/shared/ui/shared-ui-foundation.stories.ts::OverlayAndLayout.
- [x] Có story cho Badge.
- [x] Có story cho CopyableText.
- [x] Có story cho KeyValueList.
- [x] Có story cho JsonViewer.
- [x] Có story cho DiffViewer nếu có.
- [x] Có story cho Timeline nếu có.
  Evidence: Data display stories covered by src/app/shared/ui/shared-ui-foundation.stories.ts::DataDisplay.
- [x] Có story cho Table loading/empty/error.
- [x] Có story cho Table column types.
- [x] Có story cho Table actions/confirm.
  Evidence: Table stories covered by src/app/shared/ui/table/table.stories.ts and src/app/shared/ui/shared-ui-foundation.stories.ts::TableAndForm.
- [x] Có story cho Form section/validation.
- [x] Có story cho Form field types.
- [x] Có story cho Tree field.
  Evidence: `src/app/shared/ui/form-input/form-input.stories.ts` covers sectioned form layout, validation state via `WithErrors`, field type coverage in `Default`, and a checkbox tree field with selected panel/filter presets.
- [x] Có story cho RealtimeProgressBar.
  Evidence: `src/app/shared/ui/realtime-progress-bar/realtime-progress-bar.stories.ts` covers default/running, queued, indeterminate running, completed, failed, and cancelled states; Storybook build command 26 PASS.

Nếu project không có Storybook:

- [ ] Tạo hoặc cập nhật dev demo route nếu repo cho phép, ví dụ `/admin/ui-demo`.
- [ ] Demo EmptyState/ErrorState/LoadingSkeleton.
- [ ] Demo ConfirmDialog/Drawer.
- [ ] Demo PageShell/FilterPanel/ActionToolbar.
- [ ] Demo Badge/CopyableText/KeyValueList/JsonViewer.
- [ ] Demo Table với loading/empty/error/data/action/filter.
- [ ] Demo Form với validation/dirty/advanced JSON.
- [ ] Demo Tree field với picker/validation/readonly.
- [ ] Demo Progress states.
- [ ] Demo route không bị đưa vào production navigation nếu không phù hợp.
- [ ] Demo có test smoke hoặc manual check ghi rõ.

---

## 13. Accessibility Requirements

- [ ] Mọi input có label thật.
- [ ] Error liên kết với input nếu framework hỗ trợ.
- [ ] Required không chỉ thể hiện bằng màu.
- [ ] Button icon có aria-label hoặc tooltip.
- [ ] Badge không chỉ dựa vào màu.
- [ ] ConfirmDialog có role/aria đúng nếu áp dụng.
- [ ] Drawer có role/aria đúng nếu áp dụng.
- [ ] Dialog/drawer focus trap đúng.
- [ ] Focus trả về trigger sau khi đóng nếu có thể.
- [ ] Keyboard tab order hợp lý trong form.
- [ ] Row click có keyboard alternative nếu row clickable.
- [ ] More menu keyboard accessible.
- [ ] Tree có keyboard focus.
- [ ] Tree có move up/down alternative cho drag/drop.
- [ ] Error/warning text có contrast đủ.
- [ ] Danger action có text rõ, không chỉ icon/màu.
- [ ] Loading state có aria-busy/status nếu áp dụng.
- [ ] Toast không phải nơi duy nhất chứa thông tin lỗi quan trọng.
- [ ] Responsive mobile không làm mất khả năng thao tác bằng keyboard/touch.
- [ ] Accessibility đã được test/manual check cho các flow chính.

---

## 14. Responsive Requirements

- [ ] PageShell không vỡ ở desktop.
- [ ] PageShell không vỡ ở tablet.
- [ ] PageShell không vỡ ở mobile.
- [ ] Table desktop hiển thị đủ column quan trọng.
- [ ] Table tablet ẩn optional columns hoặc scroll kiểm soát.
- [ ] Table mobile có card mode hoặc scroll kiểm soát.
- [ ] Toolbar wrap không vỡ.
- [ ] FilterPanel mobile dễ dùng.
- [ ] Form desktop có 1-2 cột hợp lý.
- [ ] Form mobile chuyển 1 cột.
- [ ] Sticky footer không che input.
- [ ] Drawer mobile full-screen hoặc layout hợp lý.
- [ ] Dialog mobile không tràn màn.
- [ ] JsonViewer mobile không phá layout.
- [ ] Tree picker mobile dùng được.
- [ ] More menu mobile dùng được.
- [ ] Manual/responsive check đã ghi lại.

---

## 15. Performance Requirements

- [ ] Search input debounce.
- [ ] Autocomplete debounce.
- [ ] Async option load hủy subscription/request khi destroy nếu áp dụng.
- [ ] Không re-render nặng không cần thiết trong table.
- [ ] Large table dùng server-side paging hoặc virtual scroll nếu cần.
- [ ] JSON formatting debounce nếu editable.
- [ ] Collapsed section không render nặng nếu có thể lazy.
- [ ] Drawer detail lazy load nếu data nặng.
- [ ] Backtest detail lazy load từng tab nếu nặng.
- [ ] Tree operations không mutate toàn bộ dữ liệu không cần thiết.
- [ ] Không tạo memory leak từ subscriptions.
- [ ] Không tạo interval/timer không cleanup.
- [ ] Test hoặc review đã check cleanup subscription.

---

## 16. Security / Safety / Data Exposure Requirements

- [ ] Không show secret trong JsonViewer mặc định.
- [ ] Secret field mask value.
- [ ] CopyableText không copy secret nếu không cho phép.
- [ ] Raw API error không expose sensitive stack/token cho user thường.
- [ ] Error detail copy chỉ chứa thông tin được phép.
- [ ] Advanced JSON không lộ dữ liệu nhạy cảm nếu không được phép.
- [ ] Dangerous actions luôn có ConfirmDialog.
- [ ] Delete/reset/evict/stop/cancel action mô tả hậu quả rõ.
- [x] Form submit không double submit.
- [ ] Client-side validation không thay thế server validation, chỉ hỗ trợ UX.
- [ ] Không thêm dependency nguy hiểm không cần thiết.
- [ ] Không disable lint/test để pass giả.

---

## 17. Anti-Shortcut Rules

- [ ] Không dùng `.only` trong test.
- [ ] Không dùng `.skip` trong test mới/sửa nếu không có lý do và issue rõ.
- [ ] Không dùng `fit`.
- [ ] Không dùng `fdescribe`.
- [ ] Không viết test rỗng.
- [ ] Không viết `expect(true).toBe(true)`.
- [ ] Không mock toàn bộ component đến mức test không kiểm tra behavior thật.
- [ ] Không xóa test fail thay vì sửa root cause.
- [ ] Không sửa snapshot bừa để pass.
- [ ] Không tắt lint rule để né lỗi nếu không có lý do.
- [ ] Không dùng `any` lan rộng để né typecheck nếu project TypeScript.
- [ ] Không comment-out code thay vì migrate đúng.
- [ ] Không để TODO/FIXME cho requirement bắt buộc mà vẫn báo done.
- [ ] Không đổi behavior nghiệp vụ ngoài scope UI nếu không cần.
- [ ] Không tạo component duplicate cùng mục đích.
- [ ] Không trộn domain logic vào shared/common.

---

## 18. Test Traceability Matrix

Codex phải điền matrix này trước khi kết thúc. Mỗi file code thay đổi phải có test executable tương ứng hoặc lý do không thể test hợp lệ.

| Code file changed | Requirement IDs/section | Test file added/updated | Test cases added/updated | Command run | Result | Gap/N/A reason |
|---|---|---|---|---|---|---|
| `src/app/shared/ui/base-crud-page/base-crud-page.component.ts` | 8.1, 11.6, 20 | `src/app/shared/ui/base-crud-page/base-crud-page.component.spec.ts` | dirty state proxy, mark pristine, dirty navigation confirm | `$env:VITEST_POOL='threads'; npm.cmd test -- --include=src/app/shared/ui/base-crud-page/base-crud-page.component.spec.ts --include=src/app/features/feature-form-standard.spec.ts --watch=false --reporters=default` | PASS | Covered by targeted + full unit suite |
| `src/app/shared/ui/form-input/form-input.ts`, `src/app/shared/ui/form-input/form-input.html`, `src/app/shared/ui/form-input/component/form-section-card/*`, `src/app/shared/ui/form-input/component/sticky-form-actions/sticky-form-actions.html`, `src/app/shared/ui/base-crud-page/base-crud-page.component.spec.ts` | 8.2, 8.4, 8.6, 8.7, 8.12, 18, 20 | `src/app/shared/ui/form-input/form-input.spec.ts`, `src/app/shared/ui/base-crud-page/base-crud-page.component.spec.ts`, `src/app/shared/ui/forms/config-template-form/config-template-form.component.spec.ts`, `src/app/shared/ui/forms/validation-summary/validation-summary.component.spec.ts` | collapsible advanced sections stay collapsed by default and expand on action; section error indicator; optional invalid submit disable; reset only when dirty and restores initial value; dirty guard skips confirm when pristine and confirms when dirty; min/max/regex/expression/custom/cross-field validation; non-field API alert; summary click scroll/focus; composite field type rendering and unsupported fallback; null/undefined optional values; record validation | `$env:VITEST_POOL='threads'; npm.cmd test -- --include=src/app/shared/ui/form-input/form-input.spec.ts --include=src/app/shared/ui/forms/config-template-form/config-template-form.component.spec.ts --include=src/app/shared/ui/forms/validation-summary/validation-summary.component.spec.ts --include=src/app/shared/ui/base-crud-page/base-crud-page.component.spec.ts --watch=false --reporters=default`; `$env:VITEST_POOL='threads'; npm.cmd test -- --include=src/app/shared/ui/form-input/form-input.spec.ts --watch=false --reporters=default` | PASS | Form suite checkpoint: 4 files, 26 tests passed; field/validation targeted rerun: 1 file, 20 tests passed |
| `src/app/features/admin/**/form/*.component.ts` and `*.html` for AI Agent, Codex Agent, File Storage, Job Scheduler, System Management, Trade Bot config forms | 8.1, 11.6, 16, 20 | `src/app/features/feature-form-standard.spec.ts` | route dirty guard, BaseCrud dirty proxy, mark pristine before navigate, signal loading, route param cleanup, no hard-coded display literal with spaces | `$env:VITEST_POOL='threads'; npm.cmd test -- --include=src/app/features/feature-form-standard.spec.ts --watch=false --reporters=default` | PASS | Static regression covers all standard form shells |
| `src/app/features/admin/*/*.feature.ts` create/edit form routes | 8.1, 11.6, 20 | `src/app/features/feature-form-standard.spec.ts` | every create/edit FormComponent route has `canDeactivate: [unsavedChangesGuard]` | `$env:VITEST_POOL='threads'; npm.cmd test -- --include=src/app/features/feature-form-standard.spec.ts --watch=false --reporters=default` | PASS | Static route regression |
| `src/app/features/admin/data-form/create/create-data-form-page.component.ts` | create-data-form review, 8.2, 20 | `src/app/features/admin/data-form/create/create-data-form-page.component.spec.ts` | create disabled until valid, duplicate form code blocks create, invalid create does not call API | `$env:VITEST_POOL='threads'; npm.cmd test -- --include=src/app/features/admin/data-form/create/create-data-form-page.component.spec.ts --include=src/app/features/feature-form-standard.spec.ts --watch=false --reporters=default` | PASS | Covered by targeted + full unit suite |
| `src/app/core/i18n/features/system-management.i18n.json`, `src/app/core/i18n/features/job-scheduler.i18n.json` | 8.3, 11.6 | `src/app/features/feature-form-standard.spec.ts` | standard form labels/titles/descriptions use translate keys; JSON parsed successfully | `node -e "JSON.parse(...)"` and targeted/full unit suite | PASS | JSON syntax verified and consumed by Angular tests |
| `docs/ui/dynamic-form.md`, `docs/features/data-form.md` | Documentation update | N/A | docs only: CRUD form shell contract and Data Form live submit gate documented | N/A | PASS | Documentation only, no executable behavior |
| `src/app/shared/ui/feedback/{empty-state,error-state,loading-skeleton,alert}/*`, `src/app/shared/ui/shared-ui-foundation.stories.ts` | 3.1, 3.2, 3.3, 3.4, 12 | `src/app/shared/ui/feedback/empty-state/empty-state.component.spec.ts`, `src/app/shared/ui/feedback/error-state/error-state.component.spec.ts`, `src/app/shared/ui/feedback/loading-skeleton/loading-skeleton.component.spec.ts`, `src/app/shared/ui/feedback/alert/alert.component.spec.ts` | title/description/actions/projection/aria, retry/copy detail/error fallback/no stack, skeleton variants/rows/fallback/loading semantics, alert variants/dismiss/action/role; Storybook `FeedbackStates` covers the feedback demo | `$env:VITEST_POOL='threads'; npm.cmd test -- --include=src/app/shared/ui/feedback/empty-state/empty-state.component.spec.ts --include=src/app/shared/ui/feedback/error-state/error-state.component.spec.ts --include=src/app/shared/ui/feedback/loading-skeleton/loading-skeleton.component.spec.ts --include=src/app/shared/ui/feedback/alert/alert.component.spec.ts --watch=false --reporters=default` | PASS | 4 files, 17 tests passed; Storybook build not rerun because no story file changed in this scoped pass |
| `src/app/shared/ui/overlay/{confirm-dialog,drawer}/*`, `src/app/shared/ui/shared-ui-foundation.stories.ts` | 4.1, 4.2, 12, 20 | `src/app/shared/ui/overlay/confirm-dialog/confirm-dialog-host.component.spec.ts`, `src/app/shared/ui/overlay/drawer/drawer.component.spec.ts` | confirm title/message/result/backdrop/escape/action error/focus trap, drawer open-close/projection/size-side/loading-error-empty/backdrop-escape/aria-focus/focus trap; Storybook `ConfirmDialog` and `OverlayAndLayout` cover overlay demos | `$env:VITEST_POOL='threads'; npm.cmd test -- --include=src/app/shared/ui/overlay/confirm-dialog/confirm-dialog-host.component.spec.ts --include=src/app/shared/ui/overlay/drawer/drawer.component.spec.ts --watch=false --reporters=default`; `npm.cmd run build-storybook -- --output-dir .tmp/storybook-overlay-check` | PASS | 2 files, 14 tests passed; Storybook build passed with existing CommonJS/asset-size warnings |
| `src/app/shared/ui/layout/{page-shell,page-header,section-panel,filter-panel,action-toolbar}/*`, `src/app/shared/ui/shared-ui-foundation.stories.ts` | 5.1, 5.2, 5.3, 5.4, 5.5, 12 | `src/app/shared/ui/layout/page-shell/page-shell.component.spec.ts`, `src/app/shared/ui/layout/page-header/page-header.component.spec.ts`, `src/app/shared/ui/layout/section-panel/section-panel.component.spec.ts`, `src/app/shared/ui/layout/filter-panel/filter-panel.component.spec.ts`, `src/app/shared/ui/layout/action-toolbar/action-toolbar.component.spec.ts` | page shell slots/loading/error/empty, page header title/breadcrumb/status/actions/back, section collapse/error/loading/empty, filter apply/reset/clear/count/async retry/debounce, action toolbar click/disabled/more/confirm/permission; Storybook `OverlayAndLayout` covers layout demo | `$env:VITEST_POOL='threads'; npm.cmd test -- --include=src/app/shared/ui/layout/page-shell/page-shell.component.spec.ts --include=src/app/shared/ui/layout/page-header/page-header.component.spec.ts --include=src/app/shared/ui/layout/section-panel/section-panel.component.spec.ts --include=src/app/shared/ui/layout/filter-panel/filter-panel.component.spec.ts --include=src/app/shared/ui/layout/action-toolbar/action-toolbar.component.spec.ts --watch=false --reporters=default` | PASS | 5 files, 17 tests passed |
| `src/app/shared/ui/data-display/{badge,copyable-text,key-value-list,json-viewer,diff-viewer,timeline,value-display}/*`, `src/app/shared/ui/summary-metric-card/*`, `src/app/shared/ui/shared-ui-foundation.stories.ts` | 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 12, 16 | `src/app/shared/ui/data-display/badge/badge.component.spec.ts`, `src/app/shared/ui/data-display/copyable-text/copyable-text.component.spec.ts`, `src/app/shared/ui/data-display/key-value-list/key-value-list.component.spec.ts`, `src/app/shared/ui/data-display/json-viewer/json-viewer.component.spec.ts`, `src/app/shared/ui/data-display/diff-viewer/diff-viewer.component.spec.ts`, `src/app/shared/ui/data-display/timeline/timeline.component.spec.ts`, `src/app/shared/ui/data-display/value-display/value-display.component.spec.ts`, `src/app/shared/ui/summary-metric-card/summary-metric-card.component.spec.ts` | generic badge variants/icon/fallback, copy real value/fallback/null/secret block, key-value generic formats, JSON format/raw/copy/collapse/null/secret mask, diff rows/empty/circular fallback, timeline event/empty/action/loading/error, value/metric loading-empty-error-trend; Storybook `DataDisplay` covers demo | `$env:VITEST_POOL='threads'; npm.cmd test -- --include=src/app/shared/ui/data-display/badge/badge.component.spec.ts --include=src/app/shared/ui/data-display/copyable-text/copyable-text.component.spec.ts --include=src/app/shared/ui/data-display/key-value-list/key-value-list.component.spec.ts --include=src/app/shared/ui/data-display/json-viewer/json-viewer.component.spec.ts --include=src/app/shared/ui/data-display/diff-viewer/diff-viewer.component.spec.ts --include=src/app/shared/ui/data-display/timeline/timeline.component.spec.ts --include=src/app/shared/ui/data-display/value-display/value-display.component.spec.ts --include=src/app/shared/ui/summary-metric-card/summary-metric-card.component.spec.ts --watch=false --reporters=default` | PASS | 8 files, 32 tests passed; JsonViewer editable/apply marked N/A because json-field-block owns editable form JSON |
| `src/app/shared/ui/table/**`, `src/app/features/feature-template-safety.spec.ts`, `src/app/shared/ui/table/table.stories.ts`, `src/app/shared/ui/shared-ui-foundation.stories.ts` | 7.1-7.12, 12, 20 | `src/app/shared/ui/table/component/table/table.spec.ts`, `src/app/shared/ui/table/component/table/table-cell/table-cell.spec.ts`, `src/app/shared/ui/table/component/table/table-filter/table-filter.spec.ts`, `src/app/shared/ui/table/component/table/base-paged-list.spec.ts`, `src/app/features/feature-template-safety.spec.ts` | table state/events/persisted visibility/density/filter empty/bulk confirm/permissions, cell generic types/json drawer/copy/custom template/action confirm/stopPropagation, filter debounce/url sync/chips, BasePagedList duplicate suppression/query sync, migrated feature list uses shared `app-table`; Storybook table demos covered | `$env:VITEST_POOL='threads'; npm.cmd test -- --include=src/app/shared/ui/table/component/table/table.spec.ts --include=src/app/shared/ui/table/component/table/table-cell/table-cell.spec.ts --include=src/app/shared/ui/table/component/table/table-filter/table-filter.spec.ts --include=src/app/shared/ui/table/component/table/base-paged-list.spec.ts --watch=false --reporters=default`; `$env:VITEST_POOL='threads'; npm.cmd test -- --include=src/app/features/feature-template-safety.spec.ts --watch=false --reporters=default` | PASS | Table suite: 4 files, 31 tests passed after fixing two added custom-template test issues; feature-template-safety: 1 file, 5 tests passed after path assertion was normalized |
| `src/app/shared/ui/form-input/component/field-tree-renderer/field-tree-renderer.ts`, `src/app/shared/ui/form-input/form-input.ts`, `src/app/shared/ui/form-input/utils/expression.engine.ts` | 9.1, 9.2, 9.6, 9.7, 9.10, 9.13, 9.14, 9.15, 20 | `src/app/shared/ui/form-input/component/field-tree-renderer/field-tree-renderer.spec.ts`, `src/app/shared/ui/form-input/form-input.spec.ts`, `src/app/shared/ui/form-input/utils/expression.engine.spec.ts` | tree method guards for readonly/destructive disabled state; empty tree state; disabled picker option guard; replace preserves children; move boundary disable; duplicate creates new id; invalid JSON preserves current tree; Advanced JSON apply reruns shared form validation; shared tree domain fallback removal (`ruleCode`/`indicatorCode`); generic tree helper flatten/count/depth/duplicate/disabled/find/null-safe/partial-node coverage; expression helper runtime error coverage | `$env:VITEST_POOL='threads'; npm.cmd test -- --include=src/app/shared/ui/form-input/component/field-tree-renderer/field-tree-renderer.spec.ts --include=src/app/shared/ui/form-input/form-input.spec.ts --include=src/app/shared/ui/form-input/utils/expression.engine.spec.ts --watch=false --reporters=default`; `$env:VITEST_POOL='threads'; npm.cmd test -- --watch=false --reporters=default`; `npm.cmd run build -- --output-path .tmp/build-tree-check` | PASS | Targeted command 27: 3 files, 36 tests passed after domain fallback removal. Previous full suite: 72 files, 253 tests passed. Build passed before latest domain fallback removal; rerun build before global PASS. Remaining tree gap is mobile/responsive manual or visual check. |
| `src/app/shared/ui/realtime-progress-bar/realtime-progress-bar.component.ts`, `src/app/shared/ui/realtime-progress-bar/realtime-progress-bar.component.html`, `src/app/shared/ui/realtime-progress-bar/realtime-progress-bar.component.css` | 10.1, 10.2, 10.3 | `src/app/shared/ui/realtime-progress-bar/realtime-progress-bar.component.spec.ts` | generic progress state model, legacy normalization, queued/running/completed/failed/cancelled states, percent/current/total/step/message/error render, indeterminate mode, cancel/retry/view detail emits, responsive stable progress bar review | `$env:VITEST_POOL='threads'; npm.cmd test -- --watch=false --reporters=default` | PASS | Full suite command 25 includes realtime progress coverage; startedAt/updatedAt, error copy-detail, and cancel ConfirmDialog are N/A for current shared component contract. |
| `src/app/shared/ui/form-input/form-input.stories.ts`, `src/app/shared/ui/realtime-progress-bar/realtime-progress-bar.stories.ts` | 12 | Storybook build | form story covers sections, validation, field types and tree field; realtime story now covers queued/running indeterminate/completed/failed/cancelled states | `npm.cmd run build-storybook -- --output-dir .tmp/storybook-progress-check` | PASS_WITH_WARNINGS | Build completed; warnings are existing Storybook/CommonJS and asset-size warnings. |

### 18.1. Quy tắc matrix

- [ ] Mọi file code thay đổi đều có dòng trong matrix.
- [ ] Mọi component mới đều có test file.
- [ ] Mọi service/helper/validator mới đều có unit test.
- [ ] Mọi component public có render test.
- [ ] Mọi component có interaction có interaction test.
- [ ] Mọi bug fix có regression test.
- [ ] Mọi migration feature page có regression/component/manual check ghi rõ.
- [x] Không có dòng matrix để trống.
- [x] Không có `TODO` còn lại trong matrix khi báo PASS.

---

## 19. Required Test Command Gate

Codex phải detect script thực tế trong repo. Nếu script tồn tại, phải chạy.

### 19.1. Package manager detection

- [x] Nếu có `pnpm-lock.yaml`, dùng pnpm.
  N/A reason: repo không có `pnpm-lock.yaml`.
- [x] Nếu có `yarn.lock`, dùng yarn.
  N/A reason: repo không có `yarn.lock`.
- [x] Nếu có `package-lock.json`, dùng npm.
- [x] Nếu có `bun.lockb` hoặc `bun.lock`, dùng bun nếu repo dùng bun.
  N/A reason: repo không có `bun.lockb` hoặc `bun.lock`.
- [x] Không tự đổi package manager.
- [x] Không tự update lockfile ngoài scope nếu không cần.

### 19.2. Commands phải chạy nếu script tồn tại

- [x] Install/check dependency nếu cần và được phép.
  N/A reason: dependency đã có sẵn, không cần install để chạy test/build.
- [x] Targeted unit test cho component/helper đã sửa.
- [x] Targeted integration/component test cho feature đã migrate nếu có.
- [x] Full relevant unit test suite.
- [x] Lint.
  N/A reason: package.json không có script lint.
- [x] Typecheck.
  N/A reason: package.json không có script typecheck; `ng build` đã chạy compiler/type check.
- [x] Build.
  Evidence: latest app build verified by `npm.cmd run build -- --output-path .tmp/build-tree-check` (PASS).
- [x] Storybook build hoặc demo smoke nếu có script và thay đổi ảnh hưởng story/demo.
  Evidence: overlay scoped story update verified by `npm.cmd run build-storybook -- --output-dir .tmp/storybook-overlay-check` (PASS with existing CommonJS/asset-size warnings).
- [x] E2E/smoke test nếu repo có script và flow bị ảnh hưởng.
  N/A reason: package.json không có e2e script; scope được cover bằng unit/static regression/build.

### 19.3. Command result log

Điền trước khi kết thúc:

```text
Package manager: npm 11.8.0 via packageManager/package-lock.json
Framework: Angular 21.1.x, NgModule/non-standalone app conventions
Test framework: Vitest through ng test

Commands run:
1. $env:VITEST_POOL='threads'; npm.cmd test -- --include=src/app/features/feature-form-standard.spec.ts --watch=false --reporters=default
   Result: PASS
   Notes/output summary: 1 file, 6 tests passed.

2. $env:VITEST_POOL='threads'; npm.cmd test -- --include=src/app/features/admin/data-form/create/create-data-form-page.component.spec.ts --include=src/app/features/feature-form-standard.spec.ts --watch=false --reporters=default
   Result: PASS
   Notes/output summary: 2 files, 9 tests passed.

3. $env:VITEST_POOL='threads'; npm.cmd test -- --watch=false --reporters=default
   Result: PASS
   Notes/output summary: 69 files, 216 tests passed.

4. npm.cmd run build -- --output-path .tmp/build-form-standard-final-check
   Result: PASS with warnings
   Notes/output summary: Angular build completed. Existing budget warnings: initial bundle 3.89 MB > 3.50 MB by 393.59 kB; candle-chart.css 7.93 KB > 4 KB; field-tree-renderer.css 6.50 KB > 4 KB; side-menu.component.scss 5.13 KB > 4 KB.

5. Lint/typecheck
   Result: N/A
   Notes/output summary: package.json has no lint or typecheck script; Angular build covers compiler/type errors.

6. $env:VITEST_POOL='threads'; npm.cmd test -- --include=src/app/shared/ui/feedback/empty-state/empty-state.component.spec.ts --include=src/app/shared/ui/feedback/error-state/error-state.component.spec.ts --include=src/app/shared/ui/feedback/loading-skeleton/loading-skeleton.component.spec.ts --include=src/app/shared/ui/feedback/alert/alert.component.spec.ts --watch=false --reporters=default
   Result: PASS
   Notes/output summary: 4 files, 17 tests passed.

7. $env:VITEST_POOL='threads'; npm.cmd test -- --include=src/app/shared/ui/overlay/confirm-dialog/confirm-dialog-host.component.spec.ts --include=src/app/shared/ui/overlay/drawer/drawer.component.spec.ts --watch=false --reporters=default
   Result: PASS
   Notes/output summary: 2 files, 14 tests passed. First rerun failed after an invalid story host was added; story was corrected to render through ActionToolbar confirm config, then this command passed.

8. npm.cmd run build-storybook -- --output-dir .tmp/storybook-overlay-check
   Result: PASS with warnings
   Notes/output summary: Storybook build completed. Existing warnings: CommonJS dependencies from Storybook addons/manager and asset-size/entrypoint-size warnings for existing static assets/bundles.

9. $env:VITEST_POOL='threads'; npm.cmd test -- --include=src/app/shared/ui/layout/page-shell/page-shell.component.spec.ts --include=src/app/shared/ui/layout/page-header/page-header.component.spec.ts --include=src/app/shared/ui/layout/section-panel/section-panel.component.spec.ts --include=src/app/shared/ui/layout/filter-panel/filter-panel.component.spec.ts --include=src/app/shared/ui/layout/action-toolbar/action-toolbar.component.spec.ts --watch=false --reporters=default
   Result: PASS
   Notes/output summary: 5 files, 17 tests passed.

10. $env:VITEST_POOL='threads'; npm.cmd test -- --include=src/app/shared/ui/data-display/badge/badge.component.spec.ts --include=src/app/shared/ui/data-display/copyable-text/copyable-text.component.spec.ts --include=src/app/shared/ui/data-display/key-value-list/key-value-list.component.spec.ts --include=src/app/shared/ui/data-display/json-viewer/json-viewer.component.spec.ts --include=src/app/shared/ui/data-display/diff-viewer/diff-viewer.component.spec.ts --include=src/app/shared/ui/data-display/timeline/timeline.component.spec.ts --include=src/app/shared/ui/data-display/value-display/value-display.component.spec.ts --include=src/app/shared/ui/summary-metric-card/summary-metric-card.component.spec.ts --watch=false --reporters=default
    Result: PASS
    Notes/output summary: 8 files, 32 tests passed.

11. $env:VITEST_POOL='threads'; npm.cmd test -- --include=src/app/shared/ui/table/component/table/table.spec.ts --include=src/app/shared/ui/table/component/table/table-cell/table-cell.spec.ts --include=src/app/shared/ui/table/component/table/table-filter/table-filter.spec.ts --include=src/app/shared/ui/table/component/table/base-paged-list.spec.ts --watch=false --reporters=default
    Result: PASS
    Notes/output summary: 4 files, 31 tests passed. Earlier reruns failed while adding the custom-template regression; the fixture setup and template assignment were corrected before this pass.

12. $env:VITEST_POOL='threads'; npm.cmd test -- --include=src/app/features/feature-template-safety.spec.ts --watch=false --reporters=default
    Result: PASS
    Notes/output summary: 1 file, 5 tests passed. Earlier rerun failed because the glob path assertion was too exact; assertion now uses `endsWith`.

13. $env:VITEST_POOL='threads'; npm.cmd test -- --watch=false --reporters=default
    Result: PASS
    Notes/output summary: 71 files, 235 tests passed.

14. npm.cmd run build -- --output-path .tmp/build-foundation-table-check
    Result: PASS with warnings
    Notes/output summary: Angular build completed. Existing budget warnings: initial bundle 3.91 MB > 3.50 MB by 414.70 kB; field-tree-renderer.css 6.50 KB > 4 KB; candle-chart.css 7.93 KB > 4 KB; side-menu.component.scss 5.13 KB > 4 KB.

15. $env:VITEST_POOL='threads'; npm.cmd test -- --include=src/app/shared/ui/form-input/form-input.spec.ts --include=src/app/shared/ui/forms/config-template-form/config-template-form.component.spec.ts --include=src/app/shared/ui/forms/validation-summary/validation-summary.component.spec.ts --include=src/app/shared/ui/base-crud-page/base-crud-page.component.spec.ts --watch=false --reporters=default
    Result: PASS
    Notes/output summary: 4 files, 26 tests passed. Added coverage for collapsible advanced form sections, section error indicator, opt-in invalid submit disable, reset dirty restore, pristine dirty guard behavior, validation rule coverage, non-field API alert, and ValidationSummary scroll/focus behavior.

16. $env:VITEST_POOL='threads'; npm.cmd test -- --watch=false --reporters=default
    Result: PASS
    Notes/output summary: 71 files, 240 tests passed.

17. npm.cmd run build -- --output-path .tmp/build-form-shared-check
    Result: PASS with warnings
    Notes/output summary: Angular build completed. Existing budget warnings: initial bundle 3.92 MB > 3.50 MB by 415.77 kB; candle-chart.css 7.93 KB > 4 KB; field-tree-renderer.css 6.50 KB > 4 KB; side-menu.component.scss 5.13 KB > 4 KB.

18. $env:VITEST_POOL='threads'; npm.cmd test -- --include=src/app/shared/ui/form-input/form-input.spec.ts --watch=false --reporters=default
    Result: PASS
    Notes/output summary: 1 file, 20 tests passed. Added coverage for composite field type rendering: array, record, tree, secret-metadata and unsupported fallback; null/undefined optional values; record validation through the shared form engine.

19. $env:VITEST_POOL='threads'; npm.cmd test -- --watch=false --reporters=default
    Result: PASS
    Notes/output summary: 71 files, 242 tests passed.

20. $env:VITEST_POOL='threads'; npm.cmd test -- --include=src/app/shared/ui/form-input/component/field-tree-renderer/field-tree-renderer.spec.ts --include=src/app/shared/ui/form-input/utils/expression.engine.spec.ts --watch=false --reporters=default
    Result: PASS
    Notes/output summary: 2 files, 13 tests passed. Added tree readonly/destructive-action guards, replace/move/duplicate regressions, advanced JSON invalid-preserves-tree coverage, and generic tree helper coverage.

21. $env:VITEST_POOL='threads'; npm.cmd test -- --watch=false --reporters=default
    Result: PASS
    Notes/output summary: 72 files, 250 tests passed.

22. npm.cmd run build -- --output-path .tmp/build-tree-check
    Result: PASS
    Notes/output summary: Angular build completed successfully to .tmp/build-tree-check.

23. $env:VITEST_POOL='threads'; npm.cmd test -- --include=src/app/shared/ui/form-input/component/field-tree-renderer/field-tree-renderer.spec.ts --include=src/app/shared/ui/form-input/form-input.spec.ts --include=src/app/shared/ui/form-input/utils/expression.engine.spec.ts --watch=false --reporters=default
    Result: FAIL
    Notes/output summary: 1 test failed because the new Advanced JSON validation regression used expression semantics backwards (`true` means invalid in this form engine). The test expression was corrected from `<= 1` to `> 1`.

24. $env:VITEST_POOL='threads'; npm.cmd test -- --include=src/app/shared/ui/form-input/component/field-tree-renderer/field-tree-renderer.spec.ts --include=src/app/shared/ui/form-input/form-input.spec.ts --include=src/app/shared/ui/form-input/utils/expression.engine.spec.ts --watch=false --reporters=default
    Result: PASS
    Notes/output summary: 3 files, 36 tests passed. Added empty tree state, disabled picker option, and Advanced JSON shared validation rerun coverage.

25. $env:VITEST_POOL='threads'; npm.cmd test -- --watch=false --reporters=default
    Result: PASS
    Notes/output summary: 72 files, 253 tests passed.

26. npm.cmd run build-storybook -- --output-dir .tmp/storybook-progress-check
    Result: PASS with warnings
    Notes/output summary: Storybook build completed. Existing warnings: CommonJS dependencies from Storybook/axe/semver and asset-size/entrypoint-size warnings for existing static assets/bundles.

27. $env:VITEST_POOL='threads'; npm.cmd test -- --include=src/app/shared/ui/form-input/component/field-tree-renderer/field-tree-renderer.spec.ts --include=src/app/shared/ui/form-input/form-input.spec.ts --include=src/app/shared/ui/form-input/utils/expression.engine.spec.ts --watch=false --reporters=default
    Result: PASS
    Notes/output summary: 3 files, 36 tests passed after removing shared tree domain-specific `ruleCode`/`indicatorCode` fallbacks.

28. $env:VITEST_POOL='threads'; npm.cmd test -- --watch=false --reporters=default
    Result: PASS
    Notes/output summary: 72 files, 253 tests passed before the shared/component spec gap was closed.

29. npm.cmd run build -- --output-path .tmp/build-current-shared-component-audit
    Result: PASS
    Notes/output summary: Angular build completed successfully.

30. npm.cmd run build-storybook -- --output-dir .tmp/storybook-current-shared-component-audit
    Result: PASS with warnings
    Notes/output summary: Storybook build completed. Existing warnings: Storybook CommonJS dependencies and existing asset/entrypoint size warnings.

31. $env:VITEST_POOL='threads'; npm.cmd test -- --include=src/app/shared/component/auto-complete/auto-complete.spec.ts --include=src/app/shared/component/input-multi/input-multi.spec.ts --include=src/app/shared/component/json-preview/json-preview.component.spec.ts --include=src/app/shared/component/panel/panel.component.spec.ts --include=src/app/shared/component/prime-table/prime-table.component.spec.ts --include=src/app/shared/component/progress-spinner/progress-spinner.component.spec.ts --include=src/app/shared/component/tabs/tabs.component.spec.ts --include=src/app/shared/component/tag/tag.spec.ts --include=src/app/shared/component/timeline-wrapper/timeline.component.spec.ts --watch=false --reporters=default
    Result: FAIL then PASS
    Notes/output summary: First run failed on a TypeScript generic applied to `fixture.nativeElement.querySelectorAll`; `tabs.component.spec.ts` was corrected. Rerun passed: 9 files, 12 tests.

32. $env:VITEST_POOL='threads'; npm.cmd test -- --watch=false --reporters=default
    Result: PASS
    Notes/output summary: 81 files, 265 tests passed after adding shared/component specs.

33. npm.cmd run build -- --output-path .tmp/build-shared-component-spec-check
    Result: PASS
    Notes/output summary: Angular build completed successfully after adding shared/component specs.

34. Get-ChildItem -Directory src\app\shared\component | ForEach-Object { $name=$_.Name; $hasSpec = Get-ChildItem $_.FullName -Filter *.spec.ts -File -ErrorAction SilentlyContinue; if (-not $hasSpec) { $name } }
    Result: PASS
    Notes/output summary: no output; every directory under `shared/component` now has a colocated spec file.

35. $env:VITEST_POOL='threads'; npm.cmd test -- --include=src/app/shared/component/base-input.spec.ts --include=src/app/shared/component/button-split/button-split.spec.ts --include=src/app/shared/component/fileupload/fileupload.spec.ts --include=src/app/shared/component/input-area/input-area.spec.ts --include=src/app/shared/component/paginator/paginator.spec.ts --watch=false --reporters=default
    Result: PASS
    Notes/output summary: 5 files, 11 tests passed. Added BaseInput CVA/event coverage plus split button, paginator, file upload, and input area behavior coverage.

36. $env:VITEST_POOL='threads'; npm.cmd test -- --watch=false --reporters=default
    Result: PASS
    Notes/output summary: 82 files, 272 tests passed after shared/component behavior coverage updates.

37. rg -n '\.(only|skip)\(|\bfit\(|\bfdescribe\(|expect\(true\)\.toBe\(true\)|TODO|FIXME' src/app/shared/component --glob '*.spec.ts'
    Result: PASS
    Notes/output summary: no output; shared/component specs contain no focused/skipped tests, placeholder `expect(true)`, TODO, or FIXME.

38. npm.cmd run build -- --output-path .tmp/build-shared-component-coverage-check
    Result: PASS
    Notes/output summary: Angular build completed successfully after shared/component coverage updates.

39. $env:VITEST_POOL='threads'; npm.cmd test -- --include=src/app/shared/ui/card/card.component.spec.ts --include=src/app/shared/ui/feedback/skeleton-card/skeleton-card.component.spec.ts --include=src/app/shared/ui/feedback/skeleton-form/skeleton-form.component.spec.ts --include=src/app/shared/ui/feedback/skeleton-table/skeleton-table.component.spec.ts --include=src/app/shared/ui/field-guide-panel/field-guide-panel.component.spec.ts --include=src/app/shared/ui/form-input/component/field-block/field-block.spec.ts --include=src/app/shared/ui/form-input/component/form-section-card/form-section-card.spec.ts --include=src/app/shared/ui/form-input/component/form-section-nav/form-section-nav.spec.ts --include=src/app/shared/ui/form-input/component/form-status-panel/form-status-panel.spec.ts --include=src/app/shared/ui/form-input/component/json-field-block/json-field-block.spec.ts --include=src/app/shared/ui/form-input/component/readonly-field/readonly-field.spec.ts --include=src/app/shared/ui/form-input/component/readonly-section/readonly-section.spec.ts --include=src/app/shared/ui/form-input/component/smart-form-shell/smart-form-shell.spec.ts --include=src/app/shared/ui/form-input/component/sticky-form-actions/sticky-form-actions.spec.ts --watch=false --reporters=default
    Result: PASS
    Notes/output summary: 14 files, 18 tests passed. Added missing colocated specs for shared/ui card, skeleton wrappers, field guide panel, and form-input shell/subcomponents.

40. Shared/ui spec coverage audit: Get-ChildItem over `src/app/shared/ui` component files excluding models/utils/stories/specs/guards, then print files whose directory has no `*.spec.ts`.
    Result: PASS
    Notes/output summary: no output; every audited shared/ui component directory now has a colocated spec.

41. $env:VITEST_POOL='threads'; npm.cmd test -- --watch=false --reporters=default
    Result: PASS
    Notes/output summary: 96 files, 290 tests passed after shared/ui spec coverage updates.

42. npm.cmd run build -- --output-path .tmp/build-shared-ui-spec-check
    Result: PASS
    Notes/output summary: Angular build completed successfully after shared/ui spec coverage updates.
```

- [x] Đã ghi package manager.
- [x] Đã ghi framework.
- [x] Đã ghi test framework.
- [x] Đã ghi từng command chạy.
- [x] Đã ghi result từng command.
- [x] Nếu command fail rồi sửa, đã ghi command rerun pass.
- [x] Nếu command blocked, đã ghi output lỗi cụ thể.
  N/A reason: không có command bị blocked trong checkpoint hiện tại.

---

## 20. Regression Checklist cuối cùng

- [x] Build thành công.
- [ ] Lint không lỗi.
  N/A reason: package.json không có script lint; không có command lint executable để chạy trong repo hiện tại.
- [x] Unit test pass.
- [x] Integration/component test pass nếu có.
- [ ] E2E/smoke pass nếu có và liên quan.
- [ ] Không có import cycle mới.
- [ ] Không có shared/ui import feature module.
- [ ] Không có shared/component import shared/ui.
- [ ] Không có common import domain model/service.
- [ ] Các route hiện có vẫn mở được.
- [ ] Các list vẫn paging được.
- [ ] Các list vẫn filter được.
- [ ] Các list vẫn sort được nếu trước đó có sort.
- [ ] Các form create vẫn save được.
- [ ] Các form edit vẫn save được.
- [x] Các form dirty cancel có confirm.
- [ ] Các action delete/reset/cancel/evict/stop có confirm.
- [ ] API lỗi hiển thị ErrorState hoặc Alert.
- [ ] Loading không trắng màn.
- [ ] Empty data có hướng dẫn tiếp theo.
- [ ] JSON raw không lộ mặc định ở màn chính.
- [ ] Drawer detail mở/đóng đúng.
- [ ] ConfirmDialog cancel không thực hiện action.
- [ ] ConfirmDialog confirm thực hiện action đúng.
- [ ] Responsive check cơ bản pass.
- [ ] Accessibility check cơ bản pass.
- [ ] Không có unrelated file changes.

---

## 21. Completion Report bắt buộc của Codex

Codex phải điền phần này trước khi trả lời cuối.

### 21.1. Scope completed

- [x] Components added/updated: `BaseCrudPageComponent`; feature create/edit form components using `app-base-crud-page`; `CreateDataFormPageComponent`.
- [x] Feature pages migrated: AI Agent forms, Codex Agent form, Upload Storage form, Job Scheduler form, System Management config/secret forms, Trade Bot config forms, Create Data Form submit gate.
- [x] Helpers/services/validators added/updated: route guard wiring, i18n keys for System Management/Job Scheduler form labels, static regression helpers in `feature-form-standard.spec.ts`.
- [x] Tests added/updated: `feature-form-standard.spec.ts`, `base-crud-page.component.spec.ts`, `create-data-form-page.component.spec.ts`, header spec compatibility from earlier rerun.
- [x] Files changed reviewed: scoped form-standard diff reviewed; unrelated pre-existing dirty files were not reverted.
- [x] Shared form checkpoint updated: collapsible form sections, advanced collapsed default regression, dirty reset restore, reset button dirty enablement, validation engine coverage, field type coverage, non-field API alert, and ValidationSummary scroll/focus coverage.
- [x] Tree field checkpoint updated: `FieldTreeRendererComponent` now guards readonly/destructive disabled mutation paths at method level; tree helper unit coverage added for generic validation helpers and expression helper integration; empty tree, disabled picker option, and Advanced JSON validation rerun coverage added.
- [x] Realtime progress checkpoint reviewed: generic `RealtimeProgressBarComponent` implementation/spec cover model, statuses, emitted actions, indeterminate state, and responsive stable progress bar; optional timestamp/error-copy/confirm behavior documented as N/A for current contract; Storybook states expanded and build verified.
- [x] Shared/component primitive spec checkpoint updated: added colocated executable specs for `AutoComplete`, `InputMulti`, `JsonPreviewComponent`, `PanelComponent`, `PrimeTableComponent`, `ProgressSpinnerComponent`, `TabsComponent`, `Tag`, and legacy `TimelineComponent`; verified every `shared/component` directory has a spec.
- [x] Shared/component behavior coverage checkpoint updated: added `BaseInput` CVA/event tests and behavior coverage for `ButtonSplit`, `Fileupload`, `InputArea`, and `Paginator`; full suite and build verified after the update.
- [x] Shared/ui spec coverage checkpoint updated: added colocated specs for `CardComponent`, skeleton wrappers, `FieldGuidePanelComponent`, and form-input shell/subcomponents (`FieldBlockComponent`, `FormSectionCardComponent`, `FormSectionNavComponent`, `FormStatusPanelComponent`, `JsonFieldBlockComponent`, `ReadonlyFieldComponent`, `ReadonlySectionComponent`, `SmartFormShellComponent`, `StickyFormActionsComponent`); audit confirms no shared/ui component directory is missing a spec.

### 21.2. Checklist status

- [x] Total required sections reviewed: Sections 6.4, 8, 9.7, 9.10, 9.13, 9.14, 9.15, 10, 11.6, 12, 16, 18, 19, 20 plus Create Data Form review notes.
- [x] Unchecked required items remaining: 734 global unchecked items remain outside the current shared-form/tree-field/realtime/storybook/shared-component-spec/shared-ui-spec checkpoint after this update.
- [x] N/A items with reason: lint/typecheck noted as no-script; E2E not run because package.json has no e2e script. Storybook build was rerun for the current shared/component checkpoint.
- [x] Blocked items with proof: none for the form-standard scope.
- [x] Test matrix completed: completed for the current form-standard scope rows in section 18.

### 21.3. Final test status

- [x] Targeted tests: PASS
- [x] Full tests: PASS, latest rerun 96 files / 290 tests
- [x] Lint: NO_SCRIPT
- [x] Typecheck: NO_SCRIPT, covered by Angular build compiler/type check
- [x] Build: PASS
- [x] Storybook/demo/e2e if applicable: Storybook current shared/component audit build PASS with existing Storybook CommonJS and asset-size warnings; E2E has no package script.

### 21.4. Final verdict

Chỉ chọn một:

- [ ] PASS — tất cả requirement bắt buộc đã làm, test pass, không còn gap.
- [ ] BLOCKED — có blocker ngoài repo, đã ghi proof và phần chưa verify.
- [ ] FAIL — còn requirement/test gap, không được gọi là done.

Current scoped verdict: shared-form/tree-field/realtime/storybook/shared-component-spec/shared-ui-spec checkpoint PASS; global checklist PASS is not claimed because 734 unchecked global items remain.

Nếu verdict là PASS, Codex phải đảm bảo:

- [ ] Không còn `TODO` trong Completion Report.
- [ ] Không còn `TODO` trong Test Traceability Matrix.
- [ ] Không còn checkbox bắt buộc chưa tick nếu không có N/A/BLOCKED reason.
- [ ] Không còn test/lint/type/build fail.
- [ ] Không còn test case thiếu cho code đã đổi.

---

## 22. Prompt dùng khi Codex đã dừng sớm và làm thiếu test

Dùng prompt này để bắt Codex quay lại audit và hoàn thành test thiếu:

```text
Bạn đã dừng sớm khi còn thiếu test case và chưa thỏa Definition of Done.
Không được tiếp tục code mới ngay.
Trước tiên hãy:
1. Đọc FULL_SYSTEM_REQUIREMENTS_DONE_CHECKLIST.md.
2. Audit toàn bộ diff hiện tại.
3. Điền Test Traceability Matrix cho mọi file code đã thay đổi.
4. Xác định mọi requirement đã sửa code nhưng chưa có executable test.
5. Tạo/cập nhật test thật cho từng gap.
6. Chạy targeted tests.
7. Sửa lỗi test nếu fail rồi chạy lại.
8. Chạy full relevant tests, lint, typecheck, build nếu script tồn tại.
9. Chỉ báo PASS nếu toàn bộ checklist liên quan đã tick và command pass.

Không được chỉ viết checklist Markdown.
Không được bỏ qua test vì task dài.
Không được nói done nếu còn test gap.
```

---

## 23. Final System Done Gate

Hệ thống chỉ được đánh dấu done khi toàn bộ dòng dưới đây được tick:

- [ ] Architecture done.
- [ ] Shared feedback done.
- [ ] Shared overlay done.
- [ ] Shared layout done.
- [ ] Shared data-display done.
- [ ] Shared table done.
- [ ] Shared form done.
- [ ] Tree field done.
- [ ] Realtime progress done nếu áp dụng.
- [ ] Dashboard migration done nếu route tồn tại.
- [ ] Market Data migration done nếu route tồn tại.
- [ ] Indicator Config List migration done nếu route tồn tại.
- [ ] Rule Config List migration done nếu route tồn tại.
- [ ] Strategy Config List migration done nếu route tồn tại.
- [ ] Config Forms migration done nếu route tồn tại.
- [ ] Backtest List migration done nếu route tồn tại.
- [ ] Backtest Detail migration done nếu route tồn tại.
- [ ] Paper Trade migration done nếu route tồn tại.
- [ ] System Logs migration done nếu route tồn tại.
- [ ] Cache Monitor migration done nếu route tồn tại.
- [ ] Storybook/demo done hoặc N/A có lý do.
- [ ] Accessibility baseline done.
- [ ] Responsive baseline done.
- [ ] Performance baseline done.
- [ ] Security/data exposure baseline done.
- [ ] Anti-shortcut check done.
- [ ] Test Traceability Matrix complete.
- [ ] Required Test Command Gate complete.
- [ ] Regression Checklist complete.
- [ ] Completion Report complete.
- [ ] Final verdict is PASS.

Nếu còn bất kỳ dòng nào phía trên chưa tick hoặc chưa có N/A/BLOCKED reason hợp lệ thì **HỆ THỐNG CHƯA DONE**.
