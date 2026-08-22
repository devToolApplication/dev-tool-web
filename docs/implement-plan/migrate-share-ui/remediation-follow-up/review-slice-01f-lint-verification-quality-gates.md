# Review Slice 01F — ESLint Verification + Final Quality Gates

Baseline: complete Slice 01D and Slice 01E first.

Status: `BLOCKED_BY_01D_01E` until both previous slices are complete.

Scope của slice này không thêm rule architecture mới. Mục tiêu là chứng minh bộ ESLint đã hoạt động đúng bằng executable verification và đóng toàn bộ quality gate của ESLint remediation.

---

## 1. Vấn đề hiện tại

Repo đã có:

```text
tools/eslint-verification/verify-eslint.mjs
```

nhưng verification hiện mới chứng minh:

- unused variable bị bắt;
- restricted import trong Shared UI bị bắt;
- một valid TS example pass.

Nó chưa đủ để chứng minh các rule quan trọng sau hoạt động:

```text
no-explicit-any
no-floating-promises
no-misused-promises
Angular template accessibility
typed linting thật
```

Slice này biến `lint:verify` thành contract executable để AI không thể đổi config mà vô tình làm rule mất hiệu lực.

---

## 2. Verification harness target

Giữ test harness nhỏ, deterministic, không phụ thuộc app runtime.

Pseudo code:

```js
import assert from 'node:assert/strict';
import { ESLint } from 'eslint';

const eslint = new ESLint();

async function lint(code, filePath) {
  const [result] = await eslint.lintText(code, { filePath });

  return {
    errorCount: result?.errorCount ?? 0,
    warningCount: result?.warningCount ?? 0,
    ruleIds: (result?.messages ?? [])
      .map((message) => message.ruleId)
      .filter(Boolean),
  };
}

function expectRule(result, ruleId) {
  assert(
    result.ruleIds.includes(ruleId),
    `Expected ${ruleId}; got ${result.ruleIds.join(', ')}`,
  );
}

function expectClean(result) {
  assert.equal(result.errorCount, 0);
  assert.equal(result.warningCount, 0);
}
```

Không hardcode output text của ESLint vì message có thể đổi theo version. Assert theo `ruleId` và error count.

---

## 3. Verification matrix bắt buộc

`npm run lint:verify` phải chạy ít nhất các case sau.

| Case | File path giả lập | Expected |
|---|---|---|
| unused variable | `src/app/verification/invalid-unused.ts` | `no-unused-vars` |
| explicit any shared | `src/app/shared/ui/verification/invalid-any.ts` | `no-explicit-any` |
| floating promise | `src/app/verification/invalid-floating-promise.ts` | `no-floating-promises` |
| misused promise | `src/app/verification/invalid-misused-promise.ts` | `no-misused-promises` |
| forbidden shared import | `src/app/shared/ui/verification/invalid-import.ts` | `no-restricted-imports` |
| bad click template | `src/app/verification/invalid-click.html` | a11y rule |
| bad label template | `src/app/verification/invalid-label.html` | label association rule |
| valid typed TS | `src/app/verification/valid.ts` | zero error/warning |
| valid semantic HTML | `src/app/verification/valid.html` | zero error/warning |

---

## 4. Pseudo-code test suite

```js
async function verifyUnusedVariable() {
  const result = await lint(
    'const unusedVariable = 1;',
    'src/app/verification/invalid-unused.ts',
  );

  expectRule(result, '@typescript-eslint/no-unused-vars');
}

async function verifyExplicitAny() {
  const result = await lint(
    'export function parse(value: any): any { return value; }',
    'src/app/shared/ui/verification/invalid-any.ts',
  );

  expectRule(result, '@typescript-eslint/no-explicit-any');
}

async function verifyFloatingPromise() {
  const result = await lint(
    `
      async function persist(): Promise<void> {}
      persist();
    `,
    'src/app/verification/invalid-floating-promise.ts',
  );

  expectRule(result, '@typescript-eslint/no-floating-promises');
}

async function verifyRestrictedImport() {
  const result = await lint(
    "import { AuthService } from '@core/auth/auth.service';",
    'src/app/shared/ui/verification/invalid-import.ts',
  );

  expectRule(result, 'no-restricted-imports');
}

async function verifyTemplateClick() {
  const result = await lint(
    '<div (click)="run()">Run</div>',
    'src/app/verification/invalid-click.html',
  );

  assert(
    result.ruleIds.includes('@angular-eslint/template/click-events-have-key-events') ||
      result.ruleIds.includes('@angular-eslint/template/interactive-supports-focus'),
  );
}

async function verifyValidTypescript() {
  const result = await lint(
    `
      async function persist(): Promise<void> {}
      export async function run(): Promise<void> {
        await persist();
      }
    `,
    'src/app/verification/valid.ts',
  );

  expectClean(result);
}
```

Các sample có thể điều chỉnh nếu semantics của rule/version yêu cầu, nhưng matrix expected không được giảm.

---

## 5. Fail-fast execution

Verification script phải exit non-zero khi bất kỳ contract nào fail.

Pseudo code:

```js
async function main() {
  await verifyUnusedVariable();
  await verifyExplicitAny();
  await verifyFloatingPromise();
  await verifyMisusedPromise();
  await verifyRestrictedImport();
  await verifyTemplateClick();
  await verifyTemplateLabel();
  await verifyValidTypescript();
  await verifyValidTemplate();

  console.log('ESLINT_VERIFICATION_COMPLETE');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

Không được catch rồi `process.exit(0)`.

---

## 6. package.json contract

Bắt buộc giữ:

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "lint:verify": "node tools/eslint-verification/verify-eslint.mjs",
    "typecheck": "tsc --noEmit"
  }
}
```

Optional convenience gate:

```json
{
  "scripts": {
    "quality": "npm run format:check && npm run lint:verify && npm run lint && npm run typecheck && npm test -- --watch=false && npm run build"
  }
}
```

Không bắt buộc tạo `quality`, nhưng nếu tạo thì phải fail-fast bằng `&&`.

---

## 7. Documentation sync

Update `docs/engineering/eslint-standard.md` để AI biết verification là mandatory.

Phải có nội dung tương đương:

```text
Before reporting a TypeScript/Angular task complete:
1. Run npm run lint:verify.
2. Run npm run lint.
3. Run npm run typecheck.
4. Run relevant unit tests.
5. Run npm run build for shared/config changes.
6. Never weaken rules to make a failing gate pass.
```

Nếu sửa ESLint config thì `lint:verify` là gate bắt buộc đầu tiên.

---

## 8. Final commands

Chạy đúng thứ tự:

```bash
npm ci
npm ls angular-eslint @angular-eslint/eslint-plugin @angular-eslint/eslint-plugin-template @angular-eslint/template-parser
npm run format:check
npm run lint:verify
npm run lint
npm run typecheck
npm test -- --watch=false
npm run build
```

Nếu `npm ci` không phù hợp môi trường local do lockfile policy, dùng install command chuẩn của repo nhưng phải chứng minh lockfile reproducible.

---

## 9. Evidence AI phải report

AI không được chỉ nói "all passed".

Report tối thiểu:

```text
SLICE_01F_RESULT

npm run lint:verify : PASS
npm run lint        : PASS
npm run typecheck   : PASS
npm test            : PASS (<N> tests)
npm run build       : PASS

Angular ESLint      : 21.x
ESLint              : <version>
typescript-eslint   : <version>

Changed files:
- ...
```

Nếu command fail:

```text
STATUS: REVISION_REQUIRED
FAILED_GATE: npm run lint
FIRST_ERROR: <short exact error>
```

Không được báo COMPLETE khi còn failed gate.

---

## 10. Definition of Done

Chỉ báo `SLICE_01F_COMPLETE` khi:

- [ ] `lint:verify` test đủ matrix bắt buộc;
- [ ] invalid cases fail đúng `ruleId`;
- [ ] valid TS case pass;
- [ ] valid template case pass;
- [ ] verification exit non-zero khi contract fail;
- [ ] docs engineering sync với gate thực tế;
- [ ] package scripts đúng contract;
- [ ] Angular ESLint vẫn 21-compatible;
- [ ] `npm run format:check` PASS;
- [ ] `npm run lint:verify` PASS;
- [ ] `npm run lint` PASS;
- [ ] `npm run typecheck` PASS;
- [ ] unit tests PASS;
- [ ] build PASS.

Khi 01D + 01E + 01F đều COMPLETE thì mới được báo:

```text
ESLINT_REMEDIATION_COMPLETE
```

Sau đó mới chuyển sang review slice UI tiếp theo.