# indicator-config

Indicator config dùng dynamic form từ metadata `indicator-executors` để người dùng cấu hình bằng UI thay vì nhập JSON trực tiếp. Indicator thường lấy field nghiệp vụ từ `formTemplate`; raw JSON chỉ còn là fallback Advanced JSON khi executor chưa có template. Composite indicator không nhập config trực tiếp; màn form render selector child indicator theo metadata từ backend.

## Composite Indicator

- Backend `indicator-executors` trả `usesConfig=false` và `childSlots` cho executor composite như `ZIGZAG`.
- Form ẩn `formTemplateText`, `configText`, `childrenText` khi `usesConfig=false`.
- Mỗi `childSlot` render một select hoặc multi-select, option lấy từ danh sách indicator config có executor thuộc `acceptedExecutors`.
- Payload gửi `config={}` và `children=[{ slotCode, indicatorCode, config:{} }]`.
- Ví dụ `ZIGZAG` chọn một `PIVOT_HIGH` config và một `PIVOT_LOW` config; mỗi config con vẫn giữ tham số riêng như `left/right`.

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

