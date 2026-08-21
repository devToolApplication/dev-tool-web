# F08 — Final Audit and Acceptance

## Goal

Prove the remediation is complete using repository searches, quality gates and end-to-end acceptance scenarios. Do not create implementation changes in this phase unless an audit failure is found; fix failures in the owning phase and rerun the audit.

## 1. Quality gates

All must pass:

```bash
npm run format:check
npm run lint
npm run tokens:build
npm run build
npm test -- --watch=false
npm run build-storybook
npm run test-storybook:ci
```

## 2. Compatibility/dead migration audit

```bash
rg "\[severity\]|severity=|\[text\]|text=|size=\"small\"|size=\"large\"" src/app/shared
rg "SmartFormShell|FormStatusPanel|ReadonlyField|ReadonlySection|BaseCrudPage" src
rg "Legacy|compatibilityMode|useNewUi|V2Component|NewComponent" src/app/shared/ui
```

Expected: zero obsolete shared-UI compatibility paths, except unrelated domain words that are explicitly reviewed.

## 3. Shared dependency audit

```bash
rg "PermissionService|@core/auth|BasePageResponse|@core/http" src/app/shared/ui
```

Expected: zero application auth/HTTP model dependencies in shared UI.

## 4. Form-engine audit

```bash
rg "DoCheck|engineRevision|inputRevision|contextSignature|JSON\.stringify" src/app/shared/ui/patterns/form-input
rg "\bany\b" src/app/shared/ui/patterns/form-input
rg "showStatusPanel|stickyFooter|disabled-controls|labelPlacement" src/app/shared/ui/patterns/form-input src/app/features
```

Expected: no engine revision hacks; `any` near zero and every remaining occurrence justified; obsolete layout schema removed.

## 5. Table audit

```bash
rg "PermissionService|permissionMode|permissionDeniedTooltip|hasPermission|downloadCsv|document\.body\.appendChild|64rem|tabindex\]\=\"config.rowClickable" src/app/shared/ui/patterns/table
```

Expected: zero business coupling/manual portal/fake-row interaction/default desktop-only min-width strategy.

Also manually verify:

```text
sortable header uses button
aria-sort updates
row navigation uses semantic control
checkboxes have accessible names
mobile renders record list
```

## 6. Overlay audit

```bash
rg "AfterViewChecked|appendChild\(|body\.style\.overflow|document:keydown.tab|querySelectorAll<HTMLElement>" src/app/shared/ui/overlay
```

Expected: zero manual focus-trap/body-portal implementation where CDK should handle it.

## 7. Public API audit

```bash
rg "FieldRenderer|FieldArrayRenderer|FieldGroupRenderer|FieldRecordRenderer|FieldTreeRenderer|TableCellComponent|TableFilterComponent" src/app/features
```

Expected: zero feature imports/usages of internal renderers.

Review SharedModule exports manually; internal implementations may be declared but not exported.

## 8. Storybook audit

Verify both themes:

```text
light
dark
```

Verify critical widths:

```text
1440
1024
768
390
```

No hard-coded forced light theme in preview.

## 9. Acceptance scenarios

### Create/Edit Form

- exactly one primary action;
- persistent labels;
- validation after interaction/submit;
- invalid submit focuses first invalid field;
- API field error appears at correct field;
- double submit prevented;
- dirty state activates after edit;
- successful save clears dirty state;
- navigation with unsaved changes follows page policy.

### View Form

- no editable disabled-control imitation;
- text/detail list presentation;
- Tree remains visible and readable;
- JSON readable;
- copy actions remain accessible where intended.

### Table

- sort works mouse + keyboard;
- selection has labels;
- actions already resolved by feature permission policy;
- destructive action confirmation handled by feature/action workflow;
- no data and no results are distinct;
- mobile record list is usable without desktop squeeze.

### Drawer

- opens with focus inside;
- Tab is trapped correctly;
- Escape/backdrop behavior correct;
- close restores trigger focus;
- no body-scroll leak after destroy.

### Themes

- critical Form/Table/Drawer scenarios readable in light/dark;
- visible focus and sufficient contrast;
- reduced motion respected where animation exists.

## 10. Final report format

Agent must report:

```text
FINAL_STATUS: PASS | FAIL
HEAD_SHA: <sha>

Quality gates:
- format: PASS/FAIL
- lint: PASS/FAIL
- tokens: PASS/FAIL
- build: PASS/FAIL
- unit: PASS/FAIL
- storybook-build: PASS/FAIL
- storybook-tests: PASS/FAIL

Search gates:
- compatibility: <count>
- shared auth/http coupling: <count>
- form revision hacks: <count>
- table business coupling/manual portal: <count>
- internal renderer feature imports: <count>

Acceptance scenarios:
- create/edit form: PASS/FAIL
- readonly/view: PASS/FAIL
- table desktop/mobile: PASS/FAIL
- drawer keyboard/focus: PASS/FAIL
- light/dark: PASS/FAIL

Remaining issues:
- exact path + reason
```

No `PASS` if any mandatory gate or acceptance scenario fails.
