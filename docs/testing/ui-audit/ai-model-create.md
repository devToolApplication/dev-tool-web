# AI Model Create UI Audit Checklist

Route: `/admin/ai-agent/models/create`

Evidence:
- Fixed screenshots: `.tmp/audit-ai-model-create-after.png`, `.tmp/audit-ai-model-create-mobile-after.png`
- Browser check: `http://localhost:4200/admin/ai-agent/models/create`
- Test account was used only in Playwright session; credentials are not stored in this checklist.

## Checklist

- [x] Page loads after Keycloak login on `localhost:4200`.
- [x] Header title, description, Back action, Create action, and info section are translated.
- [x] Form labels and validation messages use i18n keys instead of hard-coded English.
- [x] Back action is visually secondary and routes to `/admin/ai-agent/models` when the form is clean.
- [x] Dirty Back action opens the unsaved-changes confirmation and routes to `/admin/ai-agent/models` after confirmation.
- [x] Empty submit shows required validation for model name and model type.
- [x] Provider, API type, tool support, status, and metadata type dropdowns open correctly.
- [x] Section navigation buttons are clickable and do not overflow on mobile.
- [x] Metadata add action is clickable and adds another metadata row.
- [x] Desktop and mobile layouts have no horizontal page overflow.

## Issues Fixed

- Create/edit title, description, info section, field labels, validation messages, and error toasts were hard-coded in English.
- Submit button used the generic `Gửi` label instead of the screen-specific create/update action.
- Back action used browser history only and had no explicit list fallback route.
- Back and Create actions had competing primary styling.

## Remaining Notes

- Backend save was not exercised because the audit intentionally submitted an invalid empty form to validate client-side errors.
