# dev-tool-web — Shared UI In-place Rewrite Plan

## Mục tiêu

Bộ plan này áp dụng cho repository `devToolApplication/dev-tool-web`, tập trung vào shared UI hiện tại và các feature đang dùng nó.

Đây là **breaking rewrite tại chỗ**.

Không có chiến lược:

- `v1` + `v2` chạy song song.
- `ButtonV2`, `FormInputV2`, `TableV2`.
- `tokens-v2.css`.
- adapter để duy trì hai UI contract trong thời gian dài.
- giữ visual cũ chỉ để tránh sửa consumer.

Thay vào đó:

1. sửa trực tiếp component hiện tại;
2. thay contract nếu contract hiện tại sai;
3. migrate tất cả consumer bị ảnh hưởng trong cùng phase hoặc ngay phase kế tiếp;
4. xóa code cũ ngay khi consumer cuối cùng đã migrate;
5. branch phải luôn kết thúc ở trạng thái build/test được trước khi merge.

## Nguyên tắc kiến trúc

### Shared UI chỉ xử lý UI

Shared component không được trực tiếp biết:

- API response model của application;
- permission service;
- feature service;
- localStorage key mang nghĩa business;
- CSV/export workflow;
- routing workflow của một feature cụ thể;
- CRUD orchestration.

Feature/page chịu trách nhiệm orchestration.

### Một responsibility, một layer

```text
Feature Page
  -> Page/Layout composition
    -> UI Pattern
      -> Primitive
        -> Design Token
```

Ví dụ form:

```text
JobEditPage
  -> PageShell
    -> FormInput
      -> FieldRenderer (internal)
        -> FormField
          -> InputText
```

### Không nested shell

Không chấp nhận:

```text
PageShell
  -> BaseCrudPage
    -> SmartFormShell
      -> FormSectionCard
```

Mục tiêu là:

```text
PageShell
  -> FormInput
  -> StickyFormActions
```

hoặc với form dài:

```text
PageShell
  -> FormSectionNav
  -> FormInput
  -> StickyFormActions
```

### Visual direction

- neutral-first, text-first;
- giảm glass, glow, gradient, shadow;
- card chỉ cho independent surface;
- form section dùng typography + spacing + divider;
- một primary action nổi bật;
- semantic color chỉ dùng cho status/alert/error/destructive;
- mobile được thiết kế lại, không squeeze desktop.

## Phase order

| Phase | File | Trọng tâm |
|---|---|---|
| 01 | `phase-01-foundation-tokens-primitives.md` | Token, Button, base control contract |
| 02 | `phase-02-form-field-foundation.md` | FormField + input/select/checkbox/date UX |
| 03 | `phase-03-form-engine-in-place-rewrite.md` | Rewrite FormInput + schema + section + validation |
| 04 | `phase-04-crud-page-and-page-composition.md` | Xóa BaseCrudPage, sửa PageShell/PageHeader/action composition |
| 05 | `phase-05-complex-form-fields.md` | Array/Record/Tree/Secret/JSON/Code fields |
| 06 | `phase-06-table-in-place-rewrite.md` | Table architecture, mobile, accessibility |
| 07 | `phase-07-overlay-layout-feedback.md` | Drawer/Dialog/Confirm + SectionPanel/Card/Feedback |
| 08 | `phase-08-feature-migration-and-removal.md` | Migrate feature, xóa wrapper/duplicate/legacy |
| 09 | `phase-09-storybook-tests-public-api.md` | Storybook matrix, regression, public API cleanup |

## Merge rule

Một phase không được merge nếu:

- component contract mới đã merge nhưng consumer chính vẫn dùng contract cũ;
- còn import compile-time tới component đã đánh dấu xóa trong phase đó;
- Storybook primary stories fail;
- accessibility regressions mới xuất hiện;
- dark theme hoặc mobile viewport bị vỡ ở component vừa sửa;
- có cả implementation cũ và implementation mới cùng cung cấp một responsibility.

## Branch strategy gợi ý

Không cần một PR duy nhất khổng lồ. Có thể dùng một branch umbrella hoặc các PR tuần tự, nhưng **main/master không bao giờ chứa v1 và v2 song song**.

Ví dụ:

```text
shared-ui-rewrite/01-foundation
shared-ui-rewrite/02-form-field
shared-ui-rewrite/03-form-engine
...
```

Mỗi branch bắt đầu từ phase trước đã hoàn tất.


## AI Execution Guide

Phần này là **execution contract dành cho AI coding agent** thực hiện bộ plan. Các file phase mô tả design intent và target architecture; AI phải dùng source code thực tế trong repository làm nguồn sự thật cuối cùng về dependency, usage và compile impact.

### 1. Thứ tự tài liệu AI bắt buộc phải đọc

Trước khi sửa code ở một phase, AI phải đọc theo thứ tự:

```text
1. README.md này
2. file phase đang thực hiện
3. Definition of Done của phase trước
4. source code hiện tại của các component nằm trong scope
5. tất cả consumer trực tiếp của component/type/API sẽ thay đổi
6. test + Storybook story hiện tại liên quan
```

Không được đọc riêng pseudocode trong phase rồi implement mù theo pseudocode.

Pseudocode trong plan là **target behavior / target boundary**, không phải source code để copy nguyên xi.

### 2. Nguyên tắc bắt buộc: rewrite v1 tại chỗ

AI **KHÔNG ĐƯỢC** tạo một implementation thứ hai để giảm công migrate.

Cấm các pattern sau:

```text
ButtonV2
FormInputV2
TableV2
NewFormInput
LegacyFormInput + FormInput mới
v2/
tokens-v2.css
useNewUi flag
legacyMode flag
compatibilityMode flag
```

Cũng không được lách quy tắc bằng cách:

- giữ component cũ nhưng đổi tên thành `Legacy*`;
- tạo adapter lâu dài chỉ để contract cũ tiếp tục tồn tại;
- export cả API cũ và API mới;
- giữ selector cũ trỏ vào implementation legacy;
- copy component sang folder mới rồi để component cũ nguyên trạng;
- thêm feature flag để hai design cùng chạy;
- thêm `any`, type assertion hoặc disable test để tránh migrate consumer.

Nếu contract phải breaking thì sửa **contract hiện tại**, sau đó migrate consumer bị ảnh hưởng.

### 3. Workflow AI phải thực hiện cho mỗi phase

Mỗi phase được thực hiện theo vòng lặp sau:

```text
READ
  -> INSPECT
    -> IMPACT MAP
      -> IMPLEMENT
        -> MIGRATE CONSUMERS
          -> DELETE OBSOLETE CODE
            -> TEST
              -> SEARCH FOR LEGACY
                -> REVIEW DIFF
                  -> DONE
```

#### Step A — Inspect repository trước khi sửa

AI phải xác định tối thiểu:

- component/type/file nào thuộc scope;
- component selector và public export hiện tại;
- component nào import/use chúng;
- feature page nào là consumer thực tế;
- test/story nào bảo vệ behavior hiện tại;
- dependency từ shared UI sang `core`, auth, HTTP hoặc feature layer;
- CSS token/class nào đang được reuse ngoài component.

Dùng repository search thay vì đoán.

Ví dụ:

```bash
rg "BaseCrudPage|app-base-crud-page" src
rg "FormInput|app-form-input" src
rg "SmartFormShell|app-smart-form-shell" src
rg "TableComponent|app-table" src
rg "--app-" src/theme src/app
```

Nếu rename type/selector/path, search cả tên cũ lẫn selector cũ trước khi bắt đầu và sau khi hoàn tất.

#### Step B — Tạo impact map ngắn trước khi code

AI cần tự xác định một impact map dạng:

```text
Change:
  BaseInput contract

Direct impact:
  InputText
  InputArea
  InputNumber
  Select
  DatePicker

Feature impact:
  Job form
  Service resource form

Tests/stories:
  base-input.spec.ts
  input stories
  form-input.spec.ts
```

Không cần tạo file riêng nếu task không yêu cầu, nhưng phải dùng impact map này để tránh sửa component mà bỏ sót consumer.

#### Step C — Implement theo vertical slice

Không rewrite hàng chục component rồi cuối cùng mới build.

Ví dụ Phase 02 nên đi theo slice:

```text
FormField contract
  -> InputText
    -> FormInput renderer integration
      -> một real feature consumer
        -> tests
```

Sau khi slice đầu chạy đúng mới áp cùng contract cho Number/Select/Date/etc.

Mục tiêu là lỗi compile/behavior xuất hiện sớm, không tích lũy đến cuối phase.

#### Step D — Migrate consumer ngay khi contract thay đổi

Khi AI thay public API:

```text
old contract removed
        ↓
all compile-time consumers updated
        ↓
old properties/types/selectors deleted
```

Không được để TODO kiểu:

```ts
// TODO migrate remaining pages later
```

nếu code cũ vẫn cần tồn tại vì TODO đó.

Nếu phase file chỉ định consumer được migrate ở phase kế tiếp, branch hiện tại vẫn phải build được mà **không tạo implementation song song**. Có thể chia commit/PR boundary khác, nhưng repository ở mỗi merge point phải có một contract duy nhất.

#### Step E — Xóa code obsolete, không chỉ ngừng dùng

Sau migration phải search và xóa:

- component không còn consumer;
- model/type cũ;
- CSS class cũ;
- Storybook story của behavior đã bỏ;
- SharedModule/public export cũ;
- translation key chỉ phục vụ UI đã xóa nếu không còn usage;
- tests chỉ test legacy behavior.

Ví dụ khi hoàn thành removal của `BaseCrudPage`:

```bash
rg "BaseCrudPage|app-base-crud-page|base-crud-page" src
```

Kết quả mong muốn phải bằng 0, trừ khi phase document cố ý nhắc tên đó trong docs/test migration fixture.

### 4. Source-of-truth và quyền quyết định của AI

Thứ tự ưu tiên khi có mâu thuẫn:

```text
1. Mục tiêu/constraint trong README
2. Definition of Done + architectural decision trong phase file
3. UX/accessibility rules của project
4. source code và dependency thực tế
5. pseudocode trong phase file
```

AI được phép thay đổi pseudocode nếu Angular API hoặc code thực tế cho thấy cách khác đơn giản/đúng hơn, miễn là:

- giữ đúng responsibility boundary;
- không tạo v1/v2 song song;
- không giảm accessibility;
- không giữ legacy chỉ vì dễ implement;
- test target behavior tương đương hoặc tốt hơn.

Nếu phát hiện plan sai assumption về path hoặc tên component, AI sửa đúng file thực tế thay vì tạo file giả đúng theo plan.

### 5. Quy tắc thay đổi file

AI phải ưu tiên sửa/xóa file hiện hữu trong scope thay vì tạo duplicate.

Được tạo file mới khi file đó đại diện cho responsibility mới đã được plan yêu cầu, ví dụ:

```text
form-field/
content-state/
key-value-editor/
```

Không được tạo file mới chỉ để tránh sửa file cũ.

Khi split một mega component:

```text
old mega component
  -> extract responsibility A
  -> extract responsibility B
  -> rewrite old component thành composition nhỏ
  -> migrate consumers
  -> delete code/path không còn responsibility
```

Không phải:

```text
old mega component giữ nguyên
new mega component chạy song song
```

### 6. Quy tắc test của AI

Repository hiện có các script chính:

```bash
npm run tokens:build
npm run build
npm test -- --watch=false
npm run build-storybook
npm run test-storybook:ci
```

AI phải chạy test theo tầng, không đợi đến cuối toàn bộ chương trình.

#### Inner loop — sau một vertical slice

Chạy test hẹp nhất có thể cho code vừa sửa. Nếu runner không hỗ trợ filter ổn định thì chạy:

```bash
npm test -- --watch=false
```

#### Phase gate — trước khi coi phase hoàn tất

Tối thiểu:

```bash
npm run build
npm test -- --watch=false
npm run build-storybook
```

Nếu phase thay token:

```bash
npm run tokens:build
npm run build
```

Nếu phase thay component có Storybook interaction/a11y story:

```bash
npm run test-storybook:ci
```

`chromatic` có thể phụ thuộc token/network CI nên không phải local hard gate, nhưng visual regression phải được kiểm tra trong pipeline nếu project đã cấu hình.

### 7. Test AI phải bổ sung khi đổi component

Không chỉ sửa test cũ cho xanh. AI phải thêm test cho contract mới.

Mỗi component quan trọng cần cân nhắc đủ các nhóm:

```text
Rendering
State transition
User interaction
Keyboard
Focus
ARIA / accessible name
Disabled / readonly
Validation / error
Loading
Responsive behavior
Dark theme Storybook state
Consumer integration
```

Ví dụ `FormField`:

```ts
it('links label to control')
it('connects help text through aria-describedby')
it('connects error through aria-describedby')
it('sets aria-invalid when invalid')
it('does not clear value after validation error')
```

Ví dụ sortable table header:

```ts
it('renders a real button for sortable header')
it('updates aria-sort')
it('can sort with keyboard')
```

Ví dụ Drawer/Dialog:

```ts
it('moves focus into overlay')
it('traps focus')
it('closes on Escape when allowed')
it('restores focus to trigger')
```

### 8. Visual verification mà AI phải làm

Automated unit test không đủ cho shared UI rewrite.

Với component có visual change, AI phải kiểm tra Storybook ít nhất ở:

```text
light / desktop
light / mobile
 dark / desktop
 dark / mobile
```

Critical states cần story riêng hoặc story args rõ ràng:

```text
default
hover/focus nếu story framework hỗ trợ
invalid
loading
empty
long content
many actions
```

Không chấp nhận chỉ mở happy-path desktop light theme.

### 9. Quy tắc dành riêng cho Form rewrite

AI phải giữ boundary sau:

```text
PageShell
  = page structure

FormInput
  = schema + form state + field rendering

FormField
  = label/help/error/control semantics

Primitive control
  = input interaction only

Feature Page
  = load/save/API/navigation/permission orchestration
```

Nếu code mới khiến `FormInput` bắt đầu biết breadcrumb, page title, router workflow hoặc API service thì implementation đang đi sai hướng.

Nếu primitive bắt đầu biết section/form/page state thì cũng sai hướng.

`BaseCrudPage`, `SmartFormShell`, `FormStatusPanel` không được hồi sinh dưới tên mới.

### 10. Quy tắc dành riêng cho Table rewrite

AI phải tách application concern khỏi table UI.

Table không được trực tiếp import/use:

```text
PermissionService
BasePageResponse
feature service
business localStorage key
CSV business workflow
```

Feature/controller chuẩn bị data/action state rồi truyền vào table.

Mobile behavior phải được implement như một interaction/layout thực sự; không được coi `overflow-x: auto` + `min-width` là responsive solution mặc định.

### 11. Quy tắc dành riêng cho Overlay rewrite

Drawer/Dialog/Confirm phải ưu tiên Angular CDK primitives đã có dependency trong project.

Không tự viết lại nếu CDK đã cung cấp responsibility tương ứng:

```text
focus trap
portal
overlay positioning
scroll strategy
focus restoration support
```

Typed destructive confirmation hiện có giá trị UX thì phải giữ behavior đó trong implementation mới.

### 12. Git/commit discipline cho AI

Nếu AI có quyền Git:

- không làm trực tiếp trên `master`;
- branch theo phase;
- không stage file ngoài scope;
- commit theo coherent vertical slice;
- mỗi commit phải build/test được ở mức hợp lý;
- không trộn formatting toàn repo với architectural rewrite.

Ví dụ commit sequence:

```text
refactor(ui): normalize control tokens and button contract
refactor(form): introduce shared field semantics
refactor(form): simplify form section rendering
refactor(form): migrate job editor off base crud page
refactor(form): remove base crud page legacy code
```

Một commit `rewrite all shared ui` hàng nghìn dòng không có checkpoint không phải execution strategy tốt cho AI.

### 13. AI không được tự coi phase hoàn thành khi

Chỉ compile thành công là chưa đủ.

Phase **chưa hoàn thành** nếu còn một trong các điều sau:

- old selector/type/API vẫn còn consumer;
- component legacy vẫn exported;
- test legacy bị skip thay vì sửa;
- visual mới chỉ hoạt động light desktop;
- keyboard/focus behavior regression;
- duplicate responsibility còn ở hai component;
- temporary compatibility branch/flag vẫn tồn tại;
- TODO migration giữ code cũ sống;
- feature reference implementation chưa chạy theo target composition của phase.

### 14. Output/handoff AI phải trả sau mỗi phase

AI thực hiện phase phải trả report ngắn theo format:

```markdown
## Phase NN completed

### Changed
- ...

### Removed
- ...

### Consumer migrations
- ...

### Tests added/updated
- ...

### Verification
- `npm run build` — PASS
- `npm test -- --watch=false` — PASS
- `npm run build-storybook` — PASS
- `npm run test-storybook:ci` — PASS / NOT REQUIRED / BLOCKED: reason

### Legacy search
- `rg "..." src` — 0 remaining usages

### Remaining risks
- ...
```

Nếu có test không chạy được, AI phải ghi rõ **lệnh**, **lỗi thực tế**, **phạm vi ảnh hưởng**. Không được chỉ ghi “tests should pass”.

### 15. Prompt mẫu để giao một phase cho AI

Có thể dùng prompt này cho Claude Code, Codex hoặc coding agent tương đương:

```text
Implement Phase 03 of the dev-tool-web shared UI rewrite.

Repository: devToolApplication/dev-tool-web
Plan root: dev-tool-web-ui-refactor-plan/

Before editing:
1. Read README.md completely, especially AI Execution Guide.
2. Read phase-03-form-engine-in-place-rewrite.md completely.
3. Inspect the current repository and all direct consumers of the affected APIs.

Hard constraints:
- This is an in-place rewrite of the existing v1.
- Do not create V2 components, parallel implementations, compatibility flags,
  long-lived adapters, or Legacy* replacements.
- When a public contract changes, migrate its consumers and remove the obsolete
  contract/code as part of the work.
- Keep shared UI free of feature/API/permission orchestration.
- Preserve or improve keyboard, focus and accessibility behavior.

Execution:
- Work in vertical slices.
- Run targeted tests during implementation.
- Run the phase verification commands before completion.
- Search for obsolete selectors/types/imports after migration.
- Review the final diff against the phase Definition of Done.

At the end, return the Phase Completion Report format defined in README.md.
Do not mark the phase complete if legacy implementation or consumers remain.
```

Chỉ cần đổi `Phase 03` và tên file tương ứng khi giao phase khác.

### 16. Cách AI xử lý scope lớn hoặc context bị giới hạn

Nếu một phase quá lớn cho một execution session, AI được chia phase thành các **sub-task tuần tự**, nhưng không được thay đổi architecture thành parallel v1/v2.

Ví dụ:

```text
Phase 03A — schema cleanup + section model
Phase 03B — field renderer + section rendering
Phase 03C — validation/navigation/action cleanup
Phase 03D — consumer migration + legacy deletion
```

Mỗi sub-task phải để branch ở trạng thái compile/test hợp lý và sub-task sau tiếp tục trực tiếp trên kết quả trước.

AI phải ghi checkpoint cuối session:

```text
Completed:
Current branch/state:
Tests passing:
Next exact task:
Legacy code intentionally remaining until next sub-task:
```

Dòng cuối chỉ được dùng cho code nằm **trong cùng phase đang dở**, không phải lý do để merge song song implementation cũ/mới vào master.

## Definition of Done toàn chương trình

- `BaseCrudPage` bị xóa.
- `SmartFormShell` bị xóa.
- `FormStatusPanel` bị xóa.
- `FormSectionCard` không còn card-heavy UX; nếu rename thành `FormSection`, toàn bộ consumer đã migrate.
- `FormInput` không quản page title/page shell/CRUD orchestration.
- complex field renderer không còn làm generic form engine phình vô hạn.
- Table không import application auth/http models.
- Drawer/Dialog/Confirm dùng Angular CDK overlay/focus primitives.
- shared public API không export internal renderer/cell/filter implementation.
- Storybook có light/dark/mobile cho foundation và critical patterns.
- keyboard + focus + error semantics có automated coverage.
