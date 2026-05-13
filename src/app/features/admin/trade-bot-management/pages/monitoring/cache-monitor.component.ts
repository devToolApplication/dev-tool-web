import { Component, OnInit, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { CacheMonitorResponse } from '../../../../../core/models/trade-bot/trading-system.model';
import { TradingSystemService } from '../../../../../core/services/trade-bot-service/trading-system.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { FormConfig, FormContext } from '../../../../../shared/ui/form-input/models/form-config.model';

@Component({
  selector: 'app-cache-monitor',
  standalone: false,
  templateUrl: './cache-monitor.component.html'
})
export class CacheMonitorComponent implements OnInit {
  readonly loading = signal(false);
  readonly stats = signal<CacheMonitorResponse | null>(null);
  readonly evictModel = signal<Record<string, unknown>>({ cacheName: '', key: '', prefix: '' });
  readonly formContext: FormContext = { user: null, mode: 'create' };
  readonly evictForm: FormConfig = {
    fields: [
      { name: 'cacheName', type: 'text', label: 'tradeBot.field.cacheName', width: '1/3' },
      { name: 'key', type: 'text', label: 'tradeBot.field.cacheKey', width: '1/3' },
      { name: 'prefix', type: 'text', label: 'tradeBot.field.cachePrefix', width: '1/3' }
    ]
  };

  constructor(
    private readonly service: TradingSystemService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly i18nService: I18nService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadingService
      .track(this.service.getCacheMonitor())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (stats) => this.stats.set(stats),
        error: () => this.toastService.error(this.i18nService.t('tradeBot.message.loadFailed'))
      });
  }

  evict(model: Record<string, unknown>): void {
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

  clearLocal(): void {
    this.loading.set(true);
    this.loadingService
      .track(this.service.evictCache({ allLocal: true }))
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => this.load(),
        error: () => this.toastService.error(this.i18nService.t('tradeBot.message.cacheEvictFailed'))
      });
  }

  statsJson(): string {
    return JSON.stringify(this.stats(), null, 2);
  }
}

function optionalText(value: unknown): string | undefined {
  const text = String(value ?? '').trim();
  return text || undefined;
}
