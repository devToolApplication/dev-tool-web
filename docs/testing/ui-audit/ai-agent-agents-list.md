# AI Agent Agents List UI Audit Checklist

Route: `/admin/ai-agent/agents`

Evidence:
- Before screenshots: `.tmp/audit-ai-agent-agents-list.png`, `.tmp/audit-ai-agent-agents-list-mobile.png`
- Fixed screenshots: `.tmp/audit-ai-agent-agents-list-after.png`, `.tmp/audit-ai-agent-agents-list-mobile-after.png`
- Browser check: `http://localhost:4200/admin/ai-agent/agents`
- Test account was used only in Playwright session; credentials are not stored in this checklist.

## Checklist

- [x] Page loads after Keycloak login on `localhost:4200`.
- [x] Sidebar active state and breadcrumb identify the Agents screen.
- [x] Backend list failure renders a visible translated error state instead of an empty table.
- [x] Retry action is clickable and keeps the screen in a valid error/retry flow.
- [x] Create action is clickable and routes to `/admin/ai-agent/agents/create`.
- [x] Primary action, error panel, and retry button remain readable on mobile without the broken empty-table layout.
- [x] List title, create button, error title, and error message use i18n keys instead of hard-coded English.

## Issues Fixed

- API failure was displayed as `Không có dữ liệu phù hợp`, which misled users into thinking the list was empty.
- Mobile rendered an empty table shell with only the actions column visible when backend loading failed.
- List title, create label, column labels, filter labels, and row action labels were hard-coded in English.

## Remaining Notes

- AI Agent backend still fails with `ERR_CONNECTION_REFUSED` in this environment. The list now exposes that as an explicit retryable error state.
