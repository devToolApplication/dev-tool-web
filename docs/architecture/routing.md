# routing

Route admin phải khai báo trong feature registry hoặc route file hiện có. Giữ alias route cũ khi đổi vị trí feature, ví dụ Job Scheduler giữ `/admin/system-management/jobs` nếu FE/user còn dùng.

Root `AppRoutes` chỉ lazy-load `AppFeatureModule`; các route nghiệp vụ được gom trong
`FEATURE_ROUTES` của `src/app/features/app-feature.module.ts` để tránh kéo toàn bộ page
feature vào initial bundle. Khi thêm route mới, khai báo route ở feature file như hiện tại
rồi thêm route array vào `FEATURE_ROUTES` nếu đó là feature group mới.

## Required Checks

- Đọc tài liệu này trước khi sửa khu vực liên quan.
- Cập nhật docs nếu folder, route, API contract hoặc shared boundary thay đổi.
- Không move/xóa path public khi chưa có compatibility wrapper hoặc alias.


