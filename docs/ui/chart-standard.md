# chart-standard

Chart phải có stable dimensions, empty/loading/error state, theme token, responsive layout và không hard-code chart color.

## Checklist

- Dùng token/shared layer.
- Không native control/table cho nghiệp vụ.
- Text đi qua translate.
- Responsive và overflow an toàn.
- Candle chart chỉ fetch một window thời gian ban đầu; bật `lazyLoadOnPan` và xử lý `rangeBoundaryReached` để fetch thêm window trái/phải khi người dùng pan tới biên.
- Khi fetch thêm window cho chart đã có dữ liệu, không bật loading overlay toàn chart và phải giữ nguyên visible range để người dùng không bị nhảy về đầu/cuối chart.
- Logic pan/zoom phải chạy ngoài Angular zone và throttle theo `requestAnimationFrame`; chỉ tính overlay DOM geometry khi thật sự có label/box overlay đang bật.


