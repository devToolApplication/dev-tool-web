# Dashboard UI Audit Checklist

Route: `/admin/dashboard`

Evidence:
- Playwright desktop/mobile screenshots: `.tmp/audit-dashboard-desktop.png`, `.tmp/audit-dashboard-mobile.png`
- Fixed-state screenshot: `.tmp/audit-dashboard-after.png`
- Browser check: `http://localhost:4200/admin/dashboard`
- Test account was used only in Playwright session; credentials are not stored in this checklist.

## Checklist

- [x] Page loads after Keycloak login on `localhost:4200`.
- [x] Header, breadcrumb, sidebar, page title, and primary refresh action are visible on desktop.
- [x] Mobile layout keeps header, page title, refresh action, and error state readable without overlap.
- [x] User account button opens account actions.
- [x] Refresh and retry actions can be clicked and keep the page in a valid loading/error flow.
- [x] Backend-down state renders a translated, visible error state.
- [x] Duplicate dashboard API error blocks were removed; the detail panel no longer appears when there is no overview data.
- [x] Dashboard title is fully Vietnamese in the Vietnamese locale.
- [x] Header no longer displays raw technical role strings such as permission codes.

## Issues Fixed

- Duplicate error state: `Tổng quan` and `Chi tiết dashboard` both showed the same dashboard API failure when backend APIs were unavailable.
- Mixed-language title: the Vietnamese dashboard heading used `Dashboard quản trị hệ thống`.
- Header role label exposed raw permission-like text from the token, which looked like implementation data instead of UI copy.

## Remaining Notes

- API requests to local backend ports still fail with `ERR_CONNECTION_REFUSED` in this environment. The dashboard error state handles this correctly; backend availability is outside this UI fix.
