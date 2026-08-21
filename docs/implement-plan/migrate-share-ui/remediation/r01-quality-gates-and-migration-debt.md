# R01 — Quality Gates and Migration Debt Removal

## Objective

Remove obvious first-pass migration debt before deeper refactors. After this phase, code changed by the migration must no longer rely on compatibility APIs or dead mapping functions, and formatting/linting must prevent sloppy code from returning.

## Scope

Primary files:

```text
package.json
eslint configuration
prettier configuration
src/app/shared/ui/primitives/button/**
src/app/shared/ui/layout/action-toolbar/**
all Button consumers under src/
```

## Current problems to eliminate

### Button compatibility contract

Current behavior includes legacy forms such as:

```ts
ButtonSize = 'sm' | 'md' | 'lg' | 'small' | 'large';
set text(...)
set severity(...)
normalizedSize()
```

This is explicitly transitional code and must not survive the remediation.

### ActionToolbar dead migration code

`buttonVariant()` is the new mapping while legacy `severity()` still exists. Remove the dead mapper after consumers are migrated.

### Formatting inconsistency

Formatting issues in recently modified source indicate there is no hard formatting/lint gate protecting `master`.

## Implementation steps

### 1. Inventory legacy Button consumers

Run:

```bash
rg "severity=|\[severity\]" src
rg "\[text\]|text=\"" src
rg "size=\"small\"|size=\"large\"|\[size\]=\"'small'\"|\[size\]=\"'large'\"" src
```

Classify every usage by intent rather than direct string mapping.

Expected intent migration:

```text
primary task              -> variant="primary"
normal secondary action   -> variant="secondary"
low-emphasis/icon action  -> variant="ghost"
destructive action        -> variant="destructive"
```

Do not map success/info/warn mechanically without understanding the action.

### 2. Rewrite Button contract

Target:

```ts
export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'destructive';

export type ButtonSize = 'sm' | 'md' | 'lg';

export class Button {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  // no severity setter
  // no text setter
  // no normalized legacy-size mapper
}
```

### 3. Clean ActionToolbar

Remove legacy `severity()` completely.

Prefer the public action type itself to use the final semantic vocabulary:

```ts
export type ActionToolbarVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'destructive';
```

Do not keep `danger`, `warning`, `default` aliases unless a concrete non-legacy use case remains and is documented.

### 4. Add format scripts

Add scripts similar to:

```json
{
  "format": "prettier --write .",
  "format:check": "prettier --check ."
}
```

Respect existing Prettier configuration. Avoid formatting generated/output folders if needed using `.prettierignore`.

### 5. Add Angular ESLint

Add an Angular-compatible ESLint setup for the repository version.

Minimum goals:

```text
no unused variables/imports
prefer const
eqeqeq
consistent component/directive conventions
template accessibility rules
no newly introduced explicit any in shared UI
```

If enforcing `no-explicit-any` repo-wide would fail on unrelated legacy code, scope the hard rule to `src/app/shared/ui/**` first. Do not weaken the rule for newly changed code.

## Tests

Update Button tests to assert final API only:

```ts
it('defaults to primary/md')
it('renders destructive variant')
it('disables while loading')
it('provides accessible name for icon-only button')
it('emits once on normal activation')
```

Do not add tests for legacy `severity`, `text`, `small`, or `large`; those APIs must be gone.

Run:

```bash
npm run format:check
npm run lint
npm run build
npm test -- --watch=false
npm run build-storybook
```

## Legacy gate

Expected zero:

```bash
rg "@Input\(\).*severity|set severity|set text" src/app/shared/ui/primitives/button
rg "'small' \| 'large'|small' \| 'large'" src/app/shared/ui/primitives/button
rg "severity=|\[severity\]|\[text\]" src
```

If unrelated non-Button components legitimately expose a property with the same name, inspect each result rather than claiming zero blindly.

## Definition of Done

- Button exposes only final `variant` and `sm|md|lg` size APIs.
- All Button consumers compile without compatibility setters.
- `ActionToolbar.severity()` is deleted.
- Recently migrated code is Prettier-clean.
- ESLint exists and has a runnable script.
- format/lint/build/unit/Storybook build pass.
- No compatibility comment or TODO remains for this migration.