# table-standard

List nghiệp vụ dùng `shared/ui/table`, typed columns, paging/filter/sort, overflow safe, loading/empty/error state.

## Checklist

- Dùng token/shared layer.
- Không native control/table cho nghiệp vụ.
- Text đi qua translate.
- Responsive và overflow an toàn.
- Server-side list dùng `BasePagedList` phải sync `page`, `size` và `sort` vào URL; sort dùng format compact `sort=field:asc` hoặc `sort=field:desc`, restore lại `sortField/sortOrder` khi mở deep link.
- Table selection phải cấu hình key ổn định bằng `rowKey` hoặc `dataKey`; nếu không có sẽ fallback `id`, `_id`, `uuid` trước khi dùng index hiện tại.


