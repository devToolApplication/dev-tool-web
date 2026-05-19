# table-standard

List nghiệp vụ dùng `shared/ui/table`, typed columns, paging/filter/sort, overflow safe, loading/empty/error state.

## Checklist

- Dùng token/shared layer.
- Không native control/table cho nghiệp vụ.
- Text đi qua translate.
- Responsive và overflow an toàn.
- Server-side list dùng `BasePagedList` phải sync `page`, `size` và `sort` vào URL; sort dùng format compact `sort=field:asc` hoặc `sort=field:desc`, restore lại `sortField/sortOrder` khi mở deep link.
- Table selection phải cấu hình key ổn định bằng `rowKey` hoặc `dataKey`; nếu không có sẽ fallback `id`, `_id`, `uuid` trước khi dùng index hiện tại.
- Export CSV phải ghi rõ scope: `scope: 'current-page'` để table tự tải CSV cho dữ liệu đang render, còn export theo filter/toàn bộ dữ liệu dùng scope mặc định `external` và page owner xử lý qua `(export)`. Event `(export)` phải nhận đủ `filters`, `sortField`, `sortOrder`, `visibleColumns` và `rows`; khi request export đang chạy, page set `toolbar.export.loading`.
- Row action chỉ hiển thị 1 primary action inline; các action còn lại tự vào menu more. Danger action phải dùng `variant: 'danger'` hoặc `severity: 'danger'` để shared table tự bật confirm mặc định khi chưa khai báo confirm riêng.
- Không đặt document listener trên từng cell; Escape chỉ xử lý tại menu/table/overlay đang focus để tránh nhiều global listener trên bảng lớn.
- Filter drawer phải validate trước khi apply/search: date range không được đảo chiều, number range phải `min <= max`, rule trong `TableFilterField.validation` được render inline và không phát `(search)` khi invalid.
- Với màn trace/debug, route mở detail phải sync key lựa chọn lên URL query param để share/deep-link được; khi không tìm thấy record phải hiển thị error state thay vì để drawer trống.
- Payload JSON trong Playground/Execution Trace phải parse thành object trước khi truyền vào `app-json-viewer`; chỉ truyền raw text khi parse lỗi để viewer báo invalid/fallback đúng. JSON viewer phải hỗ trợ search theo path/value và copy path hoặc value của node khi debug payload.
- Playground request đang chạy phải có cancel action; component giữ subscription hiện tại, chặn double submit và unsubscribe khi user hủy hoặc component destroy.
- Playground khi có output/trace phải chuyển sang workspace 2 cột trên desktop: config/input ở trái, result/trace ở phải; màn nhỏ giữ layout một cột.
- Pure/shared UI component nên dùng `ChangeDetectionStrategy.OnPush` khi state đến từ `@Input`, `signal` hoặc output event. Ưu tiên các component render nhiều trong table như `TableComponent`, `TableCellComponent`, `TableFilterComponent`, badge, skeleton, JSON viewer, key-value list và timeline.
