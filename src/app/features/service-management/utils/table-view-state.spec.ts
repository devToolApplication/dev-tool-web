import { TableConfig, TableExportRequest } from '@shared/ui/patterns/table';
import {
  defaultTableColumnVisibility,
  exportTableRequestAsCsv,
  readTableViewState,
  writeTableViewState,
} from './table-view-state';

describe('service-management table view state', () => {
  const config: TableConfig = {
    columns: [
      { field: 'id', header: 'ID', hideable: false },
      { field: 'name', header: 'Name' },
      { field: 'status', header: 'Status' },
      { field: 'actions', header: 'Actions', type: 'actions', hideable: false },
    ],
  };

  beforeEach(() => {
    localStorage.clear();
  });

  it('persists page-owned column visibility and density', () => {
    writeTableViewState('service-management.test.table', {
      columnVisibility: ['status'],
      density: 'compact',
    });

    expect(readTableViewState('service-management.test.table', config)).toEqual({
      columnVisibility: ['status'],
      density: 'compact',
    });
  });

  it('uses configurable table columns as the default visibility state', () => {
    expect(defaultTableColumnVisibility(config)).toEqual(['name', 'status']);
    expect(readTableViewState('service-management.missing.table', config)).toEqual({
      columnVisibility: ['name', 'status'],
      density: 'comfortable',
    });
  });

  it('keeps action columns visible when the table controls column state', () => {
    expect(
      defaultTableColumnVisibility({
        columns: [
          { field: 'name', header: 'Name' },
          { field: 'actions', header: 'Actions', type: 'actions' },
        ],
      }),
    ).toEqual(['name', 'actions']);
  });

  it('falls back when browser storage is unavailable', () => {
    const originalLocalStorage = localStorage;

    vi.stubGlobal('localStorage', undefined);

    try {
      expect(readTableViewState('service-management.no-storage.table', config)).toEqual({
        columnVisibility: ['name', 'status'],
        density: 'comfortable',
      });
      expect(() =>
        writeTableViewState('service-management.no-storage.table', {
          columnVisibility: ['name'],
          density: 'compact',
        }),
      ).not.toThrow();
    } finally {
      vi.stubGlobal('localStorage', originalLocalStorage);
    }
  });

  it('exports table requests as CSV in the feature layer', () => {
    const originalBlob = Blob;
    let blobParts: BlobPart[] | undefined;
    let blobOptions: BlobPropertyBag | undefined;
    const BlobMock = vi.fn(function (this: Blob, parts?: BlobPart[], options?: BlobPropertyBag) {
      blobParts = parts;
      blobOptions = options;
    });
    const createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:service-table');
    const revokeObjectUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const anchor = document.createElement('a');
    const click = vi.spyOn(anchor, 'click').mockImplementation(() => undefined);
    const originalCreateElement = document.createElement.bind(document);
    const createElement = vi.spyOn(document, 'createElement').mockImplementation(((
      tagName: string,
      options?: ElementCreationOptions,
    ) => {
      if (tagName.toLowerCase() === 'a') {
        return anchor;
      }
      return originalCreateElement(tagName, options);
    }) as typeof document.createElement);
    const request: TableExportRequest = {
      scope: 'current-page',
      filters: {},
      sortField: null,
      sortOrder: 0,
      visibleColumns: ['id', 'name'],
      rows: [{ id: 'SVC-1', name: 'Alpha' }],
    };

    vi.stubGlobal('Blob', BlobMock);

    try {
      exportTableRequestAsCsv(request, config, 'services.csv', {
        formatHeader: (header) => `translated:${header}`,
      });

      expect(blobParts).toEqual(['translated:ID,translated:Name\nSVC-1,Alpha']);
      expect(blobOptions).toEqual({ type: 'text/csv;charset=utf-8' });
      expect(createObjectUrl).toHaveBeenCalledWith(expect.any(BlobMock));
      expect(anchor.download).toBe('services.csv');
      expect(click).toHaveBeenCalled();
      expect(revokeObjectUrl).toHaveBeenCalledWith('blob:service-table');
    } finally {
      vi.stubGlobal('Blob', originalBlob);
      createElement.mockRestore();
      createObjectUrl.mockRestore();
      revokeObjectUrl.mockRestore();
    }
  });

  it('applies table export filters before writing filtered CSV rows', () => {
    const originalBlob = Blob;
    let blobParts: BlobPart[] | undefined;
    const BlobMock = vi.fn(function (this: Blob, parts?: BlobPart[]) {
      blobParts = parts;
    });
    const createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:filtered-table');
    const revokeObjectUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const anchor = document.createElement('a');
    const click = vi.spyOn(anchor, 'click').mockImplementation(() => undefined);
    const originalCreateElement = document.createElement.bind(document);
    const createElement = vi.spyOn(document, 'createElement').mockImplementation(((
      tagName: string,
      options?: ElementCreationOptions,
    ) => {
      if (tagName.toLowerCase() === 'a') {
        return anchor;
      }
      return originalCreateElement(tagName, options);
    }) as typeof document.createElement);
    const request: TableExportRequest = {
      scope: 'external',
      filters: { status: 'active' },
      sortField: null,
      sortOrder: 0,
      visibleColumns: ['id', 'name', 'status'],
      rows: [
        { id: 'SVC-1', name: 'Alpha', status: 'active' },
        { id: 'SVC-2', name: 'Beta', status: 'inactive' },
      ],
    };

    vi.stubGlobal('Blob', BlobMock);

    try {
      exportTableRequestAsCsv(
        request,
        {
          ...config,
          filters: [{ field: 'status', label: 'Status', type: 'select' }],
        },
        'services.csv',
      );

      expect(blobParts).toEqual(['ID,Name,Status\nSVC-1,Alpha,active']);
      expect(click).toHaveBeenCalled();
    } finally {
      vi.stubGlobal('Blob', originalBlob);
      createElement.mockRestore();
      createObjectUrl.mockRestore();
      revokeObjectUrl.mockRestore();
    }
  });
});
