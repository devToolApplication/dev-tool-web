# Codex Agent Create UI Audit Checklist

Route: `/admin/codex-agent/agents/create`

Evidence:
- Before screenshots: `.tmp/audit-codex-agent-create.png`, `.tmp/audit-codex-agent-create-mobile.png`
- Fixed screenshots: `.tmp/audit-codex-agent-create-after.png`, `.tmp/audit-codex-agent-create-mobile-after.png`
- Zoom screenshots: `.tmp/audit-codex-agent-create-zoom-1.png`, `.tmp/audit-codex-agent-create-zoom-2.png`
- Browser check: `http://localhost:4200/admin/codex-agent/agents/create`
- Test account was used only in Playwright session; credentials are not stored in this checklist.

## Checklist

- [x] Page loads after Keycloak login on `localhost:4200`.
- [x] Header title, description, Back action, and Create action are translated and readable.
- [x] Options metadata failure renders a persistent warning alert instead of only a toast plus empty dropdowns.
- [x] Empty model/reasoning/sandbox/approval dropdowns show a translated empty state.
- [x] Back action is visually secondary and routes to `/admin/codex-agent/agents` when opened directly.
- [x] Submit action is clickable and empty submit shows the required code/name validation messages.
- [x] Section navigation buttons are clickable and do not overflow on mobile.
- [x] Field guide collapse/expand action is clickable.
- [x] Textarea zoom actions open usable modal editors for `AGENTS.md instruction` and `auth.json`.
- [x] Desktop and mobile layouts have no horizontal page overflow after the section navigation fix.

## Issues Fixed

- Metadata loading failure left Codex runtime dropdowns and Field guide empty without a durable in-page warning.
- Back action used browser history only, so direct entry to the create route had an unreliable return path.
- Back and Save both looked primary, which made the destructive/navigation action compete with the submit action.
- Mobile section navigation used fixed `12rem` tabs, causing the second section button to extend beyond the viewport.

## Remaining Notes

- Codex Agent options still fail with `ERR_CONNECTION_REFUSED` in this local environment. The screen now makes that dependency failure explicit and retry/reloadable.
