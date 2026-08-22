# Review Slice 01D — Typed Linting + Strict TypeScript Rules

Baseline: `master` at `d367f1fb3ccf83ad99412b24527ddbb887443c86`.

Status: `REVISION_REQUIRED`.

Scope của slice này chỉ xử lý TypeScript ESLint. Không sửa Angular template accessibility trong file này và không mở rộng sang Table/Tree/Drawer/Form architecture.

---

## 1. Vấn đề hiện tại

`eslint.config.mjs` hiện vẫn dùng:

```js
...tseslint.configs.recommended
```

và chưa bật type-aware linting. Các rule quan trọng vẫn đang `off`:

```js
'@typescript-eslint/no-explicit-any': 'off',
'@typescript-eslint/no-floating-promises': 'off',
'@typescript-eslint/no-misused-promises': 'off',
'@typescript-eslint/consistent-type-imports': 'off',
'no-duplicate-imports': 'off',
'curly': 'off',
```

Shared UI override cũng chưa bật lại `no-explicit-any`.

Mục tiêu của slice này: ESLint phải thực sự dùng TypeScript type information và chặn các lỗi type/promise quan trọng thay vì chỉ chạy syntax lint.

---

## 2. Bật typed linting thật

### Target pseudo code

```js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/storybook-static/**',
      '**/.angular/**',
      '**/tools/eslint-verification/fixtures/**',
    ],
  },

  {
    files: ['src/**/*.ts'],

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

Nếu API của `typescript-eslint` version hiện tại có khác biệt nhỏ thì dùng API hợp lệ tương đương, nhưng bắt buộc giữ hai điều:

1. type-aware rules thật sự được load;
2. parser có project/type information thật sự.

### Không được làm

```js
parserOptions: {
  project: false
}
```

hoặc quay lại `recommended` thường chỉ để lint chạy nhanh hơn.

---

## 3. Strict rules bắt buộc

Trong scope `src/**/*.ts`, target tối thiểu:

```js
rules: {
  '@typescript-eslint/no-unused-vars': [
    'error',
    {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
    },
  ],

  '@typescript-eslint/no-floating-promises': 'error',
  '@typescript-eslint/no-misused-promises': 'error',
  '@typescript-eslint/consistent-type-imports': [
    'error',
    {
      prefer: 'type-imports',
      fixStyle: 'separate-type-imports',
    },
  ],

  'no-duplicate-imports': 'error',
  'no-unreachable': 'error',
  eqeqeq: ['error', 'always'],
  curly: ['error', 'all'],
}
```

### `no-explicit-any`

Không cần bắt toàn repo phải sạch `any` trong cùng một commit nếu legacy code quá lớn. Nhưng Shared UI bắt buộc strict ngay:

```js
{
  files: ['src/app/shared/**/*.ts'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
  },
}
```

Nếu production ngoài `shared` vẫn còn legacy `any`, có thể giữ scoped migration tạm thời, nhưng không được để `no-explicit-any: off` trong Shared UI.

---

## 4. Sửa source thay vì tắt rule

Khi bật typed rules, AI phải sửa code thật.

### Example: explicit any

Sai:

```ts
function normalize(value: any): any {
  return value;
}
```

Target:

```ts
function normalize(value: unknown): string {
  return String(value);
}
```

Hoặc generic rõ ràng:

```ts
function identity<T>(value: T): T {
  return value;
}
```

### Example: floating promise

Sai:

```ts
saveModel(model);
```

Target khi cần chờ:

```ts
await saveModel(model);
```

Target khi intentional fire-and-forget:

```ts
void refreshCache();
```

Chỉ dùng `void` nếu thực sự intentional; không dùng nó để che lỗi promise mà caller cần xử lý.

### Example: type-only import

Sai:

```ts
import { FormConfig, createFormEngine } from './form-engine';
```

Target:

```ts
import { createFormEngine } from './form-engine';
import type { FormConfig } from './form-engine';
```

---

## 5. Test bắt buộc

Mở rộng `tools/eslint-verification/verify-eslint.mjs` hoặc tạo test file riêng cho typed TS rules.

### Test A — explicit any trong Shared UI phải fail

Pseudo code:

```js
const ruleIds = await lint(
  'export function parse(value: any): any { return value; }',
  'src/app/shared/ui/verification/invalid-any.ts',
);

assert(ruleIds.includes('@typescript-eslint/no-explicit-any'));
```

Phải trigger ít nhất 1 `no-explicit-any`.

### Test B — floating promise phải fail

Pseudo code:

```js
const ruleIds = await lint(
  `
  async function persist(): Promise<void> {}
  persist();
  `,
  'src/app/verification/invalid-floating-promise.ts',
);

assert(ruleIds.includes('@typescript-eslint/no-floating-promises'));
```

Test này đồng thời chứng minh typed linting thực sự hoạt động.

### Test C — misused promise phải fail

Pseudo code:

```js
const ruleIds = await lint(
  `
  async function handler(): Promise<void> {}
  [1].forEach(async () => handler());
  `,
  'src/app/verification/invalid-misused-promise.ts',
);

assert(ruleIds.includes('@typescript-eslint/no-misused-promises'));
```

Nếu sample cụ thể không trigger do rule semantics/version, dùng một invalid sample khác nhưng phải chứng minh đúng rule.

### Test D — valid typed code phải pass

```js
const ruleIds = await lint(
  `
  async function persist(): Promise<void> {}
  export async function run(): Promise<void> {
    await persist();
  }
  `,
  'src/app/verification/valid-typed.ts',
);

assert.deepStrictEqual(ruleIds, []);
```

---

## 6. Search gates

```bash
rg "recommendedTypeChecked|strictTypeChecked" eslint.config.mjs
```

Expected: ít nhất một type-checked preset thật sự được dùng.

```bash
rg "projectService:\s*true" eslint.config.mjs
```

Expected: có match.

```bash
rg "no-explicit-any': 'off'" eslint.config.mjs
```

Expected: không được có rule `off` áp dụng cho `src/app/shared/**/*.ts`.

```bash
rg "no-floating-promises': 'off'|no-misused-promises': 'off'" eslint.config.mjs
```

Expected: zero trong production TS scope.

---

## 7. Commands bắt buộc

```bash
npm run lint:verify
npm run lint
npm run typecheck
npm test -- --watch=false
npm run build
```

---

## 8. Definition of Done

Chỉ báo `SLICE_01D_COMPLETE` khi:

- [ ] type-aware config được bật;
- [ ] parser có project/type information;
- [ ] `no-floating-promises` = error;
- [ ] `no-misused-promises` = error;
- [ ] `consistent-type-imports` được enforce;
- [ ] `no-duplicate-imports` được enforce;
- [ ] `eqeqeq` strict;
- [ ] `curly` strict;
- [ ] Shared UI `no-explicit-any` = error;
- [ ] source được sửa thay vì disable rule;
- [ ] verification test chứng minh explicit-any fail;
- [ ] verification test chứng minh floating promise fail;
- [ ] verification test chứng minh misused promise fail;
- [ ] valid typed example pass;
- [ ] lint PASS;
- [ ] typecheck PASS;
- [ ] unit tests PASS;
- [ ] build PASS.

Không bắt đầu Slice 01E nếu Slice 01D chưa pass.