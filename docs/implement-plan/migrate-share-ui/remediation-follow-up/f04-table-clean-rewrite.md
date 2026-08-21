# F04 — Table Clean Rewrite

## Goal

Turn Table into a generic presentational pattern with accessible sorting/selection and an intentional mobile transformation.

## Scope

```text
src/app/shared/ui/patterns/table/
src/app/features/**/*management*/
src/app/features/**/*list*/
```

## 1. Generic row contract

Target direction:

```ts
export class TableComponent<T> {
  @Input() rows: readonly T[] = [];
  @Input() columns: readonly TableColumn<T>[] = [];
  @Input() page?: TablePageState;
  @Input() sort?: TableSort;

  @Output() sortChange = new EventEmitter<TableSort>();
  @Output() pageChange = new EventEmitter<TablePageState>();
  @Output() selectionChange = new EventEmitter<readonly T[]>();
  @Output() actionClick = new EventEmitter<TableActionEvent<T>>();
}
```

Eliminate broad `any` from core row/action/template contracts.

## 2. Remove non-presentational concerns

Move out of Table:

```text
CSV Blob/download
business export decisions
permission evaluation
confirmation policy
HTTP response mapping
feature route decisions
business localStorage persistence
server query orchestration
```

If density/column visibility persistence is a generic UI preference, place it in an explicit generic preference service outside the component and make it opt-in.

## 3. Delete stale compatibility schema

Remove from shared table contracts after consumer migration:

```text
severity
text
permissions
permissionMode
permissionDeniedTooltip
confirm
legacy danger/default/warning variant vocabulary
```

Use shared Button variants:

```text
primary
secondary
ghost
destructive
```

## 4. Accessible sort headers

Do not attach click directly to `<th>`.

Target:

```html
<th scope="col" [attr.aria-sort]="ariaSort(column)">
  <button
    type="button"
    (click)="requestSort(column)"
  >
    {{ column.header }}
  </button>
</th>
```

Keyboard behavior comes from the button.

## 5. Row interactions

Do not make arbitrary `<tr tabindex="0">` act as a fake button.

If row navigation is required, render a real anchor/button in a designated primary cell.

If row selection is required, use checkbox/radio semantics with proper accessible labels.

## 6. Selection labels

No `label=""` for selection controls.

Examples:

```text
Select all visible rows
Select <row name>
```

Provide a row accessible-name resolver when necessary.

## 7. Responsive transformation

Desktop/tablet may use semantic `<table>`.

Narrow mobile view should render a record list/card-like row representation based on high-priority columns instead of forcing a 64rem table horizontally.

Avoid card decoration on every field; preserve structured label/value rows.

## 8. State semantics

Keep distinct:

```text
loading
error
no data
no results after filters
content
```

Table can render these UI states but must not own the server/business logic that produces them.

## 9. Split TableCell

TableCell should not:

```text
manual appendChild menu to document.body
manual portal positioning
confirmation
permission
large formatting utility collection
```

Use reusable primitives/overlay/CDK for action menus and extract formatting helpers where appropriate.

## Tests

```text
generic row typing compile test
sort click + keyboard
aria-sort
selection accessible names
selection events
page events
action events
no data vs no results
mobile record-list rendering
no fake row tabindex
```

## Search gates

```bash
rg "\bany\b|PermissionService|permissionMode|permissionDeniedTooltip|severity|confirm\?|downloadCsv|document\.body\.appendChild|tableMinWidth|64rem" src/app/shared/ui/patterns/table
```

Every remaining hit must be reviewed; target is zero for business coupling and near-zero `any` in core contracts.

## Definition of Done

- generic Table API;
- no business permission/confirm/export logic;
- no stale permission/severity compatibility schema;
- semantic sort buttons + aria-sort;
- no fake clickable rows;
- accessible row/select-all labels;
- mobile record-list transformation;
- no manual body portal in TableCell;
- tests and consumer migrations pass.
