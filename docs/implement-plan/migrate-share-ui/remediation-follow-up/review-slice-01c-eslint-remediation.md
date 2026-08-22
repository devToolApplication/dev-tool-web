# Review Slice 01C — ESLint Remediation

Baseline: `master` at `ccda5512a607b280a303f5d9c850a4ab4e13d5b2`.

Status: `REVISION_REQUIRED`.

Scope của slice này chỉ sửa 5 blocker còn lại của ESLint. Không mở rộng sang Table/Tree/Drawer/Form architecture.

---

## 1. Fix Angular ESLint version mismatch

Hiện repo dùng Angular/CLI 21 nhưng đang cài `angular-eslint` 22.1.0. Lockfile của major 22 yêu cầu `@angular/cli >=22 <23`, nên đây là dependency mismatch.

### Checklist

- [ ] Dùng `angular-eslint` major tương thích Angular 21.
- [ ] Xóa toàn bộ `@angular-eslint/*` / `angular-eslint` major 22 khỏi `package.json` và lockfile.
- [ ] Không upgrade Angular project lên 22 trong slice này.
- [ ] Sau `npm install`, `npm ls` không còn peer dependency mismatch liên quan Angular ESLint.

### Gate

```bash
npm ls angular-eslint @angular-eslint/eslint-plugin @angular-eslint/eslint-plugin-template @angular-eslint/template-parser
```

Không được xuất hiện package major 22 khi app vẫn Angular 21.

---

## 2. Bật typed linting thật

Current config đang dùng `tseslint.configs.recommended`, chưa có type-aware linting.

### Target

```js
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';

export default defineConfig(
  {
    files: ['**/*.ts'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
      ...angular.configs.tsRecommended,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    processor: angular.processInlineTemplates,
  },
);
```

Nếu API của version thực tế khác, giữ nguyên intent: **type-aware linting + project service**.

### Checklist

- [ ] `recommendedTypeChecked` bật.
- [ ] `stylisticTypeChecked` bật.
- [ ] `projectService: true` bật.
- [ ] Không fallback về `recommended` thường chỉ để lint xanh.

---

## 3. Restore strict TypeScript rules

Current config đang tắt nhiều rule mà plan bắt buộc.

### Bắt buộc

```js
'@typescript-eslint/no-unused-vars': [
  'error',
  {
    argsIgnorePattern: '^_',
    varsIgnorePattern: '^_',
    caughtErrorsIgnorePattern: '^_',
  },
],

'@typescript-eslint/no-explicit-any': 'error',
'@typescript-eslint/no-floating-promises': 'error',
'@typescript-eslint/no-misused-promises': 'error',
'@typescript-eslint/consistent-type-imports': 'error',
'no-duplicate-imports': 'error',
'no-unreachable': 'error',
'eqeqeq': ['error', 'always'],
'curly': ['error', 'all'],
```

### Shared UI override

```js
{
  files: ['src/app/shared/**/*.ts'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          { group: ['@features/**', '**/features/**'] },
          { group: ['@core/auth/**', '**/core/auth/**'] },
        ],
      },
    ],
  },
}
```

### Không được làm

- Không đổi `error -> warn/off` để pass existing code.
- Không dùng `as any` để né type error.
- Không blanket `eslint-disable`.
- Không ignore thêm `src/**`, tests bình thường hoặc `e2e/**` chỉ để lint xanh.
- Nếu rule phát hiện code lỗi, sửa source.

---

## 4. Restore Angular template accessibility rules

Current config extends `templateAccessibility` nhưng lại tắt các rule quan trọng ngay sau đó.

### Phải bật lại

Không được `off` các rule sau nếu không có exception cực hẹp và có lý do:

```text
@angular-eslint/template/click-events-have-key-events
@angular-eslint/template/interactive-supports-focus
@angular-eslint/template/label-has-associated-control
@angular-eslint/template/elements-content
```

### Checklist

- [ ] `templateRecommended` hoạt động.
- [ ] `templateAccessibility` hoạt động.
- [ ] Không blanket-disable accessibility rule.
- [ ] Sửa template/source khi lint bắt lỗi.
- [ ] Nếu một exception thật sự cần thiết, chỉ override đúng file/rule và ghi reason trong `docs/engineering/eslint-standard.md`.

---

## 5. Add executable ESLint verification test

Không được chỉ tin rằng config "có vẻ đúng".

Tạo verification script hoặc ESLint Node API test để chứng minh ít nhất 4 case:

```text
invalid-unused        -> FAIL no-unused-vars
invalid-any           -> FAIL no-explicit-any
invalid-floating      -> FAIL no-floating-promises
valid-example         -> PASS
```

Recommended:

```text
tools/eslint-verification/
  verify-eslint.mjs
```

Pseudo-code:

```js
import { ESLint } from 'eslint';

const eslint = new ESLint({ overrideConfigFile: 'eslint.config.mjs' });

async function lint(code, filePath) {
  const [result] = await eslint.lintText(code, { filePath });
  return result.messages.map((message) => message.ruleId);
}

expect(await lint('const unused = 1;', 'src/app/shared/test.ts'))
  .toContain('@typescript-eslint/no-unused-vars');

expect(await lint('export const f = (v: any) => v;', 'src/app/shared/test.ts'))
  .toContain('@typescript-eslint/no-explicit-any');
```

Thêm script:

```json
{
  "scripts": {
    "lint:verify": "node tools/eslint-verification/verify-eslint.mjs"
  }
}
```

Verification script phải exit code `1` nếu expected rule không fire hoặc valid example có lint error.

---

## 6. Clean config after implementation

`eslint.config.mjs` hiện có nhiều `off` để accommodate code cũ. Sau khi sửa source:

- [ ] Xóa các `off` không còn lý do.
- [ ] Không giữ temporary compatibility rule.
- [ ] Không ignore `e2e/**` nếu đó là source test bình thường.
- [ ] `docs/engineering/eslint-standard.md` phải phản ánh rule thật, không chỉ guideline chung.

---

## 7. Commands bắt buộc

```bash
npm ci
npm run format:check
npm run lint
npm run lint:verify
npm run typecheck
npm test -- --watch=false
npm run build
```

Tất cả phải exit `0`.

Nếu Vercel/build đang fail, phải đọc lỗi và sửa trong scope liên quan; không được báo complete chỉ vì local lint pass.

---

## 8. Definition of Done

Chỉ báo `SLICE_01C_COMPLETE` khi:

- [ ] Angular 21 không còn kéo Angular ESLint 22.
- [ ] Không còn peer mismatch Angular ESLint/CLI.
- [ ] Typed linting hoạt động.
- [ ] `projectService: true` hoạt động.
- [ ] `no-explicit-any` là `error` cho shared code.
- [ ] `no-floating-promises` là `error`.
- [ ] `no-misused-promises` là `error`.
- [ ] unused import/vars vẫn là `error`.
- [ ] `consistent-type-imports` và `no-duplicate-imports` không bị tắt.
- [ ] Angular template accessibility rules hoạt động.
- [ ] Không blanket-ignore tests/e2e để lint xanh.
- [ ] Có executable `lint:verify` proving invalid cases fail + valid case pass.
- [ ] `npm run format:check` PASS.
- [ ] `npm run lint` PASS.
- [ ] `npm run lint:verify` PASS.
- [ ] `npm run typecheck` PASS.
- [ ] unit tests PASS.
- [ ] build PASS.

Không bắt đầu Slice 02 cho tới khi `SLICE_01C_COMPLETE`.
