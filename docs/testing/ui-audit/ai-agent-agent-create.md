# AI Agent Agent Create UI Audit Checklist

Route: `/admin/ai-agent/agents/create`

Evidence:
- Initial screenshots: `.tmp/audit-ai-agent-agent-create.png`, `.tmp/audit-ai-agent-agent-create-mobile.png`
- Fixed screenshots: `.tmp/audit-ai-agent-agent-create-after.png`, `.tmp/audit-ai-agent-agent-create-mobile-after.png`, `.tmp/audit-ai-agent-agent-create-mobile-after-headerfix.png`
- Browser check: `http://localhost:4200/admin/ai-agent/agents/create`
- Test account was used only in Playwright session; credentials are not stored in this checklist.

## Checklist

- [x] Page loads after Keycloak login on `localhost:4200`.
- [x] Header, title, description, Back, and Create actions are visible on desktop.
- [x] Mobile layout keeps header, actions, dependency alert, form sections, and status panel readable without overlap.
- [x] Empty submit shows validation summary and field-level errors for required code/name.
- [x] Status dropdown opens and shows translated status options.
- [x] Back action navigates reliably to `/admin/ai-agent/agents` even when the form is opened directly.
- [x] Back action is visually secondary; Create remains the primary action.
- [x] Dependency option loading failures show a persistent warning in the page body.
- [x] Page title, description, action labels, field labels, validation messages, and JSON validation message use i18n keys.
- [x] Mobile app header no longer clips long breadcrumb text; it shows the screen title only.

## Issues Fixed

- Form title, description, actions, fields, validation, and save/load errors were hard-coded in English.
- Dependency option failures were swallowed into empty model/prompt/policy dropdowns without a persistent explanation.
- The Back button used browser history only, so direct-open form pages could stay on the same route.
- Back and Create both appeared as primary buttons, weakening action hierarchy.
- Long breadcrumbs clipped on narrow mobile headers.

## Remaining Notes

- AI Agent dependency APIs still fail with `ERR_CONNECTION_REFUSED` in this environment. The form now communicates that state clearly while leaving editable fields usable.
