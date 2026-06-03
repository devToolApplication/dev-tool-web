---
title: CLAUDE
type: note
permalink: dev-tool-web/claude
---

# Dev Tool Web (Frontend)

## Overview
Angular frontend application â€” trading tools, AI agent UI, developer utilities.

## Tech Stack
- Angular 21 (latest)
- UI: PrimeNG (wrapped in app-* shared components)
- Styling: SCSS + Design Tokens (--app-* CSS custom properties)
- State: Signals
- Build: Angular CLI
- Auth: Keycloak

## Architecture
- Feature modules (lazy-loaded)
- Shared components (`app-*` wrappers â€” KHÃ”NG dÃ¹ng PrimeNG trá»±c tiáº¿p)
- Signal-based state management
- Template control flow (`@if`, `@for`, `@switch`)

## Conventions
- **PHáº¢I dÃ¹ng `app-*` shared components** â€” KHÃ”NG import PrimeNG trá»±c tiáº¿p
- **KHÃ”NG dÃ¹ng `::ng-deep` hoáº·c `:host-context`** â€” dÃ¹ng CSS custom properties
- **Design tokens** â€” `--app-*` cho colors, spacing, typography
- **i18n** â€” táº¥t cáº£ display text qua translation keys
- **Mobile-first responsive** â€” base = mobile, enhance with min-width
- **Semantic HTML + ARIA + keyboard nav**

## Related Services
- **ai-agent-mcrs** (Java) â€” AI agent API (KHÃ”NG gá»i execute-service trá»±c tiáº¿p)
- **trade-bot-mcrs** (Java) â€” trading API
- **file-mcrs** (Java) â€” file upload/download
- **Keycloak** â€” SSO authentication

## Commands
```bash
npm run start:dev     # Start dev server in Local environment (port 4200)
npm run start:prod    # Start dev server in Production environment (port 4200)
ng serve              # Start dev server (port 4200)
ng build              # Build production
ng test               # Unit tests
ng e2e                # E2E tests (Playwright)
```

## Important Rules
1. KHÃ”NG gá»i ai-agent-excute-service trá»±c tiáº¿p â€” luÃ´n qua ai-agent-mcrs
2. KHÃ”NG dÃ¹ng PrimeNG components trá»±c tiáº¿p â€” dÃ¹ng app-* wrappers
3. KHÃ”NG dÃ¹ng ::ng-deep / :host-context
4. One primary focus per page in first viewport
5. Táº¯t dev server sau khi test xong