# Admin Web Documentation

Đây là điểm đọc đầu tiên trước khi sửa `dev-tool-web`.

## Repo Scope

Angular admin frontend cho Trade Bot, Job Scheduler và các công cụ quản trị. Repo dùng NgModule, `standalone: false`, shared layer và feature-owned data access/state.

## Docs-First Rule

Trước khi sửa code:

1. Đọc file này.
2. Đọc `docs/architecture/folder-structure.md`.
3. Đọc tài liệu feature/UI/development liên quan.
4. Nếu docs lệch code, cập nhật docs cùng thay đổi.

## Documentation Map

```text
docs/architecture  kiến trúc, folder, routing, state, API, realtime, component boundary
docs/features      spec từng feature/page nghiệp vụ
docs/ui            design system, token, shared component/ui, table, form, chart, state UI
docs/development   coding standard và flow thêm mới
docs/testing       checklist test component/store/e2e
docs/runbooks      troubleshoot vận hành FE
```

## Required Reading Matrix

| Task | Docs phải đọc |
|---|---|
| Thêm page Trade Bot | `architecture/folder-structure.md`, `features/trade-bot-management.md`, `development/add-new-page.md` |
| Sửa chart/overlay | `architecture/chart-overlay.md`, `ui/chart-standard.md`, `features/realtime-chart.md` |
| Sửa API client | `architecture/api-client.md`, `development/add-new-api-service.md` |
| Sửa state/store | `architecture/state-management.md`, `development/add-new-store.md` |
| Sửa shared component/ui | `ui/shared-component-standard.md`, `ui/shared-ui-standard.md`, `architecture/component-file-standard.md` |
| Sửa Job Scheduler | `features/job-scheduler.md`, `architecture/api-client.md` |

## Merge Checklist

- Không tạo standalone component mới.
- Feature owns data-access/state/page code.
- `core` chỉ chứa singleton/global concern.
- `shared` domain-free; trading reusable UI ở `trade-bot-management/shared-trading`.
- Không hard-code color/spacing/radius/shadow trong component.
- UI nghiệp vụ dùng shared component/ui, không dựng native control/table trực tiếp.
- Mọi label/message/empty/error/loading/aria text đi qua translate.
- Chạy `npm.cmd run build` và test phù hợp trước khi merge.
