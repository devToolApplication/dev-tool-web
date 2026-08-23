import type {
  FieldState,
  FormContext,
  TextFieldConfig,
} from './form-input/models/form-config.model';
import type {
  TableAction,
  TableColumn,
  TableConfig,
  TableExportRequest,
  TableFilterValue,
} from './table/models/table-config.model';

interface ContractRow {
  id: string;
  count: number;
}

interface ContractUser {
  id: string;
}

type IsAny<T> = 0 extends 1 & T ? true : false;
type Expect<T extends true> = T;

const typedAction: TableAction<ContractRow> = {
  label: 'Open',
  onClick: (row) => {
    const id: string = row.id;
    return id;
  },
};

const typedColumn: TableColumn<ContractRow> = {
  field: 'count',
  header: 'Count',
  valueGetter: (row) => row.count,
  formatter: (row, value) => `${row.id}:${String(value)}`,
};

const typedTable: TableConfig<ContractRow> = {
  columns: [typedColumn],
  rowKey: (row) => row.id,
  toolbar: {
    bulkActions: [
      {
        id: 'bulk',
        label: 'Bulk',
        onClick: (rows) => rows.map((row) => row.id),
      },
    ],
  },
};

const exportRequest: TableExportRequest<ContractRow> = {
  scope: 'current-page',
  filters: { keyword: 'alpha' },
  sortField: 'count',
  sortOrder: 1,
  visibleColumns: ['id'],
  rows: [{ id: 'row-1', count: 1 }],
};

const filterValue: TableFilterValue = { keyword: 'alpha' };
const unknownFilterValue: unknown = filterValue['keyword'];

const formContext: FormContext<ContractUser> = { user: { id: 'u1' } };
const defaultFormContext: FormContext = { user: { id: 'u1' } };

type _FilterPayloadIsNotAny = Expect<
  IsAny<TableFilterValue['keyword']> extends false ? true : false
>;
type _DefaultUserIsNotAny = Expect<IsAny<FormContext['user']> extends false ? true : false>;
type _FieldValueSignalIsTyped = Expect<
  FieldState<string, TextFieldConfig>['value'] extends () => string ? true : false
>;
type _FieldSetterIsTyped = Expect<
  FieldState<string, TextFieldConfig>['setValue'] extends (value: string) => void ? true : false
>;

describe('shared UI public contract types', () => {
  it('compile with typed public form and table contracts', () => {
    expect(typedAction).toBeDefined();
    expect(typedTable).toBeDefined();
    expect(exportRequest.rows[0].id).toBe('row-1');
    expect(unknownFilterValue).toBe('alpha');
    expect(formContext.user?.id).toBe('u1');
    expect(defaultFormContext.user).toEqual({ id: 'u1' });
  });
});
