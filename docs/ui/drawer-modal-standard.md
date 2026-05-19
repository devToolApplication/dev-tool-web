# drawer-modal-standard

Drawer/modal dùng cho task phụ, confirm destructive action, focus/close state rõ, không lồng card vô nghĩa.

Overlay phải render ở tầng cao hơn app shell/menu. Shared popup mặc định append vào `body`; shared drawer tự đưa overlay node ra `document.body` khi mở để không bị kẹt dưới stacking context của page content.

## Checklist

- Dùng token/shared layer.
- Không native control/table cho nghiệp vụ.
- Text đi qua translate.
- Responsive và overflow an toàn.


