# Feature-first structure design

## Goal

Refactor `src/app` into a feature-first Angular structure so future business pages live under `features`, infrastructure stays in `core`, reusable UI stays in `shared`, and app composition stays in `app-shell`/`app-routing`.

## Target structure

```text
src/app/
  app-routing/
    app-routing.module.ts
  app-shell/
    app.component.*
    app-shell.module.ts
    layouts/
    navigation/
  core/
    auth/
    config/
    http/
    i18n/
    loading/
    theme/
    notifications/
  features/
    app-feature.module.ts
    error/
      error.routes.ts
      pages/
    trading/
      candle-chart/
  shared/
    shared.module.ts
    pipes/
    testing/
    stories/
    storybook/
    utils/
    ui/
      primitives/
      patterns/
      layout/
      feedback/
      data-display/
      forms/
      overlay/
```

## Boundary rules

- `app-shell` owns root shell, header, side menu, page wrapper, and menu config.
- `app-routing` owns `RouterModule.forRoot`.
- `features` owns business/domain UI. Error pages stay in `features/error`; candle chart moves to `features/trading/candle-chart` because it is trading-domain UI, not generic shared UI.
- `shared` owns domain-independent UI. PrimeNG wrappers move from `shared/component` to `shared/ui/primitives`.
- `shared/ui/patterns` owns reusable composite widgets: Base CRUD page, Form Input, Table, Flow Builder.
- `core` owns infrastructure services: auth, HTTP, i18n, loading, theme, notifications.
- Imports use aliases `@app`, `@core`, `@shared`, `@features` for stable boundaries.

## Non-goals

- Do not restore deleted admin features.
- Do not change public selectors such as `app-button`, `app-base-crud-page`, `app-form-input`.
- Do not rewrite component behavior beyond import/path ownership.
- Do not add dependencies.
