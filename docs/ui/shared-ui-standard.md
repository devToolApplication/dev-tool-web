# shared-ui-standard

`shared/ui` chứa block UI domain-free, có thể compose nhiều primitive và được reuse nhiều feature.

## Checklist

- Dùng token/shared layer.
- Không native control/table cho nghiệp vụ.
- Text đi qua translate.
- Responsive và overflow an toàn.
- Không import feature module/model/service hoặc core service nghiệp vụ trong `shared/ui`.
- Data option có nguồn nghiệp vụ phải đi qua provider generic, ví dụ `FORM_INPUT_OPTIONS_LOADERS`; feature chịu trách nhiệm gọi API và map DTO sang model common.


