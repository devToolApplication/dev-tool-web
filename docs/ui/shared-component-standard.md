# shared-component-standard

`shared/component` chứa primitive nhỏ/wrapper PrimeNG/lib. Shared component mới cần Storybook.

## Logical Groups

Giữ path hiện tại dạng `src/app/shared/component/<component-name>` để không phá import public. Việc "gom nhóm" được thể hiện bằng taxonomy trong docs, `SharedModule` registry và Storybook title.

| Group | Scope | Components hiện tại |
|---|---|---|
| Actions | Nút và action launcher | `Button`, `ButtonSplit`, `ButtonSpeedDial` |
| Form Controls | Control nhập liệu/chọn giá trị | `AutoComplete`, `CheckBox`, `DatePicker`, `Fileupload`, `InputArea`, `InputMulti`, `InputNumber`, `InputText`, `Password`, `RadioButton`, `Select`, `SelectButton`, `SelectMulti`, `SelectTree`, `ToggleButton`, `ToggleSwitch` |
| Navigation | Điều hướng/phan trang/chuyển tab | `Breadcrumb`, `Paginator`, `TabsComponent` |
| Data Display | Primitive hiển thị dữ liệu hoặc wrapper compatibility | `JsonPreviewComponent`, `PanelComponent`, `PrimeTableComponent`, `Tag`, `TimelineComponent` |
| Feedback Overlay | Feedback nhỏ và overlay compatibility | `ProgressSpinnerComponent`, `BasePopupComponent` |

Shared component mới phải chọn đúng group, khai báo trong group registry tương ứng của `SharedModule`, và Storybook title theo format `Shared/Components/<Group>/<Component>`.

## Checklist

- Dùng token/shared layer.
- Không native control/table cho nghiệp vụ.
- Text đi qua translate.
- Responsive và overflow an toàn.
- Shared component có group rõ ràng trong docs, `SharedModule` và Storybook.


