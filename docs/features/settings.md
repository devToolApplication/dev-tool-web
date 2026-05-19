# settings

Settings quản lý giao diện ứng dụng, ngôn ngữ hiển thị và theme token tùy chỉnh.

## Source Ownership

- Page/container: `src/app/features/settings`.
- Theme mode/preset state: `src/app/core/ui-services/theme.service.ts`.
- Theme token customization: `src/app/core/ui-services/theme-customizer.service.ts`.
- Translation keys: `src/app/core/i18n/features/settings.i18n.json`.

## UI Requirements

- Screen dùng `app-page-shell`, summary cards và tab để người dùng quét nhanh cấu hình hiện tại.
- General tab quản lý dark mode, appearance mode, preset và language bằng shared controls.
- Theme tab render token editor từ metadata thay vì lặp template thủ công; mỗi token có swatch, giá trị hiện tại, preset selector và ô nhập CSS tùy chỉnh.
- Mọi label, placeholder, action text và trạng thái phải có đủ `vi/en`.

## Checklist

- Không dùng standalone component mới.
- Không dùng native form/control primitives cho UI nghiệp vụ.
- UI state tương tác dùng signal/computed.
- Dùng token/utility thay vì hard-code color.
- Có test cho đổi tab, đổi mode, đổi ngôn ngữ, cập nhật/reset token.
