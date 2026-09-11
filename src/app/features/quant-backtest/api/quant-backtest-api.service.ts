import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../enviroment/environment';
import type {
  BacktestCreateRequestDto,
  BacktestCreateResponseDto,
  BacktestRunsQueryParamsDto,
  CursorPageResponseDto,
  QuantBaseResponseDto,
  QuantCollectionPageDto,
  QuantDatasetDto,
  QuantEquityPointDto,
  QuantMetricsResponseDto,
  QuantOrderDto,
  QuantRunDetailDto,
  QuantRunsPageResponseDto,
  QuantSignalDto,
  QuantStrategyConfigDto,
  QuantStrategyDto,
  QuantStrategiesResponseDto,
  QuantTradeDto,
  StrategyValidationRequestDto,
  StrategyValidationResponseDto,
} from '../models/quant-backtest.dto';
import type { CursorPageModel } from '../models/quant-backtest.model';

@Injectable({ providedIn: 'root' })
export class QuantBacktestApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl.jobSchedulerUrl}/quant-backtest`;

  getRuns(params?: BacktestRunsQueryParamsDto): Observable<QuantRunsPageResponseDto> {
    let httpParams = new HttpParams();
    if (params?.page != null) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.size != null) {
      httpParams = httpParams.set('size', params.size.toString());
    }
    if (params?.keyword) {
      httpParams = httpParams.set('keyword', params.keyword);
    }
    if (params?.status) {
      httpParams = httpParams.set('status', params.status);
    }
    if (params?.strategyId) {
      httpParams = httpParams.set('strategyId', params.strategyId);
    }
    if (params?.instrument) {
      httpParams = httpParams.set('instrument', params.instrument);
    }
    if (params?.dateFrom) {
      httpParams = httpParams.set('dateFrom', params.dateFrom);
    }
    if (params?.dateTo) {
      httpParams = httpParams.set('dateTo', params.dateTo);
    }
    if (params?.triggerType) {
      httpParams = httpParams.set('triggerType', params.triggerType);
    }

    return this.http
      .get<QuantBaseResponseDto<QuantRunsPageResponseDto>>(`${this.baseUrl}/runs`, {
        params: httpParams,
      })
      .pipe(map(unwrapData));
  }

  createRun(
    request: BacktestCreateRequestDto,
    idempotencyKey: string,
  ): Observable<BacktestCreateResponseDto> {
    const headers = new HttpHeaders({ 'Idempotency-Key': idempotencyKey });
    return this.http
      .post<
        QuantBaseResponseDto<BacktestCreateResponseDto>
      >(`${this.baseUrl}/runs`, request, { headers })
      .pipe(map(unwrapData));
  }

  getRunDetail(runId: string): Observable<QuantRunDetailDto> {
    return this.http
      .get<QuantBaseResponseDto<QuantRunDetailDto>>(`${this.baseUrl}/runs/${encodeURIComponent(runId)}`)
      .pipe(map(unwrapData));
  }

  getTrades(
    runId: string,
    cursor?: string | null,
    limit = 50,
  ): Observable<CursorPageResponseDto<QuantTradeDto>> {
    return this.getCursorPage<QuantTradeDto>(runId, 'trades', cursor, limit);
  }

  getOrders(
    runId: string,
    cursor?: string | null,
    limit = 50,
  ): Observable<CursorPageResponseDto<QuantOrderDto>> {
    return this.getCursorPage<QuantOrderDto>(runId, 'orders', cursor, limit);
  }

  getSignals(
    runId: string,
    cursor?: string | null,
    limit = 50,
  ): Observable<CursorPageResponseDto<QuantSignalDto>> {
    return this.getCursorPage<QuantSignalDto>(runId, 'signals', cursor, limit);
  }

  getEquity(
    runId: string,
    cursor?: string | null,
    limit = 100,
  ): Observable<CursorPageResponseDto<QuantEquityPointDto>> {
    return this.getCursorPage<QuantEquityPointDto>(runId, 'equity', cursor, limit);
  }

  getMetrics(runId: string): Observable<QuantMetricsResponseDto> {
    return this.http
      .get<
        QuantBaseResponseDto<QuantMetricsResponseDto>
      >(`${this.baseUrl}/runs/${encodeURIComponent(runId)}/metrics`)
      .pipe(map(unwrapData));
  }

  getStrategies(): Observable<QuantStrategyDto[]> {
    return this.http
      .get<QuantBaseResponseDto<QuantStrategiesResponseDto>>(`${this.baseUrl}/strategies`)
      .pipe(
        map(unwrapData),
        map((response) => response.strategies),
      );
  }

  getStrategyConfig(configId: string): Observable<QuantStrategyConfigDto> {
    return this.http
      .get<
        QuantBaseResponseDto<QuantStrategyConfigDto>
      >(`${this.baseUrl}/strategies/configs/${encodeURIComponent(configId)}`)
      .pipe(map(unwrapData));
  }

  validateStrategyParameters(
    request: StrategyValidationRequestDto,
  ): Observable<StrategyValidationResponseDto> {
    return this.http
      .post<
        QuantBaseResponseDto<StrategyValidationResponseDto>
      >(`${this.baseUrl}/strategies/validate`, request)
      .pipe(map(unwrapData));
  }

  getReadyDatasets(cursor?: string | null): Observable<CursorPageModel<QuantDatasetDto>> {
    let params = new HttpParams().set('status', 'READY');
    if (cursor) {
      params = params.set('cursor', cursor);
    }
    return this.http
      .get<
        QuantBaseResponseDto<QuantCollectionPageDto<QuantDatasetDto>>
      >(`${this.baseUrl}/datasets`, { params })
      .pipe(
        map(unwrapData),
        map((response) => ({
          items: response.data,
          nextCursor: response.metadata.nextCursor,
          hasMore: response.metadata.hasMore,
        })),
      );
  }

  private getCursorPage<T>(
    runId: string,
    resource: string,
    cursor: string | null | undefined,
    limit: number,
  ): Observable<CursorPageResponseDto<T>> {
    let params = new HttpParams().set('limit', limit.toString());
    if (cursor) {
      params = params.set('cursor', cursor);
    }
    return this.http
      .get<
        QuantBaseResponseDto<CursorPageResponseDto<T>>
      >(`${this.baseUrl}/runs/${encodeURIComponent(runId)}/${resource}`, { params })
      .pipe(map(unwrapData));
  }
}

function unwrapData<T>(response: QuantBaseResponseDto<T>): T {
  if (response.data === null) {
    throw new Error(response.errorMessage ?? 'BFF response did not include data');
  }
  return response.data;
}
