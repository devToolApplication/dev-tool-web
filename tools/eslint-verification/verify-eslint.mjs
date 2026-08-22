import { ESLint } from 'eslint';
import assert from 'node:assert';

const eslint = new ESLint();

async function lint(code, filePath) {
  const [result] = await eslint.lintText(code, { filePath });
  return (result?.messages ?? []).map((m) => m.ruleId);
}

async function runVerification() {
  console.log('Running ESLint rule verification checks...');

  // 1. Check no-unused-vars
  const unusedRules = await lint('const unusedVariable = 123;\n', 'src/main.ts');
  assert(
    unusedRules.includes('@typescript-eslint/no-unused-vars'),
    `Expected @typescript-eslint/no-unused-vars rule to be triggered for unused variable, got: ${unusedRules.join(', ')}`
  );
  console.log('? @typescript-eslint/no-unused-vars verified');

  // 2. Check no-restricted-imports in shared UI
  const importRules = await lint("import { AuthService } from '@core/auth/auth.service';\n", 'src/app/shared/ui/test-restricted.ts');
  assert(
    importRules.includes('no-restricted-imports'),
    `Expected no-restricted-imports rule to be triggered in shared UI, got: ${importRules.join(', ')}`
  );
  console.log('? no-restricted-imports verified in shared UI');

  // 3. Check valid example passes with 0 errors
  const validRules = await lint('export function parseNum(val: unknown): string {\n  return String(val);\n}\n', 'src/main.ts');
  assert.strictEqual(
    validRules.length,
    0,
    `Expected valid file to have 0 lint errors, got: ${validRules.join(', ')}`
  );
  console.log('? Valid TypeScript passes cleanly');

  console.log('All ESLint verification checks PASSED successfully!');
}

runVerification().catch((err) => {
  console.error('ESLint verification FAILED:', err);
  process.exit(1);
});
