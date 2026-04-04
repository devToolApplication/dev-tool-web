import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { StrategyTypePickerItem } from '../../../../../../core/models/trade-bot/strategy-ui.model';
import { ReferenceDataService } from '../../../../../../core/services/trade-bot-service/reference-data.service';
import { I18nService } from '../../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../../core/ui-services/toast.service';
import { STRATEGY_MANAGEMENT_ROUTES } from '../../strategy-management.constants';
import { TradeBotTextKey } from '../../shared/strategy-ui.enums';
import { STRATEGY_UI_REGISTRY } from '../../shared/strategy-ui.registry';

@Component({
  selector: 'app-strategy-create-entry',
  standalone: false,
  templateUrl: './strategy-create-entry.component.html',
  styleUrl: './strategy-create-entry.component.css'
})
export class StrategyCreateEntryComponent implements OnInit {
  visible = true;
  loading = false;
  keyword = '';
  items: StrategyTypePickerItem[] = [];

  constructor(
    private readonly router: Router,
    private readonly referenceDataService: ReferenceDataService,
    private readonly i18nService: I18nService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.loadingService
      .track(this.referenceDataService.getStrategies())
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (strategies) => {
          const mappedItems = strategies
            .map((strategy) => {
              const metadata = STRATEGY_UI_REGISTRY.find((item) => item.serviceName === strategy.serviceName);
              if (!metadata) {
                return null;
              }
              return {
                serviceName: strategy.serviceName,
                name: strategy.name,
                description: strategy.description,
                routePath: metadata.routePath,
                icon: metadata.icon,
                displayOrder: metadata.displayOrder,
                family: metadata.family,
                accentColor: metadata.accentColor
              } satisfies StrategyTypePickerItem;
            })
            .filter((item): item is NonNullable<typeof item> => item !== null);

          this.items = mappedItems.sort((left, right) => left.displayOrder - right.displayOrder);
        },
        error: () => {
          this.toastService.error(this.i18nService.t(TradeBotTextKey.LoadStrategyTypesFailed));
          void this.router.navigate([STRATEGY_MANAGEMENT_ROUTES.list]);
        }
      });
  }

  get filteredItems(): StrategyTypePickerItem[] {
    const normalized = this.keyword.trim().toLowerCase();
    if (!normalized) {
      return this.items;
    }
    return this.items.filter((item) => [item.serviceName, item.name, item.description].some((part) => String(part ?? '').toLowerCase().includes(normalized)));
  }

  onKeywordChange(keyword: string): void {
    this.keyword = keyword;
  }

  onVisibleChange(visible: boolean): void {
    this.visible = visible;
    if (!visible) {
      this.onCancel();
    }
  }

  onCancel(): void {
    void this.router.navigate([STRATEGY_MANAGEMENT_ROUTES.list]);
  }

  onSelect(item: StrategyTypePickerItem): void {
    this.visible = false;
    void this.router.navigate([STRATEGY_MANAGEMENT_ROUTES.createByPath(item.routePath)]);
  }
}
