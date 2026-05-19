# Data Form

Màn `Create Data Form` dùng để tạo mới cấu hình biểu mẫu từ JSON, không có form builder kéo thả, canvas, inspector, field library, preview, draft hay publish.

## Route

```text
/admin/data-forms/create
```

`/admin/data-forms` hiện là màn placeholder cho list; sau khi create thành công, frontend điều hướng về route này.

Route create có `permissionGuard` với quyền `FORM_CONFIG_CREATE`. Component tiếp tục kiểm tra quyền thao tác hiện tại để khóa Create, Import, Export và JSON editor theo các quyền:

- `FORM_CONFIG_CREATE`
- `FORM_CONFIG_UPDATE`
- `FORM_CONFIG_IMPORT`
- `FORM_CONFIG_EXPORT`

## UI Contract

- Layout gồm Page Header, Left Sidebar, Main Content, Right Sidebar và Sticky Footer.
- Left Sidebar chỉ điều hướng section và báo lỗi theo section.
- Main Content gồm General Information, JSON Configuration, Parsed Config Summary, Validation Result, Permission và Audit Info.
- JSON editor dùng `app-input-area` với `contentType="json"` để có CodeMirror syntax highlight, line number và zoom.
- Không có Save Draft, Auto Save Draft, Publish, Preview, Canvas, Inspector hay Field Library.

## Validation

- Frontend validate General Information, JSON syntax và schema structure trước khi gọi API.
- Frontend check trùng `formCode` qua API `check-code` khi validate/create; nếu backend trả validation error ở path `formCode`, lỗi cũng được map về field.
- Nếu JSON root có `formCode` hoặc `formName`, giá trị phải khớp với field ngoài màn.
- Nút Create bị disable theo trạng thái live: đang tạo, đang check code, thiếu quyền create, hoặc còn Critical Error ở General/JSON/schema/backend validation.
- Critical Errors chặn Create.
- Warnings cho Create nhưng cần confirm.
- Suggestions chỉ hiển thị để tối ưu.
- Backend vẫn phải validate lại toàn bộ request.

## API

Create gọi:

```text
POST {bpmEngineAdminUrl}/data-forms
```

Payload gồm `formName`, `formCode`, `description`, `status`, `jsonConfig` và `permissions`.

Check mã biểu mẫu gọi:

```text
GET {bpmEngineAdminUrl}/data-forms/check-code?formCode={formCode}
```

Response có thể là boolean trực tiếp, hoặc object/base response có `exists`, `duplicated`, hoặc `available`.
