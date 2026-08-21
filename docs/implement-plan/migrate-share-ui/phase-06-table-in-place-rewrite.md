# Phase 06 — Rewrite Table Pattern tại chỗ

## Mục tiêu

Rewrite `src/app/shared/ui/patterns/table` thành UI pattern thuần, accessible, responsive.

Không tạo `TableV2`. Existing `TableComponent` được tách responsibility và consumer migrate trực tiếp.

## Current scope

```text
src/app/shared/ui/patterns/table/
  component/table/
  models/
  utils/
  table.stories.ts
  index.ts
```

Current table đang xử lý quá nhiều:

- API page response;
- permission;
- confirmation;
- search/filter;
- selection;
- row actions;
- persistence;
- CSV export;
- density;
- column visibility;
- pagination;
- responsive scroll.

## Boundary mới

### Table UI chịu

- render columns/rows;
- sort event;
- selection event;
- row action event;
- loading/empty rendering;
- pagination UI event;
- density presentation;
- column visibility UI nếu vẫn coi là UI preference.

### Feature/controller chịu

- gọi API;
- convert API page -> rows/page state;
- permission resolution;
- business action visibility;
- CSV/export workflow;
- persistent key policy;
- route navigation;
- server-side search/filter logic.

## Model rewrite

Pseudo:

```ts
interface TableColumn<T> {
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

interface TableAction<T> {
  id: string;
  label: string;
  icon?: string;
  variant?: 'default' | 'destructive';
  disabled?: (row: T) => boolean;
}

interface TablePageState {
  page: number;
  pageSize: number;
  total: number;
}

interface TableSort {
  columnId: string;
  direction: 'asc' | 'desc';
}
```

Không để model có:

```text
PermissionService contract
BasePageResponse
Observable optionsLoader business source
confirm service callbacks
CSV download callbacks
```

## Permission

Feature resolve trước:

```ts
actions = computed(() => [
  canEdit() ? EDIT_ACTION : null,
  canDelete() ? DELETE_ACTION : null
].filter(Boolean));
```

Table chỉ render action được đưa vào.

Nếu cần disabled reason:

```ts
{
  id: 'delete',
  label: 'Delete',
  disabled: row => row.protected,
  disabledReason: row => 'Protected jobs cannot be deleted'
}
```

## Sort accessibility

Không click trực tiếp trên `<th>`.

Pseudo:

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
      <app-sort-icon ... />
    </button>
  } @else {
    {{ column.header }}
  }
</th>
```

Tests:

- Tab tới sort button.
- Enter/Space sort.
- `aria-sort=ascending/descending/none`.
- sort event đúng.

## Row click

Không biến `<tr>` thành fake button nếu use case là navigation.

Prefer:

```text
identity cell contains actual link
```

Nếu row selection:

- checkbox/button semantic riêng.
- row không cần `tabindex=0` toàn bộ.

## Selection

Checkbox accessible label:

```html
<app-check-box
  [ariaLabel]="'Select ' + rowIdentity(row)"
/>
```

Header:

```text
Select all rows on current page
```

Clarify scope nếu select across pages.

## Row actions

Rules:

- 0–2 frequent actions có thể visible icon/button;
- 3+ actions -> overflow menu;
- destructive separated and labeled.

Pseudo:

```text
Edit | View | More ▾
                Delete
```

## Toolbar / filters

Không để Table component tự làm toàn bộ filter engine.

Composition:

```html
<app-filter-panel ... />
<app-table
  [rows]="rows()"
  [columns]="columns"
  [sort]="sort()"
  [page]="page()"
/>
```

`FilterPanel` phase 07 sẽ thành compact filter bar.

## Export

Xóa Blob/document anchor download logic khỏi Table.

Feature/service:

```ts
exportCsv() {
  return this.exportService.exportJobRows(this.currentQuery());
}
```

Table chỉ emit toolbar action nếu toolbar còn thuộc pattern.

## Persistence

Không hard-code:

```text
dev-tool.table.${stateKey}
```

Nếu column/density preferences cần persistence:

```ts
TablePreferenceService
```

là optional infrastructure service, inject qua interface/config hoặc feature.

Table render vẫn chạy nếu không có persistence.

## Mobile responsive

Không dùng default `min-width: 64rem` làm chiến lược mobile.

Breakpoint:

```text
desktop/tablet wide -> semantic table
mobile/narrow -> record list
```

Pseudo mobile:

```html
<ul class="table-mobile-list">
  @for (row of rows; track rowKey(row)) {
    <li class="table-mobile-record">
      <div class="record-primary">
        <a ...>{{ primaryValue(row) }}</a>
        <app-overflow-actions ... />
      </div>

      @for (column of mobileSecondaryColumns) {
        <div class="record-field">
          <span>{{ column.mobile.label ?? column.header }}</span>
          <app-table-cell ... />
        </div>
      }
    </li>
  }
</ul>
```

Config bắt buộc xác định primary mobile column hoặc infer first identity column.

## Empty states

Phân biệt:

```text
No data yet
No results for current filters
Load error
```

Clear filters action khi no results.

## Loading

Skeleton layout tương ứng table/record list, không spinner chiếm toàn trang nếu giữ existing data trong refresh.

## Test plan

### Unit — model/events

- sort cycle.
- pagination event.
- selection current page.
- action disabled.
- column visibility.
- no dependency PermissionService.
- no dependency BasePageResponse.

### DOM/a11y

- header `scope=col`.
- sortable header has button.
- aria-sort changes.
- row selection checkbox accessible.
- action menu keyboard.
- table caption/accessible label nếu context yêu cầu.

### Mobile

Viewport tests:

```text
1440
1024
768
390
```

Ở 390:

- không horizontal scroll toàn table.
- primary field visible.
- status/secondary fields readable.
- actions accessible.
- pagination usable.

### Filtering integration

- no data vs no results.
- applied filter clear.
- server query state managed outside table.

### Selection regression

- select row.
- page change.
- expected selection scope explicit.
- deselect.
- bulk action count accurate.

### Storybook

Stories:

```text
Basic
Sortable
Selectable
Many actions
Empty
No results
Loading
Error
Dense
Mobile
Dark
```

### E2E reference feature

`Job Management`:

- search/filter;
- sort;
- paginate;
- open detail;
- bulk select nếu có;
- delete confirmation;
- mobile record list.

## Definition of Done

- Table không import core auth/http application types.
- CSV export không nằm trong component.
- sortable header keyboard accessible.
- row navigation dùng semantic link/action.
- mobile không dựa vào 64rem horizontal scroll.
- Table stories/a11y/mobile pass.
- không tồn tại TableV2.
