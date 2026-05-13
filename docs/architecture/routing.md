# routing

Route admin phải khai báo trong feature registry hoặc route file hiện có. Giữ alias route cũ khi đổi vị trí feature, ví dụ Job Scheduler giữ `/admin/system-management/jobs` nếu FE/user còn dùng.

## Required Checks

- Đọc tài liệu này trước khi sửa khu vực liên quan.
- Cập nhật docs nếu folder, route, API contract hoặc shared boundary thay đổi.
- Không move/xóa path public khi chưa có compatibility wrapper hoặc alias.


