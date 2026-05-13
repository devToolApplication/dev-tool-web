# V5 Admin Feature Architecture

The admin web follows the v5 feature layout for Trade Bot and Job Scheduler while keeping the existing NgModule convention.

## Trade Bot

```text
src/app/features/admin/trade-bot-management
|-- data-access
|   |-- api
|   `-- models
|-- pages
|   |-- backtest
|   |-- config-history
|   |-- dashboard
|   |-- indicator-config
|   |-- market-data
|   |-- monitoring
|   |-- paper-trade
|   |-- replay
|   |-- rule-config
|   |-- sandbox
|   `-- strategy-config
|-- shared-trading
|   |-- candle-chart
|   |-- data-quality-warning
|   |-- rule-tree-viewer
|   `-- trade-detail-drawer
|-- state
`-- trade-bot-management.feature.ts
```

Rules:

- Feature pages stay under `pages`.
- API services and feature models stay under `data-access`.
- Route and UI state stores stay under `state`.
- Trading-specific reusable components stay under `shared-trading`.
- Compatibility wrappers may remain in `core/models/trade-bot` and `core/services/trade-bot-service` while old imports are being removed.
- Do not rename global `shared/component` to `shared/components`; the repo convention is still singular.

## Job Scheduler

```text
src/app/features/admin/job-scheduler
|-- data-access
|   |-- api
|   `-- models
|-- list
|-- form
|-- detail
`-- job-scheduler.feature.ts
```

Primary route:

```text
/admin/job-scheduler
```

Compatibility alias:

```text
/admin/system-management/jobs
```

## Shared Layer

```text
src/app/shared/component  small primitive wrappers
src/app/shared/ui         composed reusable UI blocks
```

Feature templates should compose the shared layer instead of placing native business controls/tables directly in pages. All visible labels, empty states, loading messages, errors, and aria labels must use translation keys.

## Runtime Smoke

The migration was verified with a Keycloak login and route smoke over 50 admin routes. The smoke separates Angular runtime failures from backend API availability.

Latest result:

```text
routes checked: 50
runtime failures: 0
backend-affected routes: 34
```

The backend-affected routes loaded the Angular shell but had API calls fail because the corresponding backend services were not running during the smoke.

## Verification

Run from the repo root:

```powershell
npm.cmd run build
npm.cmd test -- --watch=false
```

Known non-blocking warning:

```text
shared-trading/candle-chart/candle-chart.css exceeds the current component CSS budget.
```
