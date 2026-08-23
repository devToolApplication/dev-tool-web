import { ESLint } from 'eslint';
import assert from 'node:assert';

const eslint = new ESLint();

async function lint(code, filePath) {
  const [result] = await eslint.lintText(code, { filePath });
  return (result?.messages ?? []).map((m) => m.ruleId);
}

async function runVerification() {
  console.log('Running ESLint rule verification checks (3 core cases)...');

  // 1. Check no-unused-vars (invalid-unused -> FAIL no-unused-vars)
  const unusedRules = await lint('const unusedVariable = 123;\n', 'src/main.ts');
  assert(
    unusedRules.includes('@typescript-eslint/no-unused-vars'),
    `Case 1 Failed: Expected @typescript-eslint/no-unused-vars rule to be triggered for unused variable, got: ${unusedRules.join(', ')}`,
  );
  console.log('? Case 1: invalid-unused -> FAIL @typescript-eslint/no-unused-vars verified');

  // 2. Check no-restricted-imports in shared UI
  const importRules = await lint(
    "import { AuthService } from '@core/auth/auth.service';\n",
    'src/app/shared/ui/test-restricted.ts',
  );
  assert(
    importRules.includes('no-restricted-imports'),
    `Case 2 Failed: Expected no-restricted-imports rule to be triggered in shared UI, got: ${importRules.join(', ')}`,
  );
  console.log('? Case 2: invalid-import -> FAIL no-restricted-imports verified in shared UI');

  // 3. Check valid-example -> PASS with 0 errors
  const validRules = await lint(
    'export function parseNum(val: unknown): string {\n  return String(val);\n}\n',
    'src/main.ts',
  );
  assert.strictEqual(
    validRules.length,
    0,
    `Case 3 Failed: Expected valid file to have 0 lint errors, got: ${validRules.join(', ')}`,
  );
  console.log('? Case 3: valid-example -> PASS verified');

  console.log('All ESLint verification test cases PASSED successfully!');
}

runVerification().catch((err) => {
  console.error('ESLint verification FAILED:', err);
  process.exit(1);
});
