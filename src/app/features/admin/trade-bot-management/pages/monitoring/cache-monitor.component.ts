import { Component, OnInit, computed, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { CacheMonitorResponse } from '../../../../../core/models/trade-bot/trading-system.model';
import { TradingSystemService } from '../../../../../core/services/trade-bot-service/trading-system.service';
import { ConfirmDialogService } from '../../../../../shared/ui/overlay/confirm-dialog/confirm-dialog.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { FormConfig, FormContext } from '../../../../../shared/ui/form-input/models/form-config.model';
import { TableConfig } from '../../../../../shared/ui/table/models/table-config.model';
import { toUniqueTextOptions } from '../../trade-bot-form-utils';

@Component({
  selector: 'app-cache-monitor',
  standalone: false,
  templateUrl: './cache-monitor.component.html'
})
export class CacheMonitorComponent implements OnInit {
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly stats = signal<CacheMonitorResponse | null>(null);
  readonly evictModel = signal<Record<string, unknown>>({ cacheName: '', key: '', prefix: '' });
  readonly summaryCards = computed(() => {
    const stats = this.stats();
    return [
      { label: 'tradeBot.cache.generatedAt', value: stats?.generatedAt ?? null },
      { label: 'tradeBot.cache.cacheNamesCount', value: this.cacheNames().length },
      { label: 'tradeBot.cache.localStatus', value: stats?.local ? 'tradeBot.dashboard.ok' : 'notAvailable' },
      { label: 'tradeBot.cache.redisStatus', value: stats?.redis ? 'tradeBot.dashboard.ok' : 'notAvailable' },
      { label: 'tradeBot.cache.metricsStatus', value: stats?.metrics ? 'tradeBot.dashboard.ok' : 'notAvailable' }
    ];
  });
  readonly cacheNames = computed(() => {
    const stats = this.stats();
    const names = new Set<string>(stats?.cacheNames ?? []);
    Object.keys(asRecord(stats?.local)).forEach((name) => names.add(name));
    Object.keys(asRecord(stats?.redis)).forEach((name) => names.add(name));
    return [...names].sort();
  });
  readonly cacheRows = computed(() =>
    this.cacheNames().map((cacheName) => {
      const local = asRecord(asRecord(this.stats()?.local)[cacheName]);
      const redis = asRecord(asRecord(this.stats()?.redis)[cacheName]);
      const metrics = asRecord(asRecord(this.stats()?.metrics)[cacheName]);
      return {
        cacheName,
        localEntries: numberFrom(local, ['entries', 'entryCount', 'size', 'count']),
        redisEntries: numberFrom(redis, ['entries', 'entryCount', 'size', 'count']),
        hit: numberFrom(metrics, ['hit', 'hits', 'hitCount']),
        miss: numberFrom(metrics, ['miss', 'misses', 'missCount'])
      };
    })
  );
  readonly formContext: FormContext = { user: null, mode: 'create', extra: { cacheNameOptions: [] } };
  readonly evictForm: FormConfig = {
    fields: [
      {
        name: 'cacheName',
        type: 'auto-complete',
        label: 'tradeBot.field.cacheName',
        width: '1/3',
        optionsExpression: 'context.extra?.cacheNameOptions || []'
      },
      { name: 'key', type: 'text', label: 'tradeBot.field.cacheKey', width: '1/3' },
      { name: 'prefix', type: 'text', label: 'tradeBot.field.cachePrefix', width: '1/3' }
    ]
  };
  readonly tableConfig: TableConfig = {
    title: 'tradeBot.cache.table',
    columns: [
      { field: 'cacheName', header: 'tradeBot.field.cacheName', type: 'copyable', minWidth: '18rem' },
      { field: 'localEntries', header: 'tradeBot.cache.localEntries', type: 'number' },
      { field: 'redisEntries', header: 'tradeBot.cache.redisEntries', type: 'number' },
      { field: 'hit', header: 'tradeBot.cache.hit', type: 'number' },
      { field: 'miss', header: 'tradeBot.cache.miss', type: 'number' },
      {
        field: 'actions',
        header: 'tradeBot.field.actions',
        type: 'actions',
        actions: [
          { label: 'tradeBot.cache.evictCacheName', icon: 'pi pi-trash', severity: 'danger', showLabel: false, onClick: (row) => this.evict({ cacheName: row.cacheName }) }
        ]
      }
    ],
    pagination: true,
    rows: 20,
    minWidth: '64rem'
  };

  constructor(
    private readonly service: TradingSystemService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly i18nService: I18nService,
    private readonly confirmDialogService: ConfirmDialogService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.loadingService
      .track(this.service.getCacheMonitor())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (stats) => {
          this.stats.set(stats);
          this.formContext.extra = {
            cacheNameOptions: toUniqueTextOptions(this.cacheNames(), (cacheName) => cacheName)
          };
          this.error.set(null);
        },
        error: () => {
          const message = this.i18nService.t('tradeBot.message.loadFailed');
          this.error.set(message);
          this.toastService.error(message);
        }
      });
  }

  async evict(model: Record<string, unknown>): Promise<void> {
    const confirmed = await this.confirmDialogService.confirm({ message: 'tradeBot.message.confirmEvictCache' });
    if (!confirmed) {
      return;
    }
    this.loading.set(true);
    this.loadingService
      .track(
        this.service.evictCache({
          cacheName: optionalText(model['cacheName']),
          key: optionalText(model['key']),
          prefix: optionalText(model['prefix'])
        })
      )
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => this.load(),
        error: () => this.toastService.error(this.i18nService.t('tradeBot.message.cacheEvictFailed'))
      });
  }

  async clearLocal(): Promise<void> {
    const confirmed = await this.confirmDialogService.confirm({ message: 'tradeBot.message.confirmClearLocalCache' });
    if (!confirmed) {
      return;
    }
    this.loading.set(true);
    this.loadingService
      .track(this.service.evictCache({ allLocal: true }))
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => this.load(),
        error: () => this.toastService.error(this.i18nService.t('tradeBot.message.cacheEvictFailed'))
      });
  }

  statsJson(): CacheMonitorResponse | null {
    return this.stats();
  }
}

function optionalText(value: unknown): string | undefined {
  const text = String(value ?? '').trim();
  return text || undefined;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function numberFrom(record: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = Number(record[key]);
    if (Number.isFinite(value)) {
      return value;
    }
  }
  return null;
}
