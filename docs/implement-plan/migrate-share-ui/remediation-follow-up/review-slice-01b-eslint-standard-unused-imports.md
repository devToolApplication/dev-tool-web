# Review Slice 01B — ESLint Standard + Unused Import Cleanup

Baseline: `master` at `18060e0ef3187611180188acf46af2510c54071b`.

Scope của slice này chỉ có 2 việc:

1. Thiết lập ESLint thật cho TypeScript + Angular template.
2. Dọn unused import/unused variable hiện có và biến lỗi này thành gate bắt buộc cho AI về sau.

Không sửa Table/Tree/Drawer/Form architecture trong slice này.

---

## 1. Mục tiêu

ESLint phải là executable engineering standard, không phải alias của typecheck.

AI MUST:

- sửa source để pass lint;
- không hạ rule từ `error` xuống `warn` chỉ để build xanh;
- không thêm `eslint-disable`, `@ts-ignore`, `@ts-nocheck`, `as any` để né lỗi;
- không exclude file khỏi lint nếu file đó thuộc source/test bình thường;
- chỉ cho phép exception hẹp khi có lý do kỹ thuật rõ ràng.

AI MUST NOT coi `tsc --noEmit` là lint.

---

## 2. Files cần tạo/sửa

```text
eslint.config.mjs
package.json
package-lock.json
docs/engineering/eslint-standard.md
src/**/*.ts                 # cleanup lỗi lint thật
src/**/*.html               # cleanup template lint thật nếu có
```

Không tạo `.eslintrc*`.

---

## 3. package.json target

Tách lint và typecheck thành 2 gate riêng:

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "typecheck": "tsc --noEmit"
  }
}
```

### Checklist

- [ ] `lint` không còn là `tsc --noEmit`.
- [ ] Có ESLint runtime dependency.
- [ ] Có TypeScript ESLint.
- [ ] Có Angular ESLint tương thích Angular hiện tại.
- [ ] Có Angular template lint.
- [ ] `package-lock.json` được cập nhật bằng package manager của repo.

---

## 4. eslint.config.mjs target

Dùng flat config.

Pseudo code:

```js
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';

export default defineConfig(
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'storybook-static/**',
      '.angular/**'
    ]
  },

  {
    files: ['**/*.ts'],

    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
      ...angular.configs.tsRecommended
    ],

    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    },

    processor: angular.processInlineTemplates,

    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],

      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-duplicate-imports': 'error',
      'no-unreachable': 'error',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all']
    }
  },

  {
    files: ['**/*.html'],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility
    ]
  }
);
```

Nếu package API thực tế khác, AI phải dùng API hợp lệ của version đã install nhưng giữ nguyên intent/rule strength.

---

## 5. Shared UI stricter rules

Shared UI phải strict hơn code test/helper.

Pseudo override:

```js
{
  files: ['src/app/shared/**/*.ts'],

  rules: {
    '@typescript-eslint/no-explicit-any': 'error',

    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@features/**'],
            message: 'Shared UI must not depend on feature code.'
          },
          {
            group: ['@core/auth/**'],
            message: 'Shared UI must not own application permission/auth policy.'
          }
        ]
      }
    ]
  }
}
```

Không thêm restricted import khác nếu chưa kiểm consumer thực tế.

---

## 6. Test override

Tests có thể cần scope linh hoạt hơn production nhưng không được biến thành lint-free zone.

Pseudo:

```js
{
  files: ['**/*.spec.ts', '**/*.test.ts'],

  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-floating-promises': 'error'
  }
}
```

Không tắt `no-unused-vars` trong test.

---

## 7. Unused import cleanup bắt buộc

Ví dụ hiện tại cần dọn:

```ts
import { NO_ERRORS_SCHEMA } from '@angular/core';
```

nếu không dùng thì xóa import, không thêm fake usage.

### Checklist

- [ ] Xóa `NO_ERRORS_SCHEMA` nếu không dùng.
- [ ] Xóa toàn bộ unused import lint phát hiện.
- [ ] Xóa unused local variable lint phát hiện.
- [ ] Xóa unused private method/property lint phát hiện nếu thật sự dead.
- [ ] Không rename thành `_foo` nếu variable đó đơn giản là dead code.
- [ ] Chỉ dùng `_arg` cho callback/interface contract bắt buộc phải nhận parameter nhưng implementation không dùng.

### Không được làm

```ts
void unusedValue;
```

chỉ để đánh lừa lint.

Không được:

```ts
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const dead = ...;
```

---

## 8. AI rule chống lách lint

Ghi các rule này vào `docs/engineering/eslint-standard.md`:

```text
1. Read eslint.config.mjs before editing TypeScript/Angular code.
2. Fix source code before considering ESLint config changes.
3. Never weaken a global rule to make one file pass.
4. Never replace a proper type with `any` to satisfy another lint error.
5. Never add blanket eslint-disable comments.
6. Never exclude normal source/test files from lint.
7. Remove dead imports/variables instead of manufacturing fake usage.
8. Run npm run lint and npm run typecheck before reporting complete.
```

Nếu exception thật sự cần thiết:

```ts
// eslint-disable-next-line <rule>
// Reason: <specific technical reason>; tracking: <issue/ticket>
```

Exception phải narrow một dòng/rule, không disable cả file.

---

## 9. Verification tests cho lint config

Tạo test script hoặc fixture nhỏ để chứng minh config thật sự bắt được lỗi.

Suggested fixtures:

```text
tools/eslint-fixtures/invalid-unused.ts
tools/eslint-fixtures/invalid-any.ts
tools/eslint-fixtures/invalid-floating-promise.ts
tools/eslint-fixtures/valid-example.ts
```

Expected behavior:

```ts
// invalid-unused.ts
const unused = 1;
```

phải fail `@typescript-eslint/no-unused-vars`.

```ts
// invalid-any.ts
export function parse(value: any): any {
  return value;
}
```

phải fail `@typescript-eslint/no-explicit-any`.

```ts
// valid-example.ts
export function parse(value: unknown): string {
  return String(value);
}
```

phải pass.

Nếu không muốn commit invalid fixture vào lint scope, test config bằng ESLint Node API hoặc đặt fixtures trong ignored test-fixture folder và invoke ESLint trực tiếp trong test script.

---

## 10. Commands bắt buộc

```bash
npm run format:check
npm run lint
npm run typecheck
npm test -- --watch=false
npm run build
```

`npm run lint` phải chạy ESLint thật.

`npm run typecheck` phải chạy TypeScript compiler riêng.

---

## 11. Search gates

```bash
rg '"lint"\s*:\s*"tsc --noEmit"' package.json
```

Expected: zero.

```bash
rg 'eslint-disable|@ts-ignore|@ts-nocheck' src
```

Expected: zero mới phát sinh trong slice; existing exceptions phải được review từng cái.

```bash
rg 'NO_ERRORS_SCHEMA' src/app/shared/ui/patterns/form-input/form-input.spec.ts
```

Expected: zero nếu không thực sự sử dụng schema.

---

## 12. Definition of Done

Chỉ báo `SLICE_01B_COMPLETE` khi tất cả pass:

- [ ] `eslint.config.mjs` tồn tại.
- [ ] Flat config hoạt động.
- [ ] TypeScript typed linting hoạt động.
- [ ] Angular TS lint hoạt động.
- [ ] Angular template lint hoạt động.
- [ ] Accessibility template rules hoạt động.
- [ ] `npm run lint = eslint .`.
- [ ] `npm run typecheck = tsc --noEmit`.
- [ ] `no-unused-vars` là error.
- [ ] unused import hiện tại đã được xóa.
- [ ] `no-explicit-any` là error cho shared code.
- [ ] promise correctness rules được bật.
- [ ] shared UI restricted-import boundary được bật ở scope đã verify.
- [ ] không blanket disable lint.
- [ ] lint config có verification test/fixture.
- [ ] `npm run format:check` PASS.
- [ ] `npm run lint` PASS.
- [ ] `npm run typecheck` PASS.
- [ ] unit tests PASS.
- [ ] build PASS.

Không bắt đầu Slice 02 cho tới khi `SLICE_01B_COMPLETE`.
