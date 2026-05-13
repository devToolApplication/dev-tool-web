import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { ConfigVersionHistoryResponse } from '../../../../../core/models/trade-bot/trading-system.model';
import { TradingSystemService } from '../../../../../core/services/trade-bot-service/trading-system.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';

@Component({
  selector: 'app-config-version-history',
  standalone: false,
  templateUrl: './config-version-history.component.html'
})
export class ConfigVersionHistoryComponent implements OnInit {
  readonly loading = signal(false);
  readonly history = signal<ConfigVersionHistoryResponse | null>(null);

  constructor(
    private readonly service: TradingSystemService,
    private readonly route: ActivatedRoute,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly i18nService: I18nService
  ) {}

  ngOnInit(): void {
    const type = this.route.snapshot.paramMap.get('type') as 'indicator' | 'rule' | 'strategy';
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.loading.set(true);
    this.loadingService
      .track(this.service.getConfigVersions(type, id))
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (history) => this.history.set(history),
        error: () => this.toastService.error(this.i18nService.t('tradeBot.message.loadFailed'))
      });
  }

  historyJson(): string {
    return JSON.stringify(this.history(), null, 2);
  }
}
