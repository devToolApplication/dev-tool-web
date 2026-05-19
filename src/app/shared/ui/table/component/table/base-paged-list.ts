import { computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription, finalize } from 'rxjs';
import { BasePageResponse, createBasePageResponse, normalizeBasePageResponse } from '../../../../../core/models/base-response.model';
import { TablePageChangeEvent, TableSortChangeEvent } from './table';

export abstract class BasePagedList<T> {
  rows: T[] = [];
  filters: Record<string, unknown> = {};
  sorts: string[] = [];
  pageResponse: BasePageResponse<T>;
  readonly pageLoading = signal(false);
  readonly pageError = signal<string | null>(null);
  readonly pageEmpty = computed(() => !this.pageLoading() && !this.pageError() && this.rows.length === 0);

  private readonly routeRef: ActivatedRoute;
  private readonly routerRef: Router;
  private readonly defaultSorts: string[];
  private activePageLoad?: Subscription;
  private loadTimer?: ReturnType<typeof setTimeout>;
  private requestVersion = 0;

  protected constructor(
    route: ActivatedRoute,
    router: Router,
    defaultPageSize = 10,
    defaultSorts: string[] = []
  ) {
    this.routeRef = route;
    this.routerRef = router;
    this.defaultSorts = [...defaultSorts];
    this.sorts = this.routeSorts() ?? [...defaultSorts];
    const page = this.pageIndexValue(this.routeRef.snapshot.queryParamMap.get('page'), 0);
    const size = this.pageSizeValue(this.routeRef.snapshot.queryParamMap.get('size'), defaultPageSize);
    this.pageResponse = createBasePageResponse<T>([], page, size);
  }

  get page(): number {
    return this.pageResponse.metadata?.pageNumber ?? 0;
  }

  get pageSize(): number {
    return this.pageResponse.metadata?.pageSize ?? 10;
  }

  get sortField(): string | null {
    return this.parseSort(this.sorts[0])?.field ?? null;
  }

  get sortOrder(): 1 | -1 | 0 {
    const direction = this.parseSort(this.sorts[0])?.direction;
    if (direction === 'asc') {
      return 1;
    }
    if (direction === 'desc') {
      return -1;
    }
    return 0;
  }

  onSearch(filters: Record<string, unknown>): void {
    const nextFilters = this.normalizeFilters(filters);
    if (this.filterStateKey(nextFilters) === this.filterStateKey(this.filters)) {
      return;
    }

    this.filters = nextFilters;
    this.updatePageState(0, this.pageSize);
    this.scheduleLoadPage();
  }

  onResetFilter(): void {
    if (this.filterStateKey(this.filters) === this.filterStateKey({})) {
      return;
    }

    this.filters = {};
    this.updatePageState(0, this.pageSize);
    this.scheduleLoadPage();
  }

  onPageChange(event: TablePageChangeEvent): void {
    const nextPage = this.pageIndexValue(event.page, this.page);
    const nextSize = this.pageSizeValue(event.rows, this.pageSize);
    if (nextPage === this.page && nextSize === this.pageSize) {
      return;
    }

    this.clearScheduledLoad();
    this.updatePageState(nextPage, nextSize);
    this.loadPage();
  }

  onSortChange(event: TableSortChangeEvent): void {
    const nextSorts = this.resolveSorts(event);
    if (this.sortStateKey(nextSorts) === this.sortStateKey(this.sorts)) {
      return;
    }

    this.clearScheduledLoad();
    this.sorts = nextSorts;
    this.updatePageState(0, this.pageSize);
    this.loadPage();
  }

  refreshPage(): void {
    this.clearScheduledLoad();
    this.loadPage();
  }

  cancelPageLoad(): void {
    this.clearScheduledLoad();
    this.activePageLoad?.unsubscribe();
    this.activePageLoad = undefined;
    this.pageLoading.set(false);
  }

  protected setPageResponse(response: BasePageResponse<T>): void {
    this.pageResponse = normalizeBasePageResponse(response, this.page, this.pageSize);
    this.rows = this.pageResponse.data ?? [];
    this.pageError.set(null);
  }

  protected runPageRequest(
    request$: Observable<BasePageResponse<T>>,
    options: {
      errorMessage?: string;
      onSuccess?: (response: BasePageResponse<T>) => void;
      onError?: (error: unknown) => void;
    } = {}
  ): void {
    const version = ++this.requestVersion;
    this.cancelPageLoad();
    this.pageLoading.set(true);
    this.pageError.set(null);

    this.activePageLoad = request$
      .pipe(finalize(() => {
        if (version === this.requestVersion) {
          this.pageLoading.set(false);
        }
      }))
      .subscribe({
        next: (response) => {
          if (version === this.requestVersion) {
            this.setPageResponse(response);
            options.onSuccess?.(response);
          }
        },
        error: (error) => {
          if (version === this.requestVersion) {
            this.pageError.set(options.errorMessage ?? 'shared.table.errorTitle');
            options.onError?.(error);
          }
        }
      });
  }

  protected syncPaginationQueryParams(): void {
    const currentPageParam = this.routeRef.snapshot.queryParamMap.get('page');
    const currentSizeParam = this.routeRef.snapshot.queryParamMap.get('size');
    const currentSortParam = this.routeRef.snapshot.queryParamMap.get('sort');
    const currentSortByParam = this.routeRef.snapshot.queryParamMap.get('sortBy');
    const currentSortDirParam = this.routeRef.snapshot.queryParamMap.get('sortDir');
    const currentPage = this.pageIndexValue(currentPageParam, 0);
    const currentSize = this.pageSizeValue(currentSizeParam, this.pageSize);
    const nextSortParam = this.sortQueryValue(this.sorts);
    if (
      currentPageParam !== null &&
      currentSizeParam !== null &&
      currentPage === this.page &&
      currentSize === this.pageSize &&
      currentSortParam === nextSortParam &&
      currentSortByParam === null &&
      currentSortDirParam === null
    ) {
      return;
    }

    void this.routerRef.navigate([], {
      relativeTo: this.routeRef,
      queryParams: {
        page: this.page,
        size: this.pageSize,
        sort: nextSortParam,
        sortBy: null,
        sortDir: null
      },
      queryParamsHandling: 'merge'
    });
  }

  private updatePageState(page: number, size: number): void {
    this.pageResponse = createBasePageResponse(this.rows, page, size, this.pageResponse.metadata?.totalElements ?? 0);
    this.syncPaginationQueryParams();
  }

  private scheduleLoadPage(delayMs = 150): void {
    this.clearScheduledLoad();
    this.loadTimer = setTimeout(() => this.loadPage(), delayMs);
  }

  private clearScheduledLoad(): void {
    if (this.loadTimer) {
      clearTimeout(this.loadTimer);
      this.loadTimer = undefined;
    }
  }

  private pageIndexValue(value: unknown, fallback: number): number {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
  }

  private pageSizeValue(value: unknown, fallback: number): number {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
  }

  private normalizeFilters(filters: Record<string, unknown>): Record<string, unknown> {
    return Object.entries(filters).reduce<Record<string, unknown>>((acc, [key, value]) => {
      if (this.hasFilterValue(value)) {
        acc[key] = value;
      }
      return acc;
    }, {});
  }

  private filterStateKey(filters: Record<string, unknown>): string {
    return JSON.stringify(this.normalizeFilterValue(filters));
  }

  private sortStateKey(sorts: string[]): string {
    return JSON.stringify(sorts);
  }

  private resolveSorts(event: TableSortChangeEvent): string[] {
    if (!event.field || !event.order) {
      return [...this.defaultSorts];
    }

    return [`${event.field},${event.order === -1 ? 'desc' : 'asc'}`];
  }

  private routeSorts(): string[] | null {
    const parsedSorts = this.parseSortQuery(this.routeRef.snapshot.queryParamMap.get('sort'));
    if (parsedSorts.length > 0) {
      return parsedSorts;
    }

    const sortBy = this.routeRef.snapshot.queryParamMap.get('sortBy');
    if (!sortBy) {
      return null;
    }

    const direction = String(this.routeRef.snapshot.queryParamMap.get('sortDir') ?? 'asc').toLowerCase() === 'desc'
      ? 'desc'
      : 'asc';
    return [`${sortBy},${direction}`];
  }

  private parseSortQuery(value: string | null): string[] {
    return String(value ?? '')
      .split(';')
      .map((item) => this.parseSort(item))
      .filter((item): item is { field: string; direction: 'asc' | 'desc' } => !!item)
      .map((item) => `${item.field},${item.direction}`);
  }

  private sortQueryValue(sorts: string[]): string | null {
    if (this.sortStateKey(sorts) === this.sortStateKey(this.defaultSorts)) {
      return null;
    }

    const value = sorts
      .map((sort) => this.parseSort(sort))
      .filter((sort): sort is { field: string; direction: 'asc' | 'desc' } => !!sort)
      .map((sort) => `${sort.field}:${sort.direction}`)
      .join(';');
    return value || null;
  }

  private parseSort(sort: string | undefined): { field: string; direction: 'asc' | 'desc' } | null {
    const [field, rawDirection] = String(sort ?? '').split(/[:,]/);
    const trimmedField = field.trim();
    const direction = rawDirection?.trim().toLowerCase();
    if (!trimmedField || (direction !== 'asc' && direction !== 'desc')) {
      return null;
    }
    return { field: trimmedField, direction };
  }

  private normalizeFilterValue(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.normalizeFilterValue(item));
    }

    if (value && typeof value === 'object') {
      return Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => this.hasFilterValue(item))
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, this.normalizeFilterValue(item)]);
    }

    return value;
  }

  private hasFilterValue(value: unknown): boolean {
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    if (value && typeof value === 'object') {
      return Object.values(value).some((item) => this.hasFilterValue(item));
    }

    return value !== null && value !== undefined && value !== '';
  }

  protected abstract loadPage(): void;
}
