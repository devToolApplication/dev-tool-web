# R09 — Tests, Storybook and CI Quality Gates

## Objective

Turn the clean architecture into an enforced standard. Tests must validate behavior/accessibility rather than only creation, Storybook must cover light/dark/mobile states, and CI must reject formatting/lint/regression failures.

## Scope

```text
*.spec.ts for shared UI
*.stories.ts
.storybook/preview.ts
Storybook decorators/toolbars
package.json scripts
CI workflow files
shared testing providers/helpers
```

## 1. Isolate unit tests

Do not load the entire `SharedModule` for a primitive test unless the primitive genuinely requires it.

Bad pattern:

```ts
TestBed.configureTestingModule({
  imports: [SharedModule]
});
```

Preferred:

```text
component under test
+ direct Angular modules/providers
+ small shared test helper only when needed
```

Benefits:

```text
faster tests
clear dependency requirements
fewer transitive false positives
easier future standalone migration
```

## 2. Minimum behavior tests by component type

### Button/control

```text
rendering
CVA/value flow
disabled/readonly
loading
a11y name
keyboard behavior
focus visibility where testable
```

### Form

```text
valid/invalid submit
dirty/reset/markSaved
conditional rules
external errors
focus first invalid
validation summary
nested/complex integration
```

### Table

```text
sort event
aria-sort
pagination
selection
accessible checkbox labels
action menu keyboard
no-data/no-results/error
mobile record list
```

### Overlay

```text
initial focus
trap
Escape
backdrop
restore focus
scroll blocking
async confirm
typed destructive confirm
```

## 3. Storybook theme support

Remove hard-coded light-only initialization from `.storybook/preview.ts`.

Add a global toolbar/decorator for:

```text
light
dark
```

Every critical shared story must render correctly in both.

## 4. Viewport matrix

Critical patterns must be reviewed at:

```text
1440 desktop
1024 compact desktop/tablet landscape
768 tablet
390 mobile
```

Storybook can provide named custom viewports if defaults do not match exactly.

## 5. Story taxonomy

Organize stories around user states, not just props.

### Form

```text
Short form
Long sectioned form
Validation errors
API errors
Conditional fields
Submitting
Complex fields
Mobile
Dark
```

### Table

```text
Basic
Sortable
Selectable
Many actions
No data
No results
Loading
Error
Mobile
Dark
```

### Overlay

```text
Drawer default
Drawer long content
Drawer form
Confirm normal
Confirm destructive
Confirm typed
Confirm async error
Mobile drawer
```

### Layout/control

```text
Button variants/states
FormField help/error
PageShell widths
Section
ActionToolbar overflow
FilterPanel quick+advanced
```

## 6. Storybook interaction/a11y

Keep addon-a11y in error mode for critical stories.

Add interaction tests where keyboard/focus is core behavior:

```text
sortable table header
select/autocomplete
validation summary focus
Drawer focus trap
Confirm typed text
ActionToolbar More menu
```

## 7. CI hard gates

Required commands:

```bash
npm run format:check
npm run lint
npm run tokens:build
npm run build
npm test -- --watch=false
npm run build-storybook
npm run test-storybook:ci
```

If `tokens:build` changes tracked generated token artifacts, CI should verify the repository is clean afterward or run the appropriate generated-file consistency check.

Chromatic remains visual regression infrastructure when configured; do not use `exit-zero-on-changes` as the only quality signal for protected validation.

## 8. Prevent architecture regressions

CI/lint/static tests should detect at least:

```text
PermissionService import under shared/ui
BasePageResponse import under shared/ui/patterns/table
feature imports of internal field/table renderer paths
new compatibility `V2`/`Legacy` shared UI implementations
```

## Definition of Done

- Primitive tests do not depend unnecessarily on all SharedModule declarations.
- Storybook can switch light/dark globally.
- Critical shared patterns have 390px mobile stories.
- Interaction/a11y tests cover keyboard/focus-heavy components.
- CI runs format, lint, build, unit, Storybook build and Storybook tests.
- Architecture/import regressions fail CI rather than depending on manual review.