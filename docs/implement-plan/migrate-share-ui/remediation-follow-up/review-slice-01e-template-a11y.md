# Review Slice 01E — Angular Template Accessibility Enforcement

Baseline: complete Slice 01D first.

Status: `BLOCKED_BY_01D` until `SLICE_01D_COMPLETE`.

Scope của slice này chỉ xử lý Angular template accessibility lint và các source/template violation mà rule phát hiện. Không chỉnh TypeScript architecture ngoài phần cần thiết để template pass.

---

## 1. Vấn đề hiện tại

`eslint.config.mjs` có load:

```js
...angular.configs.templateAccessibility
```

nhưng sau đó lại tắt các rule quan trọng:

```js
'@angular-eslint/template/click-events-have-key-events': 'off',
'@angular-eslint/template/interactive-supports-focus': 'off',
'@angular-eslint/template/label-has-associated-control': 'off',
'@angular-eslint/template/elements-content': 'off',
```

Điều này làm accessibility preset gần như bị vô hiệu ở các case cần enforce.

Mục tiêu: template lint phải bắt được semantic/a11y regression thực sự và AI phải sửa markup thay vì blanket-disable rule.

---

## 2. Target config

Pseudo code:

```js
{
  files: ['src/**/*.html'],
  extends: [
    ...angular.configs.templateRecommended,
    ...angular.configs.templateAccessibility,
  ],
  rules: {
    '@angular-eslint/template/click-events-have-key-events': 'error',
    '@angular-eslint/template/interactive-supports-focus': 'error',
    '@angular-eslint/template/label-has-associated-control': 'error',
    '@angular-eslint/template/elements-content': 'error',
  },
}
```

Không cần override explicit nếu preset đã trả đúng severity; quan trọng là không được tắt các rule này.

### Rule có thể cần exception thực sự

Nếu `no-autofocus` hoặc rule khác conflict với requirement sản phẩm, exception phải narrow, có reason cụ thể và không được dùng để tắt cả accessibility preset.

Sai:

```js
'@angular-eslint/template/click-events-have-key-events': 'off'
```

Chỉ chấp nhận exception cục bộ khi thực sự có lý do kỹ thuật và component đó đã có semantic tương đương.

---

## 3. Cách sửa template đúng

### Case A — clickable non-interactive element

Sai:

```html
<div (click)="openDetails()">
  Open
</div>
```

Ưu tiên sửa semantic:

```html
<button type="button" (click)="openDetails()">
  Open
</button>
```

Nếu bắt buộc phải giữ element không phải button vì layout/library constraint:

```html
<div
  role="button"
  tabindex="0"
  (click)="openDetails()"
  (keydown.enter)="openDetails()"
  (keydown.space)="openDetails()"
>
  Open
</div>
```

Nhưng ưu tiên element semantic native trước.

### Case B — label không gắn control

Sai:

```html
<label>Name</label>
<input />
```

Target:

```html
<label for="name-input">Name</label>
<input id="name-input" />
```

Hoặc wrap control nếu pattern hợp lệ:

```html
<label>
  <span>Name</span>
  <input />
</label>
```

### Case C — icon-only button

Sai:

```html
<button type="button">
  <i class="pi pi-trash"></i>
</button>
```

Target:

```html
<button type="button" aria-label="Delete">
  <i class="pi pi-trash" aria-hidden="true"></i>
</button>
```

Nếu app dùng translate pipe/directive thì aria label phải theo convention hiện tại của codebase.

---

## 4. Không được lách lint

AI MUST NOT:

```html
<!-- eslint-disable -->
```

chỉ để template pass.

Không đổi:

```js
'click-events-have-key-events': 'error'
```

thành `off` hoặc `warn` vì source hiện có nhiều violation.

Phải sửa từng violation theo semantic đúng.

Nếu số violation quá lớn, có thể tách migration thành file-list/commit nhỏ, nhưng rule cuối cùng vẫn phải `error`.

---

## 5. Verification test bắt buộc

Mở rộng `tools/eslint-verification/verify-eslint.mjs` để test `.html` trực tiếp.

### Test A — click without keyboard phải fail

Pseudo code:

```js
const rules = await lint(
  '<div (click)="run()">Run</div>',
  'src/app/verification/invalid-click.html',
);

assert(
  rules.includes('@angular-eslint/template/click-events-have-key-events') ||
  rules.includes('@angular-eslint/template/interactive-supports-focus'),
);
```

### Test B — label without control association phải fail

```js
const rules = await lint(
  '<label>Name</label><input />',
  'src/app/verification/invalid-label.html',
);

assert(
  rules.includes('@angular-eslint/template/label-has-associated-control'),
);
```

### Test C — semantic button phải pass

```js
const rules = await lint(
  '<button type="button">Run</button>',
  'src/app/verification/valid-button.html',
);

assert.deepStrictEqual(rules, []);
```

Nếu Angular template parser cần context khác cho inline fixture, adjust test harness nhưng giữ intent này.

---

## 6. Source cleanup strategy

AI phải chạy:

```bash
npm run lint
```

sau khi bật rule và lấy danh sách violation thật.

Sửa theo thứ tự:

1. semantic element sai (`div/span` làm button);
2. keyboard/focus issue;
3. label-control association;
4. icon-only control accessibility name;
5. elements thiếu nội dung accessible nếu rule phát hiện.

Không sửa CSS/visual behavior ngoài mức cần thiết để giữ UI giống cũ.

---

## 7. Search gates

```bash
rg "click-events-have-key-events': 'off'|interactive-supports-focus': 'off'|label-has-associated-control': 'off'|elements-content': 'off'" eslint.config.mjs
```

Expected: zero.

```bash
rg "templateAccessibility" eslint.config.mjs
```

Expected: có match.

```bash
rg "eslint-disable" src --glob '*.html'
```

Expected: không có exception mới không được giải thích.

---

## 8. Commands bắt buộc

```bash
npm run lint:verify
npm run lint
npm run typecheck
npm test -- --watch=false
npm run build
```

---

## 9. Definition of Done

Chỉ báo `SLICE_01E_COMPLETE` khi:

- [ ] Angular template recommended preset hoạt động;
- [ ] accessibility preset hoạt động;
- [ ] `click-events-have-key-events` không bị tắt;
- [ ] `interactive-supports-focus` không bị tắt;
- [ ] `label-has-associated-control` không bị tắt;
- [ ] `elements-content` không bị blanket-off;
- [ ] template violations trong `src/**` đã được sửa;
- [ ] invalid click fixture fail đúng a11y rule;
- [ ] invalid label fixture fail đúng rule;
- [ ] valid semantic button fixture pass;
- [ ] không blanket-disable template lint;
- [ ] lint PASS;
- [ ] typecheck PASS;
- [ ] unit tests PASS;
- [ ] build PASS.

Không bắt đầu Slice 01F nếu Slice 01E chưa pass.