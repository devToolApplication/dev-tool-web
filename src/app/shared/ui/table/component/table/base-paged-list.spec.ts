import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';

import { createBasePageResponse } from '../../../../../core/models/base-response.model';
import { BasePagedList } from './base-paged-list';

class TestPagedList extends BasePagedList<string> {
  loadCalls = 0;

  constructor(route: ActivatedRoute, router: Router, defaultPageSize = 10, defaultSorts: string[] = []) {
    super(route, router, defaultPageSize, defaultSorts);
  }

  protected loadPage(): void {
    this.loadCalls += 1;
  }

  applyResponse(page: number, size: number): void {
    this.setPageResponse(createBasePageResponse(['row'], page, size, 30));
  }

  syncQuery(): void {
    this.syncPaginationQueryParams();
  }
}

describe('BasePagedList', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('ignores duplicate paginator events for the current page and size', () => {
    const { list, router } = createList({ page: '0', size: '10' });

    list.onPageChange({ page: 0, rows: 10, first: 0 });

    expect(list.loadCalls).toBe(0);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('loads once and syncs query params when paginator state really changes', () => {
    const { list, router } = createList({ page: '0', size: '10' });

    list.onPageChange({ page: 1, rows: 25, first: 25 });

    expect(list.loadCalls).toBe(1);
    expect(list.page).toBe(1);
    expect(list.pageSize).toBe(25);
    expect(router.navigate).toHaveBeenCalledWith([], expect.objectContaining({
      queryParams: expect.objectContaining({ page: 1, size: 25 }),
      queryParamsHandling: 'merge'
    }));
  });

  it('does not re-navigate when query params already match the current page state', () => {
    const { list, router } = createList({ page: '2', size: '10' });
    list.applyResponse(2, 10);

    list.syncQuery();

    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('ignores repeated empty search payloads emitted during table filter initialization', () => {
    vi.useFakeTimers();
    const { list, router } = createList({ page: '0', size: '10' });

    list.onSearch({ code: null, category: '' });
    vi.advanceTimersByTime(200);

    expect(list.loadCalls).toBe(0);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('loads only when the normalized search payload actually changes', () => {
    vi.useFakeTimers();
    const { list, router } = createList({ page: '2', size: '10' });

    list.onSearch({ code: 'BINANCE_KEY', category: '' });
    vi.advanceTimersByTime(200);

    expect(list.loadCalls).toBe(1);
    expect(list.page).toBe(0);
    expect(router.navigate).toHaveBeenCalledWith([], expect.objectContaining({
      queryParams: expect.objectContaining({ page: 0, size: 10 }),
      queryParamsHandling: 'merge'
    }));

    list.onSearch({ category: '', code: 'BINANCE_KEY' });
    vi.advanceTimersByTime(200);

    expect(list.loadCalls).toBe(1);
  });

  it('clears a pending debounced search load when pagination changes first', () => {
    vi.useFakeTimers();
    const { list } = createList({ page: '0', size: '10' });

    list.onSearch({ code: 'BINANCE_KEY' });
    list.onPageChange({ page: 1, rows: 10, first: 10 });
    vi.advanceTimersByTime(200);

    expect(list.loadCalls).toBe(1);
    expect(list.page).toBe(1);
  });

  it('resets to the first page and reloads when sort changes', () => {
    const { list, router } = createList({ page: '2', size: '10' }, ['name,asc']);

    list.onSortChange({ field: 'code', order: -1 });

    expect(list.sorts).toEqual(['code,desc']);
    expect(list.sortField).toBe('code');
    expect(list.sortOrder).toBe(-1);
    expect(list.page).toBe(0);
    expect(list.loadCalls).toBe(1);
    expect(router.navigate).toHaveBeenCalledWith([], expect.objectContaining({
      queryParams: expect.objectContaining({ page: 0, size: 10, sort: 'code:desc', sortBy: null, sortDir: null }),
      queryParamsHandling: 'merge'
    }));
  });

  it('restores default sort when table clears sorting', () => {
    const { list, router } = createList({ page: '0', size: '10', sort: 'code:desc' }, ['name,asc']);

    list.onSortChange({ field: 'code', order: 0 });

    expect(list.sorts).toEqual(['name,asc']);
    expect(list.sortField).toBe('name');
    expect(list.sortOrder).toBe(1);
    expect(list.loadCalls).toBe(1);
    expect(router.navigate).toHaveBeenCalledWith([], expect.objectContaining({
      queryParams: expect.objectContaining({ sort: null })
    }));
  });

  it('restores sort from compact URL query params', () => {
    const { list } = createList({ page: '0', size: '10', sort: 'code:desc' }, ['name,asc']);

    expect(list.sorts).toEqual(['code,desc']);
    expect(list.sortField).toBe('code');
    expect(list.sortOrder).toBe(-1);
  });
});

function createList(
  params: Record<string, string>,
  defaultSorts: string[] = []
): { list: TestPagedList; router: Pick<Router, 'navigate'> } {
  const route = {
    snapshot: {
      queryParamMap: convertToParamMap(params)
    }
  } as ActivatedRoute;
  const router = {
    navigate: vi.fn(() => Promise.resolve(true))
  } as unknown as Pick<Router, 'navigate'>;

  return {
    list: new TestPagedList(route, router as Router, 10, defaultSorts),
    router
  };
}
