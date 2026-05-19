# Prompt Template List UI Audit Checklist

Route: `/admin/ai-agent/prompt-templates`

Evidence:
- Before screenshots: `.tmp/audit-prompt-template-list.png`, `.tmp/audit-prompt-template-list-mobile.png`
- Fixed screenshots: `.tmp/audit-prompt-template-list-after.png`, `.tmp/audit-prompt-template-list-mobile-after.png`
- Browser check: `http://localhost:4200/admin/ai-agent/prompt-templates`
- Test account was used only in Playwright session; credentials are not stored in this checklist.

## Checklist

- [x] Page loads after Keycloak login on `localhost:4200`.
- [x] Sidebar active state and breadcrumb identify the Prompt templates screen.
- [x] Backend list failure renders a visible translated error state instead of an empty table.
- [x] Retry action is clickable and keeps the screen in a valid retry flow.
- [x] Create action is clickable and routes to `/admin/ai-agent/prompt-templates/create`.
- [x] Error panel, retry action, and create action remain readable on mobile without horizontal page overflow.
- [x] List title, create button, error title, error message, filters, columns, and row action labels use i18n keys.

## Issues Fixed

- API failure was displayed as an empty-table state instead of a retryable error state.
- Table title, create button, filters, columns, and row action labels were hard-coded in English.
- Failure toast used raw English text instead of a translated key.

## Remaining Notes

- Prompt Template backend is unavailable in this local environment, so edit/delete row actions could not be exercised on real rows.
