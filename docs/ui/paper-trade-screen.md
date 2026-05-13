# Paper Trade Screen

## Layout

```text
Header actions
-> summary metrics
-> create account form + start session form
-> realtime progress
-> BTCUSDT candle chart with paper overlays
-> sessions table
-> orders table + positions table
-> events table
-> snapshot JSON panel
-> reset account action
```

## Shared Components

The screen composes existing shared layer components:

```text
app-card
app-button
app-form-input
app-realtime-progress-bar
app-summary-metric-card
app-candle-chart
app-table
app-tag
app-json-preview
```

No native form controls are placed directly in the feature template; forms go through `app-form-input`.

Trading-specific shared UI is owned by:

```text
src/app/features/admin/trade-bot-management/shared-trading
```

Generic primitives remain in `src/app/shared/component`, and composed reusable UI remains in `src/app/shared/ui`.

## Chart

Chart data comes from `MarketDataService.getCandles` with the session market context:

```text
source
marketType
feedCode
symbol
timeframe
limit = 200
```

Overlays:

```text
order marker at filledAt + filledPrice
stop-loss price line
take-profit price line
```

## Text And Translation

All visible labels use `trade-bot.i18n.json` or `layout.i18n.json` keys. New keys added:

```text
layout.menu.paperTrade
tradeBot.paper.*
tradeBot.field.description
```

## Expected BTCUSDT Demo State

With the local DB seed, the screen should show:

```text
1 running session
1 filled SELL order
1 open SELL position
4 paper trade events
12 BTCUSDT 1M Binance USD-M candles
snapshot JSON
```

## Review Checklist

```text
[x] Route and menu item exist.
[x] Component uses NgModule style (`standalone: false`).
[x] Constructor DI is used.
[x] UI state uses signals/computed.
[x] Labels/messages are translated.
[x] Danger actions confirm before executing.
[x] Build passes.
[x] Feature data access is under `trade-bot-management/data-access`.
[x] Trading-specific chart/table helpers are under `trade-bot-management/shared-trading`.
[ ] Add component tests when the existing Angular test runner is stable for feature pages.
```
