import { ActivatedRoute, Router } from '@angular/router';
import { BasePageResponse, createBasePageResponse, normalizeBasePageResponse } from '../../../../../core/models/base-response.model';
import { TablePageChangeEvent } from './table';

export abstract class BasePagedList<T> {
  rows: T[] = [];
  filters: Record<string, unknown> = {};
  pageResponse: BasePageResponse<T>;
  private readonly routeRef: ActivatedRoute;
  private readonly routerRef: Router;

  protected constructor(
    route: ActivatedRoute,
    router: Router,
    defaultPageSize = 10
  ) {
    this.routeRef = route;
    this.routerRef = router;
    const page = this.parsePositiveInt(this.routeRef.snapshot.queryParamMap.get('page'), 0);
    const size = this.parsePositiveInt(this.routeRef.snapshot.queryParamMap.get('size'), defaultPageSize);
    this.pageResponse = createBasePageResponse<T>([], page, size);
  }

  get page(): number {
    return this.pageResponse.metadata?.pageNumber ?? 0;
  }

  get pageSize(): number {
    return this.pageResponse.metadata?.pageSize ?? 10;
  }

  onSearch(filters: Record<string, unknown>): void {
    this.filters = filters;
    this.updatePageState(0, this.pageSize);
    this.loadPage();
  }

  onResetFilter(): void {
    this.filters = {};
    this.updatePageState(0, this.pageSize);
    this.loadPage();
  }

  onPageChange(event: TablePageChangeEvent): void {
    this.updatePageState(event.page, event.rows);
    this.loadPage();
  }

  protected setPageResponse(response: BasePageResponse<T>): void {
    this.pageResponse = normalizeBasePageResponse(response, this.page, this.pageSize);
    this.rows = this.pageResponse.data ?? [];
  }

  protected syncPaginationQueryParams(): void {
    void this.routerRef.navigate([], {
      relativeTo: this.routeRef,
      queryParams: {
        page: this.page,
        size: this.pageSize
      },
      queryParamsHandling: 'merge'
    });
  }

  private updatePageState(page: number, size: number): void {
    this.pageResponse = createBasePageResponse(this.rows, page, size, this.pageResponse.metadata?.totalElements ?? 0);
    this.syncPaginationQueryParams();
  }

  private parsePositiveInt(value: string | null, fallback: number): number {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
  }

  protected abstract loadPage(): void;
}
