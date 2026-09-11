import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '@core/notifications/toast.service';
import { QuantBacktestApiService } from '../../api/quant-backtest-api.service';
import {
  buildStrategiesTableConfig,
  buildStrategySchemaTableConfig,
} from '../../models/quant-backtest.config';
import type {
  QuantStrategyConfigDto,
  StrategyValidationResponseDto,
} from '../../models/quant-backtest.dto';
import type { StrategyRecord } from '../../models/quant-backtest.model';
import { extractQuantBffError, mapStrategyDtoToRecord } from '../../services/quant-backtest.mapper';
import { coerceStrategyParameter } from '../../services/quant-backtest-validation';
import { QuantBacktestStateService } from '../../services/quant-backtest-state.service';

@Component({
  selector: 'app-strategies',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './strategies.component.html',
  styleUrl: './strategies.component.css',
})
export class StrategiesComponent implements OnInit {
  private readonly apiService = inject(QuantBacktestApiService);
  private readonly stateService = inject(QuantBacktestStateService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly strategies = signal<StrategyRecord[]>([]);

  // Drawer state
  readonly drawerOpen = signal(false);
  readonly selectedStrategy = signal<StrategyRecord | null>(null);
  readonly testParameters = signal<Record<string, unknown>>({});
  readonly selectedConfigId = signal<string | null>(null);
  readonly validating = signal(false);
  readonly validationResult = signal<StrategyValidationResponseDto | null>(null);

  readonly tableConfig = buildStrategiesTableConfig({
    onView: (row) => this.openDrawer(row),
  });
  readonly schemaTableConfig = buildStrategySchemaTableConfig();

  readonly breadcrumb = [
    { label: 'quantBacktest.breadcrumb.root' },
    { label: 'quantBacktest.breadcrumb.strategies' },
  ];

  ngOnInit(): void {
    this.loadStrategies();
  }

  loadStrategies(): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.getStrategies().subscribe({
      next: (dtos) => {
        const records = dtos.map((d) => mapStrategyDtoToRecord(d));
        this.strategies.set(records);
        this.stateService.cacheStrategies(dtos);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        const parsed = extractQuantBffError(err);
        this.error.set(parsed.message);
        this.loading.set(false);
        this.toast.error(`[${parsed.code}] ${parsed.message}`);
      },
    });
  }

  openDrawer(strategy: StrategyRecord): void {
    this.selectedStrategy.set(strategy);
    const initialParams: Record<string, unknown> = {
      ...(strategy.configs[0]?.parameters ?? {}),
    };
    strategy.schemaFields.forEach((f) => {
      if (initialParams[f.key] === undefined && f.defaultValue !== undefined) {
        initialParams[f.key] = f.defaultValue;
      }
    });

    this.testParameters.set(initialParams);
    this.selectedConfigId.set(strategy.configs[0]?.configId ?? null);
    this.validationResult.set(null);
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
    this.selectedStrategy.set(null);
    this.selectedConfigId.set(null);
    this.validationResult.set(null);
  }

  updateParam(key: string, value: unknown): void {
    const field = this.selectedStrategy()?.schemaFields.find((candidate) => candidate.key === key);
    this.testParameters.update((prev) => ({
      ...prev,
      [key]: field ? coerceStrategyParameter(field, value) : value,
    }));
  }

  loadPresetIntoTester(config: QuantStrategyConfigDto): void {
    if (config.strategyId !== this.selectedStrategy()?.id) {
      return;
    }
    this.selectedConfigId.set(config.configId);
    this.testParameters.set({ ...config.parameters });
    this.validationResult.set(null);
  }

  validateTesterParameters(): void {
    const st = this.selectedStrategy();
    if (!st) return;

    this.validating.set(true);
    this.validationResult.set(null);

    this.apiService
      .validateStrategyParameters({
        strategyId: st.id,
        strategyConfigId: this.selectedConfigId() ?? undefined,
        parameters: this.testParameters(),
      })
      .subscribe({
        next: (res) => {
          this.validating.set(false);
          this.validationResult.set(res);
          if (res.valid) {
            this.toast.success('quantBacktest.create.validationSuccess');
          } else {
            this.toast.error(
              'quantBacktest.create.validationFailed',
              res.errors.map((e) => e.message).join(', '),
            );
          }
        },
        error: (err: unknown) => {
          this.validating.set(false);
          const parsed = extractQuantBffError(err);
          this.toast.error('quantBacktest.error.validation', parsed.message);
        },
      });
  }

  launchBacktestWithStrategy(): void {
    const st = this.selectedStrategy();
    if (!st) return;
    this.closeDrawer();
    void this.router.navigate(['/quant-backtest/runs/create'], {
      queryParams: { strategyId: st.id },
    });
  }
}
