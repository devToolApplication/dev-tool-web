# Phase 08 — Feature Migration và Xóa Legacy Code

## Mục tiêu

Migrate các feature thật sang shared UI đã rewrite và xóa ngay legacy component/config/export không còn consumer.

Không có compatibility layer dài hạn.

## Chiến lược

Migration theo vertical slice.

Ưu tiên:

1. Job Form / Job Management — reference implementation.
2. các create/edit page đang dùng BaseCrudPage.
3. các list page dùng Table.
4. các detail drawer.
5. complex config/template screens.
6. phần còn lại.

## 1. Job Form

Target composition:

```text
PageShell(width=form)
  PageHeader
  load/error state
  FormInput
    SectionNavigation nếu đủ dài
    fields
    form actions
```

Loại bỏ:

```text
PageShell
  BaseCrudPage
    FormInput
      SmartFormShell
```

### Pseudocode

```ts
class JobFormPage {
  loading = signal(false);
  saving = signal(false);
  dirty = signal(false);
  apiError = signal<string | null>(null);
  fieldErrors = signal<Record<string, string>>({});

  save(value: JobFormValue) {
    ...
  }
}
```

```html
<app-page-shell width="form">
  <app-page-header page-header ... />

  <app-content-state ...>
    <app-form-input
      [config]="config"
      [initialValue]="initial"
      [apiError]="apiError()"
      [externalErrors]="fieldErrors()"
      (formSubmit)="save($event)"
      (dirtyChange)="dirty.set($event)"
    >
      <app-sticky-form-actions
        form-actions
        ...
      />
    </app-form-input>
  </app-content-state>
</app-page-shell>
```

Tests:

- create.
- edit.
- server field errors.
- dirty guard.
- long section navigation.
- mobile.

## 2. Job Management list

Target:

```text
PageShell(width=data)
  PageHeader + Create Job action
  Summary metrics if useful
  FilterPanel
  Table
  Drawer detail
```

Remove unnecessary nested SectionPanel/Card surfaces.

### Detail drawer

Use:

```text
DetailHeader
KeyValueList
JsonViewer
Timeline
```

Không tạo manual `.job-detail__hero` card nếu generic layout đủ dùng.

Nếu cần reusable identity pattern, tạo neutral `DetailHeader`, không thêm decorative card.

Tests:

- filter.
- sort.
- pagination.
- row action.
- open/close drawer.
- keyboard.
- mobile.

## 3. BaseCrudPage consumers

Search toàn repo:

```text
app-base-crud-page
BaseCrudPageComponent
BaseCrudPageConfig
```

Lập inventory:

```text
path
feature
create/edit/view
complex fields used
migration status
```

Migrate 100%.

Sau đó delete directory/export trong Phase 04 nếu chưa xóa ở branch trước.

## 4. Form legacy consumer flags

Search config:

```text
layout.mode
showStatusPanel
labelPlacement
readonlyMode
sectionNavigation
density
GridWidth 1/6 1/4 1/3 1/2
GroupFieldConfig.variant
GroupFieldConfig.density
```

Mỗi usage phải:

- remove;
- map sang semantic layout mới;
- hoặc redesign screen.

Không thêm fallback parser để giữ field cũ vô thời hạn.

## 5. Readonly views

Search:

```text
readonlyMode
readonly-field
readonly-section
disabled-controls
```

Migrate sang:

- KeyValueList;
- ValueDisplay;
- JsonViewer;
- StatusList;
- specialized detail component.

Tests:

- value copy.
- long text wrapping.
- empty value.
- mobile.
- screen reader label/value relation.

## 6. Table consumers

Search:

```text
TableConfig
permissionMode
stateKey
pageResponse
export
columnVisibility
density
rowClick
```

Move application logic outward.

Example:

```ts
tableRows = computed(() => apiPage()?.content ?? []);
tablePage = computed(() => mapPage(apiPage()));
tableActions = computed(() => buildAllowedActions(currentPermissions()));
```

Tests per feature:

- permission means action not passed to table.
- API pagination mapping.
- export service.
- mobile list representation.

## 7. Overlay consumers

Migrate:

- existing Drawer.
- Confirm dialog.
- primitive dialog/base popup.
- feature modal.

Verify no custom body/focus code remains outside centralized overlay.

## 8. Duplicate primitives cleanup

Candidate review:

```text
PrimeBadge -> Badge
PrimeTable -> Table
PrimeConfirmDialog -> ConfirmDialog
Message -> Alert
JsonPreview -> JsonViewer
duplicate Timeline -> one Timeline
```

For each duplicate:

1. search consumer count;
2. migrate consumer;
3. delete component;
4. delete SharedModule export;
5. delete story/spec nếu obsolete.

Không deprecate indefinitely.

## 9. Specialized low-value primitives

Review before deletion:

```text
ButtonSpeedDial
ButtonSplit
TieredMenu
PanelMenu
ColorPicker
SelectTree
```

Decision format:

```text
KEEP:
- has real feature use case
- accessibility acceptable
- no simpler pattern

DELETE:
- 0 consumer
- duplicate
- interaction confusing
- only Storybook usage
```

## Test plan

### Feature regression matrix

For each migrated feature:

```text
route loads
loading
error
empty
primary task
validation
success
permissions
keyboard
mobile
dark theme
```

### Search-based removal tests

Repository search must return zero expected legacy symbols.

Example gate:

```bash
rg "BaseCrudPage|app-base-crud-page|SmartFormShell|FormStatusPanel" src
```

Expected only plan/changelog references, no runtime code.

### Build

- application build.
- unit test.
- Storybook build.
- Playwright critical flows.
- Chromatic critical components.

### UX review

For each migrated screen verify:

- one h1.
- one primary action.
- no nested card without independent surface reason.
- no duplicate toolbar.
- no permanent form status sidebar.
- no desktop-only mobile overflow.
- errors preserve input.

## Definition of Done

- tất cả BaseCrudPage consumer migrated.
- tất cả critical form consumer dùng contract mới.
- table critical consumers migrated.
- overlay consumers dùng one stack.
- duplicate components deleted, không chỉ deprecated.
- no v1/v2 compatibility layer.
