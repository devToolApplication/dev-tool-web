# AI Agent Playground UI Audit Checklist

Route: `/admin/ai-agent/runtime/playground`

Evidence:
- Before screenshots: `.tmp/audit-ai-agent-playground.png`, `.tmp/audit-ai-agent-playground-mobile.png`
- Fixed screenshots: `.tmp/audit-ai-agent-playground-after.png`, `.tmp/audit-ai-agent-playground-mobile-after.png`
- Browser check: `http://localhost:4200/admin/ai-agent/runtime/playground`
- Test account was used only in Playwright session; credentials are not stored in this checklist.

## Checklist

- [x] Page loads after Keycloak login on `localhost:4200`.
- [x] Header, breadcrumb, sidebar active state, page title, and primary run action are visible on desktop.
- [x] Mobile layout stacks header actions, dependency alert, form sections, and status panel without overlap.
- [x] Empty submit shows validation summary and field-level error for required `User prompt`.
- [x] Section navigation and textarea zoom controls are clickable without runtime errors.
- [x] Agent/model dropdown empty state is translated; PrimeNG default `No results found` no longer leaks.
- [x] Backend dependency failure has a persistent warning alert in the page body.
- [x] Run action is disabled while required dependency lists cannot load.
- [x] `Xóa kết quả` is hidden until there is a result or execution trace to clear.

## Issues Fixed

- Agent/model dropdown rendered PrimeNG English empty text when backend options were unavailable.
- Dependency API failure only appeared as a transient toast, leaving empty dropdowns without persistent context.
- `Xóa kết quả` was shown as a disabled header action even before any result existed, which wasted space on mobile.

## Remaining Notes

- AI Agent backend calls still fail with `ERR_CONNECTION_REFUSED` in this environment. The screen now renders a clear dependency warning and prevents unusable run attempts.
