---
title: CLAUDE
type: note
permalink: dev-tool-web/claude
---

# Dev Tool Web (Frontend)

## Overview
Angular frontend application — trading tools, AI agent UI, developer utilities.

## Tech Stack
- Angular 21 (latest)
- UI: PrimeNG (wrapped in app-* shared components)
- Styling: SCSS + Design Tokens (--app-* CSS custom properties)
- State: Signals
- Build: Angular CLI
- Auth: Keycloak

## Architecture
- Feature modules (lazy-loaded)
- Shared components (`app-*` wrappers — KHÔNG dùng PrimeNG trực tiếp)
- Signal-based state management
- Template control flow (`@if`, `@for`, `@switch`)

## Conventions
- **PHẢI dùng `app-*` shared components** — KHÔNG import PrimeNG trực tiếp
- **KHÔNG dùng `::ng-deep` hoặc `:host-context`** — dùng CSS custom properties
- **Design tokens** — `--app-*` cho colors, spacing, typography
- **i18n** — tất cả display text qua translation keys
- **Mobile-first responsive** — base = mobile, enhance with min-width
- **Semantic HTML + ARIA + keyboard nav**

## Related Services
- **ai-agent-mcrs** (Java) — AI agent API (KHÔNG gọi execute-service trực tiếp)
- **trade-bot-mcrs** (Java) — trading API
- **file-mcrs** (Java) — file upload/download
- **Keycloak** — SSO authentication

## Commands
```bash
ng serve              # Start dev server (port 4200)
ng build              # Build production
ng test               # Unit tests
ng e2e                # E2E tests (Playwright)
```

## Important Rules
1. KHÔNG gọi ai-agent-excute-service trực tiếp — luôn qua ai-agent-mcrs
2. KHÔNG dùng PrimeNG components trực tiếp — dùng app-* wrappers
3. KHÔNG dùng ::ng-deep / :host-context
4. One primary focus per page in first viewport
5. Tắt dev server sau khi test xong