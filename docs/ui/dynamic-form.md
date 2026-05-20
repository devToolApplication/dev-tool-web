# dynamic-form

Form nghiệp vụ dùng `shared/ui/form-input`, `FormConfig`, validation rules và translate key. Không dùng native input/select/textarea trực tiếp trong feature page.

## Decision: form engine

`app-form-input` là canonical rendering engine cho mọi `FormConfig` trong feature page và CRUD flow. Các màn nghiệp vụ nên đi qua `BaseCrudPage` hoặc render trực tiếp `app-form-input` khi không cần CRUD shell.

`app-config-template-form` chỉ là wrapper tiện ích cho màn standalone/demo cần nhận `FormConfig` + value + vùng Advanced JSON trong một component. Không dùng wrapper này như engine thứ hai trong indicator/rule/strategy feature; nếu cần behavior mới, thêm vào `app-form-input` trước.

## CRUD form shell

Feature create/edit form dùng `app-base-crud-page` phải expose dirty contract cho `unsavedChangesGuard`:

- Route create/edit khai báo `canDeactivate: [unsavedChangesGuard]`.
- Component form proxy `hasUnsavedChanges()` và `confirmDiscardChanges()` về `BaseCrudPageComponent`.
- Save thành công phải gọi `markFormPristine()` trước khi navigate khỏi màn.
- Loading/submitting state dùng `signal`, template/action config đọc bằng `loading()` hoặc `submitting()`.
- Subscription dài hạn như `route.paramMap` phải cleanup bằng `takeUntilDestroyed(this.destroyRef)`.
- Label/title/description/action text trong `FormConfig` và page config phải là translate key, không hard-code chuỗi hiển thị.
- Content phụ trợ trước toàn bộ form dùng slot `[crud-page-before-form]`; content cần nằm ngay sau section đầu tiên của `app-form-input` dùng slot `[crud-page-after-first-section]`.

## Smart Form Layout

`FormConfig` hỗ trợ `sections`, `layout`, `actions` và `field.sectionId`. Config cũ không có `sections` vẫn render bằng Smart Form layout với section `shared.form.section.general` tự sinh.

- Save không disable chỉ vì form invalid; submit invalid sẽ mark touched, hiện validation summary và scroll tới field lỗi đầu tiên.
- `context.mode = 'view'` mặc định render readonly detail view thay vì disabled inputs.
- JSON/code field render qua toolbar riêng trong `app-json-field-block`.
- Shared primitive phải giữ help text cả khi field invalid để user biết cách sửa lỗi.

## Domain data options

`shared/ui/form-input` không được import feature service hoặc gọi API nghiệp vụ trực tiếp. Field cần option động từ backend phải khai báo `optionsSource` trong `FormConfig`; feature module đăng ký loader qua `FORM_INPUT_OPTIONS_LOADERS` và tự map DTO/domain response sang `SelectOption`.

Ví dụ hiện tại:

- `AI_AGENT_USER_SECRETS_OPTIONS_SOURCE` map active AI agent user secrets trong `features/form-input-options-loaders.ts`.
- `STORAGE_USER_SECRETS_OPTIONS_SOURCE` map active storage user secrets trong `features/form-input-options-loaders.ts`.
- `field-secret-metadata-renderer` chỉ đọc `optionsSource` và gọi loader generic, không biết `AiAgentSecretUserService` hoặc `StorageSecretUserService`.
- Với field lặp lại đã có dữ liệu trong hệ thống như `category`, `key`, `configGroup` hoặc `scopeRef`, feature form phải load dữ liệu hiện có qua service feature và truyền vào `context.extra` để render `auto-complete`. Người dùng chỉ nhập tay khi tạo giá trị mới hoặc khi backend không trả option.
- Với AI Agent config scoped theo `AGENT` hoặc `MODEL`, `scopeRef` phải ưu tiên option lấy từ agent/model hiện có; các scope chưa có API danh mục thì dùng auto-complete từ scopeRef đã tồn tại và vẫn cho nhập tay.
- Với field có thể derive cục bộ như timezone, form phải sinh option từ API trình duyệt/runtime và render bằng `auto-complete` để vẫn cho nhập tay timezone custom khi runtime không trả danh mục.
- Với field phụ thuộc dữ liệu đã có như model type hoặc endpoint URL, form phải ưu tiên option từ bản ghi hiện có và chỉ để nhập tay khi cần model/URL mới.
- Với field lấy lại từ danh sách cùng màn như CDP endpoint, temporary chat URL, API domain hoặc API path, page phải map bản ghi đã load thành option cho `auto-complete`; không bắt người dùng gõ lại dữ liệu đã tồn tại.
- Với Job Scheduler, các field có thể tái sử dụng từ job hiện có hoặc hằng số domain như cron, target URL, username, API key header, Keycloak base URL/realm/clientId/scope/token field/header phải render bằng `auto-complete`; password, API key value và client secret vẫn nhập tay vì là dữ liệu bí mật.
- Với field có option runtime hoặc danh sách hệ thống sẵn có như AI model name, Codex installation ID, CDP test model hoặc cache name, form phải render bằng `auto-complete`; các field định danh mới như code/name vẫn nhập tay.

Với trade bot config form:

- Indicator/Rule/Strategy dùng `app-form-input` qua `app-base-crud-page`.
- Executor `formTemplate` chỉ cung cấp phần field nghiệp vụ; common section như overlay có thể được feature thêm ngoài template khi cần.
- Raw JSON chỉ nằm trong Advanced/collapsed hoặc sandbox/debug flow.

## Tree Field

`type: 'tree'` render qua `app-field-tree-renderer`, không render native tree/control trong feature page.

- Search mặc định hỗ trợ label, code/key và full path, không phân biệt hoa thường, đồng thời giữ parent context khi filter.
- Toolbar hỗ trợ expand all, collapse all, expand selected và select visible khi `selectionMode: 'checkbox'`.
- Checkbox tree dùng tri-state; `selectStrategy` hỗ trợ `all`, `leafOnly`, `parentAndChildren`.
- `showSelectedPanel: true` hiển thị selected panel bên phải trên desktop và stack xuống dưới trên mobile.
- Tree state dùng `treeConfig.loading`, `treeConfig.error`, empty state và search-empty state của shared UI.
- Node action nghiệp vụ gom vào action drawer để row không bị rối; action nguy hiểm vẫn đi qua confirm service.

## Checklist

- Dùng token/shared layer.
- Không native control/table cho nghiệp vụ.
- Text đi qua translate.
- Responsive và overflow an toàn.


