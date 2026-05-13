# Paper Trade Feature

## Route

```text
/admin/trade-bot/paper-trade
```

Registered in:

```text
src/app/features/admin/trade-bot-management/trade-bot-management.feature.ts
src/app/shared/layout/config/menu.config.ts
```

## Files

```text
src/app/features/admin/trade-bot-management/pages/paper-trade/paper-trade.component.ts
src/app/features/admin/trade-bot-management/pages/paper-trade/paper-trade.component.html
src/app/features/admin/trade-bot-management/state/paper-trade-store.service.ts
src/app/features/admin/trade-bot-management/data-access/api/paper-trade-api.service.ts
src/app/features/admin/trade-bot-management/data-access/models/paper-trade.model.ts
src/app/features/admin/trade-bot-management/shared-trading/candle-chart/*
```

The component is declared with `standalone: false` and participates in the existing NgModule feature declaration through `TRADE_BOT_FEATURE_COMPONENTS`.

The page component is the route/container layer. API contracts live in `data-access`, route state and loaded data live in `state`, and trading-specific UI lives in `shared-trading`.

## API Contract

The feature calls:

```text
GET    /paper-trade/accounts
POST   /paper-trade/accounts
PATCH  /paper-trade/accounts/{accountId}/reset
GET    /paper-trade/sessions
POST   /paper-trade/sessions/start
GET    /paper-trade/sessions/{sessionId}
POST   /paper-trade/sessions/{sessionId}/evaluate-latest
POST   /paper-trade/sessions/{sessionId}/pause
POST   /paper-trade/sessions/{sessionId}/resume
POST   /paper-trade/sessions/{sessionId}/stop
GET    /paper-trade/sessions/{sessionId}/orders
GET    /paper-trade/sessions/{sessionId}/fills
GET    /paper-trade/sessions/{sessionId}/positions
GET    /paper-trade/sessions/{sessionId}/equity-curve
GET    /paper-trade/sessions/{sessionId}/events
GET    /paper-trade/sessions/{sessionId}/snapshot
GET    /paper-trade/sessions/{sessionId}/summary
```

All calls use `environment.apiUrl.tradeBotAdminUrl`.

## Default BTCUSDT Flow

The start form defaults to:

```text
strategyCode = BTCUSDT_PAPER_DEMO
symbol = BTCUSDT
interval = 1m
source = BINANCE_USDM
marketType = USD_M_FUTURES
feedCode = BINANCE_USDM_BTCUSDT_1M
riskPerTradePct = 1
feeRate = 0.04
slippageRate = 0.01
maxPositionValuePct = 20
```

Local MongoDB is seeded with `paper-account-btcusdt-demo`, `paper-session-btcusdt-demo`, and 12 closed BTCUSDT candles so the screen can render immediately.

## Realtime

The page subscribes to:

```text
taskType = PAPER_TRADE_SESSION
taskId = sessionId
```

The realtime model also accepts:

```text
PAPER_TRADE_ORDER_UPDATE
PAPER_TRADE_POSITION_UPDATE
PAPER_TRADE_EQUITY_UPDATE
PAPER_TRADE_SIGNAL_UPDATE
PAPER_TRADE_ERROR
```

## UI States

Implemented states:

```text
loading
empty candles
running session
paused session
stopped session
action loading
snapshot changed/locked tag
realtime progress state
confirm stop/reset
```

## Manual Test

1. Run backend at `http://127.0.0.1:31002/trade-bot-mcrs`.
2. Run admin web.
3. Open `/admin/trade-bot/paper-trade`.
4. Confirm summary cards, BTCUSDT candle chart, session table, order table, position table, event table, and snapshot panel render.
5. Click Evaluate Latest. Same latest candle should not create a duplicate order.
6. Use pause/resume/stop and confirm status/event updates.
