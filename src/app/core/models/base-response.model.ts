export interface BaseResponse<T> {
  traceId?: string;
  path?: string;
  status?: number;
  errorMessage?: string;
  data: T;
}

export interface PageMetadata {
  pageNumber?: number;
  pageSize?: number;
  totalElements?: number;
  totalPages?: number;
  currentPage?: number;
  size?: number;
}

export interface BasePageResponse<T> {
  data: T[];
  metadata?: PageMetadata;
}

export function normalizePageMetadata(metadata: PageMetadata | undefined, page = 0, size = 10): PageMetadata {
  return {
    pageNumber: metadata?.pageNumber ?? metadata?.currentPage ?? page,
    pageSize: metadata?.pageSize ?? metadata?.size ?? size,
    totalElements: metadata?.totalElements ?? 0,
    totalPages: metadata?.totalPages ?? 0,
    currentPage: metadata?.currentPage ?? metadata?.pageNumber ?? page,
    size: metadata?.size ?? metadata?.pageSize ?? size
  };
}

export function createBasePageResponse<T>(data: T[] = [], page = 0, size = 10, totalElements = 0): BasePageResponse<T> {
  return {
    data,
    metadata: normalizePageMetadata(
      {
        pageNumber: page,
        pageSize: size,
        totalElements,
        totalPages: size > 0 ? Math.ceil(totalElements / size) : 0
      },
      page,
      size
    )
  };
}

export function normalizeBasePageResponse<T>(response: BasePageResponse<T> | undefined, page = 0, size = 10): BasePageResponse<T> {
  return {
    data: response?.data ?? [],
    metadata: normalizePageMetadata(response?.metadata, page, size)
  };
}
