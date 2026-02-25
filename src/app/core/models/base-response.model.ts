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
}

export interface BasePageResponse<T> {
  data: T[];
  metadata?: PageMetadata;
}
