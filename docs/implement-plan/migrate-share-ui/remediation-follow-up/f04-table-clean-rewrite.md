# F04 — Table Clean Rewrite

## Goal

Turn Table into a generic, accessible, responsive presentation pattern. Application concerns remain in feature/controller code.

## F04.1 — Define a generic presentation API

Target direction:

```ts
export interface TableColumn<T> {
  id: string;
  header: string;
  value: (row: T) => unknown;
  sortable?: boolean;
  align?: 'start' | 'center' | 'end';
  width?: string;
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

export class TableComponent<T> {
  @Input() rows: readonly T[] = [];
  @Input() columns: readonly TableColumn<T>[] = [];
  @Input() page?: TablePageState;
  @Input() sort?: TableSort;
  @Input() selection: readonly T[] = [];

  @Output() pageChange = new EventEmitter<TablePageState>();
  @Output() sortChange = new EventEmitter<TableSort>();
  @Output() selectionChange = new EventEmitter<readonly T[]>();
  @Output() actionClick = new EventEmitter<TableActionEvent<T>>();
}
```

Exact names may differ; responsibility may not.

## F04.2 — Remove application/business responsibilities

Delete from shared Table/TableCell/Table model:

```text
PermissionService / permission metadata
ConfirmDialogService / business confirmation policy
BasePageResponse / HTTP response mapping
CSV creation / Blob / download
business export file naming
business localStorage keys and feature persistence policy
feature routing/navigation orchestration
API page-number conversion
application-specific i18n orchestration if simple translated labels can be supplied
```

Feature/controller can compose helpers for filters/export/persistence, but the table pattern must only receive presentation state and emit UI intent.

Delete stale code such as `changes['pageResponse']` if no `pageResponse` input exists.

## F04.3 — Simplify action contract

Table action presentation model:

```ts
interface TableAction<T> {
  id: string;
  label: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  visible?: (row: T) => boolean;
  disabled?: (row: T) => boolean;
  tooltip?: (row: T) => string | undefined;
  placement?: 'primary' | 'more';
}
```

No permission strings, severity compatibility, confirm config or callback that executes feature business logic inside the shared component.

Prefer `actionClick` event with action ID + row.

## F04.4 — Accessibility

Sortable header:

```html
<th [attr.aria-sort]="ariaSort(column)">
  <button type="button" (click)="requestSort(column)">
    ...
  </button>
</th>
```

Do not use click handler directly on `<th>` as the only interaction.

Rows:

- no fake `tabindex="0"` on a whole row merely to simulate navigation;
- use explicit link/action in a cell when navigation is supported;
- row selection must not conflict with row action/navigation.

Selection:

- select-all checkbox has an accessible name;
- each row checkbox has an accessible name derived from row identity or configured label.

## F04.5 — Mobile presentation

Desktop/tablet: semantic `<table>`.

Mobile: record-list/card-row representation using the same column metadata or an explicit mobile field subset.

Do not treat:

```text
overflow-x-auto + min-width: 64rem
```

as the primary mobile UX.

## F04.6 — Internal decomposition

Recommended internal pieces:

```text
table/
  table.component
  table-header
  table-row
  table-cell
  table-mobile-record
  table-pagination
```

`TableCell` remains internal and should not be exported from SharedModule.

Formatting/date/badge helpers should be pure functions/pipes where practical.

Avoid direct manual DOM portals for action menus; reuse overlay primitives from F06/CDK where appropriate.

## Tests

```text
render typed rows/columns
sort emits correctly
aria-sort changes
pagination emits
selection/select-all works with accessible labels
action emits ID + row
empty/error/loading composition behaves as intended
mobile record view renders at mobile breakpoint strategy
no permission/confirm/export business logic in shared table
```

## Search gates

```bash
rg "PermissionService|BasePageResponse|ConfirmDialogService|permissionMode|permissionDeniedTooltip" src/app/shared/ui/patterns/table
rg "Blob|createObjectURL|downloadCsv|document\.createElement\('a'\)" src/app/shared/ui/patterns/table
rg "pageResponse" src/app/shared/ui/patterns/table
rg "\bany\b" src/app/shared/ui/patterns/table
```

Permission/business/stale-response matches: zero. Review every remaining `any`; core public boundaries should be typed.

## Definition of Done

- generic presentation-only table API;
- no app auth/API/business export/confirmation concerns;
- sortable headers and selection are accessible;
- no fake focusable row navigation;
- mobile has a record-list presentation;
- internal components are not public exports;
- feature consumers migrated;
- tests + quality gates pass.
