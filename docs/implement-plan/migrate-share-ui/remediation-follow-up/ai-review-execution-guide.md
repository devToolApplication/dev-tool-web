# AI Review Execution Guide — Shared UI Remediation

Mục đích của file này: hướng dẫn AI thực hiện các review slice nhỏ theo đúng thứ tự, không tự mở rộng scope, không báo COMPLETE khi chưa đủ evidence và không sửa lint/config để che lỗi source.

---

## 1. Nguyên tắc làm việc

AI phải coi mỗi `review-slice-*.md` là một work order độc lập.

Mỗi lượt chỉ làm **một slice** đang active.

Không được tự gộp nhiều slice chỉ vì các file liên quan nhau.

Không được sửa trước các slice chưa được mở nếu thay đổi đó không bắt buộc để slice hiện tại pass.

### Architecture invariant

Shared UI phải giữ hướng dependency:

```text
Feature Page
  -> Page/Layout composition
  -> UI Pattern
  -> Primitive
  -> Design Token
```

Shared UI không được sở hữu business permission, persistence, feature routing, CRUD orchestration hoặc feature API policy.

---

## 2. Thứ tự thực hiện hiện tại

```text
01D Typed Linting + Strict TS
  -> 01E Angular Template Accessibility
  -> 01F ESLint Verification + Final Quality Gates
```

Chỉ khi:

```text
SLICE_01D_COMPLETE
SLICE_01E_COMPLETE
SLICE_01F_COMPLETE
```

mới được báo:

```text
ESLINT_REMEDIATION_COMPLETE
```

Không nhảy thẳng tới 01F nếu 01D hoặc 01E chưa pass.

---

## 3. Workflow bắt buộc cho mỗi slice

### Step 1 — đọc context

Đọc:

```text
docs/engineering/eslint-standard.md
eslint.config.mjs
package.json
<active review slice file>
```

Nếu slice liên quan source cụ thể thì đọc toàn bộ file production/test liên quan trước khi sửa.

### Step 2 — ghi baseline

Trước khi code, xác định:

```text
BASE_COMMIT=<current master HEAD>
ACTIVE_SLICE=<file name>
```

Không dựa vào commit message để đánh giá implementation.

### Step 3 — chạy gate hiện tại

Chạy gate liên quan trước khi sửa để biết lỗi thật.

Ví dụ ESLint:

```bash
npm run lint:verify
npm run lint
npm run typecheck
```

Ghi lại lỗi thật; không đoán.

### Step 4 — sửa source/config tối thiểu

Chỉ sửa file cần thiết để pass acceptance của slice.

Ưu tiên:

```text
fix source
> fix test
> narrow config correction
> documented exception
```

Không ưu tiên disable rule.

### Step 5 — thêm/update test

Mỗi behavior được sửa phải có test hoặc executable verification tương ứng nếu slice yêu cầu.

### Step 6 — chạy toàn bộ gate của slice

Không báo complete trước khi tất cả command bắt buộc chạy xong.

### Step 7 — tự review diff

Kiểm:

```bash
git diff <BASE_COMMIT>...HEAD
```

hoặc equivalent.

Xác nhận không có unrelated changes.

### Step 8 — commit/push

Commit message phải mô tả implementation thật, không được claim `complete` nếu gate chưa pass.

---

## 4. Quy tắc chống lách lint

AI MUST NOT làm các việc sau chỉ để gate xanh:

```text
- đổi error -> warn
- đổi error -> off
- thêm blanket eslint-disable
- thêm @ts-ignore
- thêm @ts-nocheck
- thêm as any để né type error
- exclude source/test bình thường khỏi eslint
- rename dead variable thành _foo thay vì xóa
- thêm void unusedValue để giả vờ variable được dùng
- xóa/giảm verification test vì config không pass
```

Nếu rule phát hiện nhiều legacy violation, AI phải sửa source theo scope hoặc đề xuất migration slice riêng; không được âm thầm hạ rule.

---

## 5. Exception protocol

Chỉ dùng exception nếu có technical reason thực sự.

Example:

```ts
// eslint-disable-next-line <exact-rule>
// Reason: third-party SDK callback contract requires this parameter; tracking: TECH-123
```

Exception bắt buộc:

```text
- đúng 1 rule;
- đúng scope nhỏ nhất;
- có reason cụ thể;
- có tracking item nếu là debt;
- được report trong final summary.
```

Không chấp nhận:

```ts
/* eslint-disable */
```

hoặc comment reason chung chung như `legacy`, `temporary`, `fix lint`.

---

## 6. Test philosophy

Test phải chứng minh behavior/contract thật, không phải chỉ tăng coverage.

### Good test

```text
Input invalid -> exact expected ruleId xuất hiện.
Input valid -> zero lint error/warning.
```

### Bad test

```text
script exits 0
```

mà không assert rule cụ thể.

Đối với Angular component projection/integration, dùng Angular HostComponent thật; không fake DOM bằng `document.createElement()` nếu mục tiêu là test Angular projection.

---

## 7. Pseudo-code self-review loop

```text
read(active_slice)
read(current_config_and_source)

baseline = current_master_head()

failures_before = run_required_gates()

for each acceptance_item in active_slice:
    inspect_relevant_code()
    implement_smallest_correct_fix()
    add_or_update_test()

format_changed_files()

results = run_all_slice_gates()

if any results fail:
    status = REVISION_REQUIRED
    report first actionable failures
    DO NOT claim COMPLETE
else:
    inspect_diff(baseline, HEAD)
    ensure no unrelated scope
    status = SLICE_xx_COMPLETE
```

---

## 8. Required completion report

AI final response cho mỗi slice phải theo format ngắn nhưng đủ evidence:

```text
SLICE: 01D
STATUS: SLICE_01D_COMPLETE | REVISION_REQUIRED

CHANGED
- eslint.config.mjs
- ...

GATES
- npm run lint:verify : PASS/FAIL
- npm run lint        : PASS/FAIL
- npm run typecheck   : PASS/FAIL
- npm test            : PASS/FAIL
- npm run build       : PASS/FAIL

TESTS ADDED/UPDATED
- invalid-any -> no-explicit-any
- ...

EXCEPTIONS
- none
```

Nếu FAIL:

```text
FIRST_BLOCKER
<file>:<line>
<rule/error>
<why it still fails>
```

Không viết `done`, `completed`, `all good` nếu status vẫn `REVISION_REQUIRED`.

---

## 9. Reviewer's acceptance rule

Reviewer sẽ đánh giá code hiện tại trên `master`, không tin:

```text
- commit message;
- checklist đã tick;
- issue status;
- README claim;
- Vercel status riêng lẻ.
```

Code + test + executable gates mới là evidence.

Nếu review phát hiện implementation lệch work order, slice sẽ bị trả lại dù commit message ghi `complete`.

---

## 10. Definition of AI execution complete

AI workflow được coi là đúng khi:

- [ ] chỉ làm active slice;
- [ ] đọc standard/config trước khi sửa;
- [ ] không weaken rule;
- [ ] có test cho behavior mới;
- [ ] chạy đủ gate;
- [ ] report PASS/FAIL từng gate;
- [ ] không claim complete khi gate fail;
- [ ] diff không có unrelated change;
- [ ] exception, nếu có, được document;
- [ ] push implementation lên `master` theo workflow của repo.

Sau khi hoàn thành một slice, dừng lại để review. Không tự bắt đầu slice tiếp theo trước khi slice hiện tại được reviewer chấp nhận.