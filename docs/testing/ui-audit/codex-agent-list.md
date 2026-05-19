# Codex Agent List UI Audit Checklist

Route: `/admin/codex-agent/agents`

Evidence:
- Before screenshots: `.tmp/audit-codex-agent-list.png`, `.tmp/audit-codex-agent-list-mobile.png`
- Fixed screenshots: `.tmp/audit-codex-agent-list-after.png`, `.tmp/audit-codex-agent-list-mobile-after.png`
- Browser check: `http://localhost:4200/admin/codex-agent/agents`
- Test account was used only in Playwright session; credentials are not stored in this checklist.

## Checklist

- [x] Page loads after Keycloak login on `localhost:4200`.
- [x] Sidebar active state and breadcrumb identify the Codex Agent list screen.
- [x] Backend list failure renders a visible translated error state instead of an empty table.
- [x] Retry action is clickable and keeps the screen in a valid retry flow.
- [x] Create action is clickable and routes to `/admin/codex-agent/agents/create`.
- [x] Error panel, retry action, and create action remain readable on mobile without the broken empty-table layout.
- [x] List title, create button, error title, and error message use i18n keys instead of hard-coded English.

## Issues Fixed

- API failure was displayed as an empty table, which hid the actual loading failure from users.
- Mobile rendered an empty table shell when the list request failed.
- Vietnamese list title used the generic `Danh sách agent`, which was ambiguous beside AI Agent screens.

## Remaining Notes

- Codex Agent backend can still be unavailable in this local environment. The list now exposes that as an explicit retryable error state.
