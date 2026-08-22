# ESLint Engineering Standard

This standard applies to all TypeScript and Angular code in `dev-tool-web`.

## Core Rules for AI and Developers

1. Read `eslint.config.mjs` before editing TypeScript/Angular code.
2. Fix source code before considering ESLint config changes.
3. Never weaken a global rule to make one file pass.
4. Never replace a proper type with `any` to satisfy another lint error.
5. Never add blanket `eslint-disable` comments.
6. Never exclude normal source/test files from lint.
7. Remove dead imports/variables instead of manufacturing fake usage.
8. Run `npm run lint` and `npm run typecheck` before reporting complete.

## Shared UI Architecture Boundary

- Code under `src/app/shared/**` must NOT import from `@features/**` or `@core/auth/**`.
- Shared components are presentation-only primitives and patterns; business policy, auth routing, and feature APIs belong in feature modules.
