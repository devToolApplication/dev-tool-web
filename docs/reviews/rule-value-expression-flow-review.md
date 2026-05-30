---
title: rule-value-expression-flow-review
type: note
permalink: dev-tool-web/docs/reviews/rule-value-expression-flow-review
---

# Review: Rule Value, Expression Runtime, Flow Builder

Date: 2026-05-29

## Verdict

Request changes.

Phần `EXPRESSION` runtime đã đi đúng hướng, nhưng chưa thể coi là hoàn tất vì backend hiện không compile được, contract `RuleEvaluationResult.value` chưa đồng nhất ở nhiều rule logic không phải `EXPRESSION`, và flow editor FE vẫn là view một chiều, chưa ghi ngược thay đổi vào form.

## Scope

- Backend: `trade-bot-mcrs` rule runtime, expression executor, trace output, rule-value contract.
- Frontend: `dev-tool-web` rule expression/flow adapter, trace flow display, shared `flow-builder`.
- Không review/revert các thay đổi dirty ngoài scope như xóa docs hàng loạt, theme/css unrelated, hoặc controller API refactor ngoài tác động compile.

## Requirement Checklist

### Backend

| Requirement | Status | Notes |
|---|---:|---|
| Thêm top-level `value` vào `RuleEvaluationResult` | PASS | `RuleEvaluationResult.java:18` đã có `Object value`. |
| Thêm `value` vào response contract | PASS | `RuleEvaluationResponse.java:18` đã có `Object value`. |
| Trace output thêm top-level `value`, giữ `input`/`output` | PASS | `RuleTraceBuilder.java:37-44` ghi `passed`, `value`, `input`, `output`, `children`. |
| Executor `EXPRESSION` version `v1` implements `RuleLogic` | PASS | `ExpressionRuleLogic.java:39-45`. |
| Parse `config.ruleExpression` bằng DTO/typed classes, không xử lý Map rời rạc cho node | PASS | Jackson DTO nội bộ từ `ExpressionRuleLogic.java:437+`; `params/config` vẫn là map phụ trợ, chấp nhận được. |
| Operand resolver hỗ trợ `indicator`, `indicatorOutput`, `priceSeries`, `ruleRef`, `constant` | PASS | `ExpressionRuleLogic.java:280-285`. |
| Comparison/cross dùng `ruleRef.value` khi referenced rule `satisfied=true` | PASS/PARTIAL | `ruleRefValue()` dùng `childResult.isSatisfied() && childResult.getValue() != null` tại `ExpressionRuleLogic.java:329-335`. Nếu rule config không tồn tại, runtime vẫn throw `DATA_NOT_FOUND`, không convert thành false. |
| `AND`, `OR`, `XOR`, `NOT` dùng boolean `satisfied`; `value` là true/false | PASS | `ExpressionRuleLogic.java:92-111`. |
| Operators catalog: `CROSSOVER`, `CROSSUNDER`, `GT`, `GTE`, `LT`, `LTE`, `EQ`, `NEQ`, `BETWEEN`, `OUTSIDE` | PASS | `ExpressionRuleLogic.java:132-135`. |
| Condition result `value = left current value` khi true, false thì `null` | PASS cho `EXPRESSION`; FAIL toàn runtime | `EXPRESSION` đúng ở `ExpressionRuleLogic.java:165`, `195`, `235`. Nhiều rule logic khác vẫn thiếu hoặc set sai `value`, xem Findings P1. |
| Runtime cycle guard | PASS/PARTIAL | `RuleRuntimeService.java:22-28` có stack, nhưng key gồm `index` tại `RuleRuntimeService.java:50-52`, nên chỉ chặn cycle cùng index. |
| Backend test plan | PARTIAL | Có `ExpressionRuleLogicTest`, nhưng thiếu coverage `BETWEEN/OUTSIDE`, `CROSSUNDER`, trace serialization top-level `value`, runtime cycle, và matrix đầy đủ `GTE/LT/LTE`. Backend test chưa chạy được do compile failure. |

### Frontend

| Requirement | Status | Notes |
|---|---:|---|
| Model trace nhận `value` | PASS | `RuleEvaluationTrace.value` tại `trading-system.model.ts:416`. |
| Rule tree viewer hiển thị `value` như metadata phụ | PASS | `rule-tree-viewer.component.ts:149`, `379-385`; template hiển thị tại `rule-tree-viewer.component.html:97-99`. |
| Rule trace flow nhận `value` | PARTIAL | Adapter đưa `value` và `badge` vào node data tại `rule-flow-trace-adapter.ts:61-78`, nhưng renderer không render `badge`, xem Findings P2. |
| Rule config flow dùng expression thật | PASS một chiều | `ruleFlowDefinition` map từ expression tại `rule-config-form.component.ts:68`; HTML bind `[value]` tại `rule-config-form.component.html:40-48`. |
| Flow edit cập nhật lại form/expression | FAIL | Không bind `(valueChange)` vào `<app-flow-builder>`; handler connect/delete vẫn TODO. |
| Prefer executor `EXPRESSION` khi tạo rule mới | PASS | `defaultRuleExecutor()` ưu tiên `EXPRESSION` tại `rule-config-form.component.ts:822-824`. |
| Common flow-builder đủ tái sử dụng | PARTIAL | Module tách riêng và có adapter domain, nhưng còn lỗi diff edge, auto-fit first render, bundle import quá rộng, thiếu specs. |
| FE tests/build | PARTIAL | `npm run build` pass. `npm test -- --watch=false` fail vì specs cũ không khớp API component. |

## Findings

### P0 - Backend hiện không compile được do BOM ở nhiều Java controller

`.\mvnw.cmd test` fail ngay ở compile với lỗi `illegal character: '\ufeff'` tại line 1 của nhiều file controller, ví dụ:

- `trade-bot-mcrs/src/main/java/com/lamld/tradebotmcrs/modules/backtest/api/BacktestController.java:1`
- `trade-bot-mcrs/src/main/java/com/lamld/tradebotmcrs/modules/backtest/api/BacktestReviewController.java:1`
- `trade-bot-mcrs/src/main/java/com/lamld/tradebotmcrs/modules/evaluate/api/EvaluateBarController.java:1`
- `trade-bot-mcrs/src/main/java/com/lamld/tradebotmcrs/modules/executor/api/ExecutorMetadataController.java:1`
- `trade-bot-mcrs/src/main/java/com/lamld/tradebotmcrs/modules/marketdata/api/CandleController.java:1`
- Nhiều controller khác trong `monitoring`, `overlay`, `papertrade`, `realtime`, `replay`, `sandbox`, `secret`, `tradingconfig`.

Impact:

- Backend unit tests cho `ExpressionRuleLogicTest` chưa được thực thi.
- Không thể xác nhận runtime rule/expression hoạt động end-to-end.
- Đây là blocker trước khi merge dù lỗi có thể nằm ngoài rule logic.

Required fix:

- Remove UTF-8 BOM khỏi các `.java` files.
- Chạy lại `.\mvnw.cmd test` sau khi sửa.

### P1 - Contract `RuleEvaluationResult.value` chưa đồng nhất ở các rule logic không phải `EXPRESSION`

Yêu cầu gốc: khi `rule = true` phải có `value` là giá trị tại vị trí true của rule; khi false thì nên không phát ra value điều kiện. Hiện tại các rule logic đang xử lý không nhất quán:

- `HighVolatilityBarRuleLogic.java:83-90`: set `satisfied(highVol)` nhưng không set `value` kể cả khi true. Nếu rule này được dùng trong comparison qua `ruleRef`, `ExpressionRuleLogic.ruleRefValue()` sẽ coi operand unavailable vì `childResult.getValue() == null`.
- `BullishFvgRuleLogic.java:74-77`: set `satisfied(fvg)` nhưng không set `value`; output có `top/bottom` nhưng top-level `value` null.
- `BullishObFormedRuleLogic.java:97-102`: luôn satisfied true nhưng không set top-level `value`; dữ liệu OB chỉ nằm trong `output`.
- `BullishObMitigatedRuleLogic.java:82-88`: set `satisfied(mitigated)` nhưng không set `value`.
- `TrendIsBullishRuleLogic.java:95-100`: set boolean trend nhưng không set `value`; nếu trend rule được dùng trong comparison thì không có value.
- `NewPivotHighRuleLogic.java:67-70` và `NewPivotLowRuleLogic.java:69-70`: set `value(currentValue)` bất kể `isNewPivot` true hay false. Khi false nhưng current pivot vẫn có dữ liệu, trace sẽ hiển thị value gây hiểu nhầm.
- `EqualHighsRuleLogic.java:92-101` và `EqualLowsRuleLogic.java:95-96`: set `value(currentLevel)` bất kể `equal` true hay false.
- `BullishBosRuleLogic.java:97-102`, `BearishBosRuleLogic.java:101-102`, `BullishChochRuleLogic.java:101-102`, `BearishChochRuleLogic.java:100-101`: set pivot value bất kể cross có xảy ra hay không.

Impact:

- RuleRef comparison có thể false ngoài ý muốn vì rule true nhưng thiếu `value`.
- Trace/debug hiển thị `value` ở rule false, làm người dùng hiểu sai rule đã phát tín hiệu ở candle đó.
- Contract runtime bị lệch giữa `EXPRESSION` và rule logic chuyên biệt.

Required fix:

- Chuẩn hóa helper pattern cho rule logic, ví dụ `setSatisfiedValue(result, satisfied, valueWhenTrue)`.
- Với rule có vùng hoặc nhiều giá trị, top-level `value` nên là giá trị chính để compare; chi tiết vẫn để trong `output`. Ví dụ FVG có thể dùng midpoint/top/bottom theo quyết định domain, OB có thể dùng `obLow/obHigh` hoặc object value có schema rõ.
- Khi false, set `value = null` trừ group boolean `AND/OR/XOR/NOT` theo requirement.
- Bổ sung unit tests cho từng nhóm rule chuyên biệt được dùng bởi `ruleRef`.

### P1 - Flow editor trong rule config chưa persist thay đổi

`app-flow-builder` có emit `valueChange` khi connect/move/delete, ví dụ `flow-builder.component.ts:107-120`, nhưng rule config page không bind event này:

- `rule-config-form.component.html:40-48` chỉ bind `[value]`, `(nodeClick)`, `(connect)`, `(command)`.
- `rule-config-form.component.ts:182-193` các handler `onFlowNodeClick`, `onFlowConnect`, `onFlowCommand` vẫn là TODO.
- `flowDefinitionToRuleExpression()` đã tồn tại tại `rule-flow-reverse-adapter.ts:13`, nhưng không được import/use trong `rule-config-form.component.ts`. `rg` chỉ thấy export, không thấy call.

Impact:

- User kéo nối node trong Flow tab sẽ không cập nhật `ruleExpressionValue`.
- Save rule vẫn lưu expression cũ.
- Link mới còn có thể biến mất vì Joint engine remove temp link và parent không accept `valueChange`.

Required fix:

- Bind `(valueChange)="onFlowValueChange($event)"`.
- Trong handler, convert bằng `flowDefinitionToRuleExpression()`, gọi `ruleExpressionValue.set(...)`, validate lại expression, mark dirty nếu form framework có API.
- Bổ sung test adapter round-trip: expression -> flow -> expression.

### P1 - JointFlowEngine chưa update edge đã tồn tại

Trong `JointFlowEngine.render()`:

```ts
for (const edge of definition.edges) {
  if (this.edgeMap.has(edge.id)) continue;
  ...
}
```

Reference: `joint-flow-engine.ts:130-142`.

Impact:

- Khi edge đổi source/target/label/data nhưng giữ cùng id, canvas không phản ánh thay đổi.
- Flow trace và flow editor dễ stale khi parent recompute graph từ state mới.

Required fix:

- Nếu `edgeMap.has(edge.id)`, lấy link hiện tại và update source, target, attrs/label/data.
- Nếu update edge khó hơn node, remove/recreate edge theo id, nhưng phải đảm bảo selection không vỡ.

### P2 - Auto-layout/fit bị consume bởi empty first render

`FlowCanvasComponent.renderGraph()` luôn set `firstRenderDone = true` sau render:

- `flow-canvas.component.ts:90-101`.

Impact:

- Nếu lần render đầu là graph rỗng hoặc trace chưa load, lần graph thật đầu tiên sẽ không auto-layout/fit.
- Case này xảy ra ở trace flow vì `traceFlowDefinition()` có thể trả graph rỗng trước khi trace API về.

Required fix:

- Chỉ set `firstRenderDone` khi graph có node hoặc sau khi đã fit graph thật.
- Hoặc reset `firstRenderDone` khi value chuyển từ empty sang non-empty.

### P2 - Trace flow đã đưa `value` vào data nhưng renderer chưa hiển thị badge

`rule-flow-trace-adapter.ts:61-78` set:

- `data.value`
- `data.badge`

Nhưng `joint-flow-renderer.ts:54-195` chỉ resolve và vẽ label chính; không có markup/attrs cho badge, sublabel, metadata hay tooltip value.

Impact:

- Requirement “Rule trace viewer hiển thị `value` như metadata phụ cạnh operator/indicator/children” chỉ đúng với tree viewer, chưa đúng với flow viewer.

Required fix:

- Mở rộng `FlowNodeTypeDefinition` hoặc renderer để hỗ trợ `badgeResolver`, `subtitleResolver`, hoặc `metadataRowsResolver`.
- Với trace mode, render value nhỏ hơn label chính, không cạnh tranh primary status.

### P2 - English i18n thiếu key `shared.flowBuilder.*`

Vietnamese section có keys tại `common.i18n.json:200-210`, nhưng English section quanh `common.i18n.json:450-477` chưa có các key tương ứng.

Impact:

- Locale English sẽ hiện raw key hoặc tooltip rỗng tùy pipe.
- Đây là regression i18n cho shared component.

Required fix:

- Thêm đầy đủ `shared.flowBuilder.toolbar.*` và `shared.flowBuilder.inspector.*` cho English.

### P2 - FlowBuilderModule đang import ở `AppFeatureModule`, làm bundle feature quá rộng

`AppFeatureModule` import `FlowBuilderModule` tại:

- `app-feature.module.ts:46`
- `app-feature.module.ts:101-105`

Impact:

- JointJS/flow builder có nguy cơ bị kéo vào toàn bộ feature lazy chunk thay vì chỉ trade-bot pages cần dùng.
- Build output đang có lazy chunk `app-feature-module` khoảng `1.24 MB raw`; đây không chứng minh toàn bộ do JointJS, nhưng import level hiện tại làm blast radius rộng.

Required fix:

- Import `FlowBuilderModule` tại module/page scope của trade-bot management nếu kiến trúc hiện tại cho phép.
- Nếu `AppFeatureModule` đang là shared feature bucket, cân nhắc standalone/lazy boundary cho trade-bot pages.

### P2 - Test coverage chưa đủ so với test plan

Backend hiện có `ExpressionRuleLogicTest`, nhưng thiếu:

- `BETWEEN` và `OUTSIDE`.
- `CROSSUNDER`.
- `GTE`, `LTE` matrix đầy đủ.
- RuleRef satisfied true nhưng `value=null`.
- Trace serialization test chứng minh top-level `value`.
- Runtime cycle stack test.
- Tests cho rule logic chuyên biệt đảm bảo `value` true/null contract.

Frontend thiếu spec trong các thư mục mới:

- `dev-tool-web/src/app/shared/ui/flow-builder/`
- `dev-tool-web/src/app/features/admin/trade-bot-management/share/rule-flow/`

`rg --files ... | rg "\.spec\.ts$"` không trả file nào cho hai scope này.

Impact:

- Các lỗi hiện tại như flow không persist, edge stale, badge không hiển thị có thể lọt qua build.

Required fix:

- Thêm unit tests cho adapters và component event binding.
- Thêm renderer/engine tests tối thiểu cho edge update, mode readonly/edit, `valueChange`.

### P3 - Expression parameter parsing còn throw với `lookback` string invalid

`ExpressionRuleLogic.intParam()` parse string bằng `Integer.parseInt(text)` tại `ExpressionRuleLogic.java:397-399` mà không catch.

Impact:

- Config xấu có thể làm evaluation throw thay vì condition false hoặc fallback default.

Required fix:

- Catch `NumberFormatException` và trả fallback hoặc throw `BusinessException` có message rõ.

## Resolved / Good Points

- `EXPRESSION` executor đã tách đúng runtime logic, operator dispatch rõ ràng.
- Binary/range/cross trong `EXPRESSION` đều set `value = left.value` khi satisfied và `null` khi false.
- Group và NOT dùng boolean `satisfied`, không dùng numeric `value`.
- `RuleRuntimeService` đã có cycle guard cơ bản bằng ThreadLocal stack.
- FE đã có adapter expression -> flow, reverse adapter đã được chuẩn bị.
- Rule tree viewer đã hiển thị `value` như metadata và có spec cho searchable value.
- Rule config default executor đã ưu tiên `EXPRESSION`.
- FE build production pass.

## Verification

### Backend

Command:

```powershell
cd d:\Code\trade-bot-mcrs
.\mvnw.cmd test
```

Result: FAIL.

Reason:

- Compile fail before tests due `illegal character: '\ufeff'` in multiple Java controller files.
- `ExpressionRuleLogicTest` was not executed.

### Frontend Build

Command:

```powershell
cd d:\Code\dev-tool-web
npm.cmd run build
```

Result: PASS.

### Frontend Tests

Command:

```powershell
cd d:\Code\dev-tool-web
npm.cmd test -- --watch=false
```

Result: FAIL.

Failures:

- `src/app/shared/component/input-multi/input-multi.spec.ts`: `InputMulti.onModelChange` does not exist.
- `src/app/shared/component/progress-spinner/progress-spinner.component.spec.ts`: `ProgressSpinnerComponent.ngAfterViewChecked` does not exist.
- `src/app/shared/ui/layout/action-toolbar/action-toolbar.component.spec.ts`: `ActionToolbarComponent.visibleActions` does not exist.

## Recommended Fix Order

1. Remove BOM from backend Java files and restore backend compile.
2. Normalize `RuleEvaluationResult.value` contract across all rule logic classes.
3. Add backend tests for rule value contract, expression missing/null ruleRef value, trace serialization, cycle detection.
4. Wire Flow tab `(valueChange)` to `flowDefinitionToRuleExpression()` and update rule form state.
5. Fix `JointFlowEngine` edge update behavior.
6. Fix first non-empty render auto-layout/fit.
7. Render trace `value` in flow nodes as secondary metadata.
8. Add English i18n keys.
9. Add FE tests for adapters, flow builder event persistence, trace value rendering.