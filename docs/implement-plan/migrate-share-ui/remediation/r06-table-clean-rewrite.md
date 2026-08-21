# R06 — Clean Table Rewrite

## Objective

Rewrite the existing Table pattern into a typed, accessible, responsive presentation component. Do not create `TableV2`.

## Current responsibilities to remove

The current table still knows application/infrastructure concerns such as:

```text
PermissionService
BasePageResponse
ConfirmDialogService
CSV/export behavior
persistence policy
server filter orchestration
business toolbar actions
```

It also still relies on clickable `<th>`, focusable clickable rows and desktop horizontal scrolling for mobile.

## Target boundary

### Table owns

```text
render rows and columns
sort presentation/events
selection UI/events
row action presentation/events
loading/no-data/no-results/error presentation
pagination UI/events
column visibility UI if retained
density presentation if retained
mobile record-list rendering
```

### Feature/controller owns

```text
API calls
BasePageResponse -> UI state mapping
permissions
business action visibility
confirmation workflow
export/import workflow
server filters
routes
persistent business keys
```

## 1. Create typed models

Target direction:

```ts
export interface TableColumn<T> {
  id: string;
  header: string;
  value?: (row: T) => unknown;
  type?: 'text' | 'number' | 'date' | 'status' | 'actions';
  sortable?: boolean;
  width?: 'sm' | 'md' | 'lg' | 'auto';
  mobile?: {
    priority: 'primary' | 'secondary' | 'hidden';
    label?: string;
  };
}

export interface TableAction<T> {
  id: string;
  label: string;
  icon?: string;
  variant?: 'default' | 'destructive';
  disabled?: (row: T) => boolean;
  disabledReason?: (row: T) => string | undefined;
}

export interface TablePageState {
  page: number;
  pageSize: number;
  total: number;
}

export interface TableSort {
  columnId: string;
  direction: 'asc' | 'desc';
}
```

Avoid broad `any` in core table public APIs.

## 2. Remove application dependencies

Delete imports/usages of:

```text
@core/auth/permission.service
@core/http/base-response.model
ConfirmDialogService for business action decisions
```

Feature resolves permissions before passing actions:

```ts
readonly actions = computed<TableAction<Job>[]>(() => [
  ...(this.canEdit() ? [EDIT_ACTION] : []),
  ...(this.canDelete() ? [DELETE_ACTION] : [])
]);
```

Feature confirms destructive actions after receiving `actionClick`.

## 3. Remove export/import orchestration

Table may emit a generic toolbar action if toolbar remains part of the pattern, but it must not create Blob downloads, CSV content, anchors, or call feature export services.

Feature:

```ts
async exportJobs(): Promise<void> {
  await this.exportService.export(this.currentQuery());
}
```

## 4. Make sorting semantic

Do not attach click directly to `<th>`.

Target:

```html
<th
  scope="col"
  [attr.aria-sort]="ariaSort(column)"
>
  @if (column.sortable) {
    <button
      type="button"
      class="table-sort"
      (click)="toggleSort(column)"
    >
      <span>{{ column.header }}</span>
      <app-sort-icon aria-hidden="true" />
    </button>
  } @else {
    {{ column.header }}
  }
</th>
```

Keyboard activation comes from the native button.

## 5. Remove fake interactive rows

Do not use:

```html
<tr tabindex="0" (click)="..." (keydown.enter)="...">
```

For navigation, render a real link in the identity/primary cell. For selection, use checkboxes. For commands, use buttons/action menus.

## 6. Accessible selection

Header checkbox accessible name:

```text
Select all rows on this page
```

Row checkbox accessible name:

```text
Select <row identity>
```

Define selection scope explicitly when pagination changes.

## 7. Row actions

Rules:

```text
0-2 frequent actions -> visible controls allowed
3+ actions -> overflow menu
Destructive action -> separated/labeled clearly
```

Overflow menu must support keyboard navigation and Escape/focus restoration.

## 8. Filter composition

Move filter engine outside Table:

```html
<app-filter-panel
  [definitions]="filters"
  [value]="filterState()"
  (valueChange)="onFiltersChanged($event)"
/>

<app-table
  [rows]="rows()"
  [columns]="columns"
  [page]="page()"
  [sort]="sort()"
/>
```

Table receives already resolved rows/page state.

## 9. Responsive mobile record list

Do not use `min-width: 64rem` + horizontal scrolling as the main mobile solution.

Desktop/tablet wide: semantic table.

Narrow/mobile: structured record list.

```html
<ul class="table-mobile-list">
  @for (row of rows; track rowKey(row)) {
    <li class="table-mobile-record">
      <div class="record-primary">
        <a [routerLink]="rowLink(row)">{{ primaryValue(row) }}</a>
        <app-row-actions ... />
      </div>

      @for (column of mobileSecondaryColumns; track column.id) {
        <div class="record-field">
          <span class="record-label">{{ column.mobile?.label ?? column.header }}</span>
          <app-table-cell ... />
        </div>
      }
    </li>
  }
</ul>
```

Routing can alternatively be supplied as a template/action to keep Table router-agnostic.

## 10. Empty/loading/error states

Distinguish:

```text
No data yet
No results for current filters
Load error
Refreshing existing data
Initial loading
```

No-results state should expose `Clear filters` when relevant.

## Tests

### Unit/events

```text
sort cycle
page event
selection event
action event
column visibility
density if retained
no permission service dependency
no BasePageResponse dependency
```

### DOM/a11y

```text
scope=col
sortable header uses button
aria-sort updates
row checkbox accessible name
select-all accessible name
no tabindex on clickable tr
overflow actions keyboard accessible
```

### Responsive

Test/Storybook viewports:

```text
1440
1024
768
390
```

At 390px:

```text
no full-table horizontal scroll dependency
primary field visible
secondary values readable
actions reachable
pagination usable
```

## Search gates

Expected zero in shared Table:

```bash
rg "PermissionService|BasePageResponse|ConfirmDialogService" src/app/shared/ui/patterns/table
rg "createElement\('a'\)|Blob\(" src/app/shared/ui/patterns/table
```

Review:

```bash
rg "\bany\b" src/app/shared/ui/patterns/table
```

## Definition of Done

- Table is generic/typed at its core public boundary.
- No application auth/HTTP response dependencies.
- No CSV/business export orchestration.
- Sort headers are semantic buttons with `aria-sort`.
- Rows are not fake buttons.
- Selection is accessible.
- Mobile uses a record-list transformation, not only 64rem scrolling.
- Filters/server state are managed outside Table.
- Table unit/a11y/mobile stories and reference feature integration pass.