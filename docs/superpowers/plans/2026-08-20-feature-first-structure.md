# Feature-first Structure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the remaining Angular app into clear feature-first boundaries for the base rebuild, without restoring feature trees already removed from the filesystem.

**Architecture:** App composition moves to `app-shell` and `app-routing`; infrastructure stays under focused `core` folders; business/domain code lives in `features`; reusable UI is grouped under `shared/ui` by responsibility. Stable TypeScript aliases reduce deep relative imports.

**Tech Stack:** Angular 21 NgModules, TypeScript strict mode, Vitest via Angular CLI, Storybook.

---

### Task 1: Add architecture aliases

**Files:**

- Modify: `tsconfig.json`

- [ ] Add `baseUrl: "./src"` and `paths` for `@app/*`, `@core/*`, `@shared/*`, `@features/*`.
- [ ] Run `npm run build`.

### Task 2: Move app composition

**Files:**

- Move: `src/app/app.routes.ts` to `src/app/app-routing/app-routing.module.ts`
- Move: `src/app/app.component.*` to `src/app/app-shell/app.component.*`
- Move: `src/app/shared/layout/base` to `src/app/app-shell/layouts/base`
- Move: `src/app/shared/layout/page` to `src/app/app-shell/layouts/page`
- Move: `src/app/shared/layout/header` to `src/app/app-shell/navigation/header`
- Move: `src/app/shared/layout/side-menu` to `src/app/app-shell/navigation/side-menu`
- Move: `src/app/shared/layout/config` to `src/app/app-shell/navigation/config`
- Create: `src/app/app-shell/app-shell.module.ts`
- Modify: `src/app/app.module.ts`
- Modify: app-shell relative imports

- [ ] Create `AppShellModule` declaring shell/layout/navigation components.
- [ ] Import `AppShellModule` from `AppModule`.
- [ ] Remove shell/layout declarations from `SharedModule`.
- [ ] Run `npm run build`.

### Task 3: Move shared primitives and patterns

**Files:**

- Move: `src/app/shared/component` to `src/app/shared/ui/primitives`
- Move: `src/app/shared/pipe` to `src/app/shared/pipes`
- Move: `src/app/shared/ui/base-crud-page` to `src/app/shared/ui/patterns/base-crud-page`
- Move: `src/app/shared/ui/form-input` to `src/app/shared/ui/patterns/form-input`
- Move: `src/app/shared/ui/table` to `src/app/shared/ui/patterns/table`
- Move: `src/app/shared/ui/flow-builder` to `src/app/shared/ui/patterns/flow-builder`
- Move: `src/app/shared/ui/card` to `src/app/shared/ui/layout/card`
- Move: `src/app/shared/ui/field-guide-panel` to `src/app/shared/ui/forms/field-guide-panel`
- Move: `src/app/shared/ui/realtime-progress-bar` to `src/app/shared/ui/feedback/realtime-progress-bar`
- Move: `src/app/shared/ui/summary-metric-card` to `src/app/shared/ui/data-display/summary-metric-card`
- Modify: `src/app/shared/shared.module.ts`

- [ ] Move folders.
- [ ] Update `SharedModule` imports and declarations.
- [ ] Update moved-file imports.
- [ ] Run focused shared tests, then `npm run build`.

### Task 4: Move feature/domain code

**Files:**

- Move: `src/app/features/error/forbidden` to `src/app/features/error/pages/forbidden`
- Move: `src/app/features/error/not-found` to `src/app/features/error/pages/not-found`
- Move: `src/app/features/error/error-routing.module.ts` to `src/app/features/error/error.routes.ts`
- Move: `src/app/shared/ui/candle-chart` to `src/app/features/trading/candle-chart`
- Modify: `src/app/features/app-feature.module.ts`

- [ ] Move feature folders.
- [ ] Update feature imports and route composition.
- [ ] Keep candle chart self-contained and out of `SharedModule`.
- [ ] Run candle chart and app feature checks.

### Task 5: Move core infrastructure

**Files:**

- Move: `src/app/core/constants/system.constants.ts` to `src/app/core/config/system.constants.ts`
- Move: `src/app/core/models/base-response.model.ts` to `src/app/core/http/base-response.model.ts`
- Move: `src/app/core/ui-services/loading.service.*` to `src/app/core/loading`
- Move: `src/app/core/ui-services/theme*.ts` to `src/app/core/theme`
- Move: `src/app/core/ui-services/toast.service.*` to `src/app/core/notifications`
- Move: `src/app/core/ui-services/i18n.service.ts` to `src/app/core/i18n/i18n.service.ts`

- [ ] Move infrastructure files.
- [ ] Keep UI confirm dialog service in `shared/ui/overlay`; do not re-export shared UI from `core`.
- [ ] Update imports using aliases.
- [ ] Run affected core specs.

### Task 6: Clean stale imports and verify

**Files:**

- Modify: all affected imports under `src/app`

- [ ] Search for stale `shared/component`, `shared/layout`, `shared/pipe`, `shared/ui/base-crud-page`, `shared/ui/form-input`, `core/ui-services`.
- [ ] Run `npm test -- --include` for moved focused specs that remain practical.
- [ ] Run `npm run build`.
- [ ] Run `git diff --check -- src/app docs/superpowers`.
