# AI Model List UI Audit Checklist

Route: `/admin/ai-agent/models`

Evidence:
- Before screenshots: `.tmp/audit-ai-model-list.png`, `.tmp/audit-ai-model-list-mobile.png`
- Fixed screenshots: `.tmp/audit-ai-model-list-after.png`, `.tmp/audit-ai-model-list-mobile-after.png`
- Browser check: `http://localhost:4200/admin/ai-agent/models`
- Test account was used only in Playwright session; credentials are not stored in this checklist.

## Checklist

- [x] Page loads after Keycloak login on `localhost:4200`.
- [x] Sidebar active state and breadcrumb identify the AI Model screen.
- [x] Backend list failure renders a visible translated error state instead of an empty table.
- [x] Retry action is clickable and keeps the screen in a valid retry flow.
- [x] Create action is clickable and routes to `/admin/ai-agent/models/create`.
- [x] Error panel, retry action, and create action remain readable on mobile without horizontal page overflow.
- [x] List title, create button, error title, and error message use Vietnamese i18n text with accents.

## Issues Fixed

- API failure was displayed as `Không có dữ liệu phù hợp`, which hid the real backend loading failure.
- Mobile showed the empty-table state instead of a retryable error panel.
- Vietnamese labels were missing accents, for example `Them AI model`, `Ten model`, `Loai model`, and `Ho tro tool`.

## Remaining Notes

- AI Model backend is unavailable in this local environment, so row actions for existing models (`Thử prompt`, edit, delete) could not be exercised on real rows.
