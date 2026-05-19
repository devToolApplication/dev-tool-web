# backtest-list

Backtest list dùng data-access, table shared, filter/paging và link detail.
Form chạy backtest dùng control chọn sẵn cho các field có option hữu hạn
như strategy, symbol, timeframe, source, market type, feed code,
same-bar exit policy và audit level; không bắt người dùng nhập tay các giá trị này.
Các option market của form được lấy từ `/v1/admin/candles/markets` để chỉ gợi ý
những tổ hợp đang có candle trong `candle_bars`; khi API lỗi, form dùng fallback
an toàn `BTCUSDT / 5M / BINANCE_USDM`.

## Source Ownership

- Page/container: feature pages hoặc feature folder tương ứng.
- API/model: data-access/api, data-access/models.
- Store/state: state.
- Reusable trading UI: 	rade-bot-management/shared-trading.

## Checklist

- Feature owns business code.
- UI uses shared layer and translate.
- API contract typed.
- Loading/error/empty states covered.

