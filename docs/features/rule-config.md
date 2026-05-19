# rule-config

Rule config dùng dynamic form từ metadata `rule-executors` để người dùng cấu hình bằng UI thay vì nhập JSON trực tiếp.

## Dynamic Form

- Form lấy `formTemplate` từ executor metadata hoặc detail response.
- `formTemplate` chỉ cần mô tả phần `config` nghiệp vụ của executor.
- Màn rule tự thêm các phần chung nếu template chưa khai báo: `indicators`, `childRules` dạng tree builder và `overlay` dạng key-value record.
- Raw `configText` chỉ còn trong nhóm Advanced JSON đã collapse khi executor chưa có `formTemplate`.
- Không còn render các field legacy `formTemplateText`, `indicatorsText`, `childRulesText`, `overlayText` trên màn form chính.

## Source Ownership

- Page/container: feature pages hoặc feature folder tương ứng.
- API/model: data-access/api, data-access/models.
- Store/state: state.
- Reusable trading UI: 	rade-bot-management/shared-trading.

## Checklist

- Feature owns business code.
- UI uses shared layer and translate.
- API contract typed.
- Loading/error/empty states covered.

