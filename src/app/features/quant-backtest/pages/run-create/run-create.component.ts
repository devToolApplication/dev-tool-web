import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '@core/notifications/toast.service';
import { QuantBacktestApiService } from '../../api/quant-backtest-api.service';
import {
  EXECUTION_MODE_I18N_MAP,
  SCHEDULE_PRESETS,
  SIMULATION_OPTION_I18N_MAP,
} from '../../models/quant-backtest.config';
import type {
  BacktestCreateResponseDto,
  CreateQuantScheduleResponseDto,
  ExecutionMode,
  QuantDatasetDto,
  QuantStrategyDto,
} from '../../models/quant-backtest.dto';
import type {
  BacktestCreateFormModel,
  StrategySchemaField,
} from '../../models/quant-backtest.model';
import {
  extractQuantBffError,
  mapFormToCreateRequestDto,
  parseSchemaProperties,
} from '../../services/quant-backtest.mapper';
import {
  coerceStrategyParameter,
  validateCreateStep,
} from '../../services/quant-backtest-validation';
import { QuantBacktestStateService } from '../../services/quant-backtest-state.service';

@Component({
  selector: 'app-run-create',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './run-create.component.html',
  styleUrl: './run-create.component.css',
})
export class RunCreateComponent implements OnInit {
  private readonly apiService = inject(QuantBacktestApiService);
  private readonly stateService = inject(QuantBacktestStateService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  readonly currentStep = signal(1);
  readonly maxVisitedStep = signal(1);
  readonly submitting = signal(false);
  readonly validating = signal(false);
  readonly strategiesLoading = signal(false);
  readonly datasetsLoading = signal(false);
  readonly loadingInit = computed(() => this.strategiesLoading() || this.datasetsLoading());
  readonly serverError = signal<string | null>(null);
  readonly serverErrorCode = signal<string | null>(null);
  readonly initFailed = signal(false);
  readonly fieldErrors = signal<Record<string, string>>({});

  readonly strategies = signal<QuantStrategyDto[]>([]);
  readonly readyDatasets = signal<QuantDatasetDto[]>([]);
  readonly schedulePresets = SCHEDULE_PRESETS;
  readonly schedulePresetOptions = SCHEDULE_PRESETS.map((preset) => ({
    label: preset.label,
    value: preset.cron,
  }));
  readonly executionModeOptions = [
    { label: 'quantBacktest.create.field.modeRunNow', value: 'RUN_NOW' },
    { label: 'quantBacktest.create.field.modeSchedule', value: 'SCHEDULE' },
  ];
  readonly booleanOptions = [
    { label: 'quantBacktest.common.true', value: true },
    { label: 'quantBacktest.common.false', value: false },
  ];
  readonly scheduleSuccessResponse = signal<CreateQuantScheduleResponseDto | null>(null);
  private readonly submissionKey = signal<string | null>(null);

  readonly form = signal<BacktestCreateFormModel>({
    name: '',
    executionMode: 'RUN_NOW',
    cron: '',
    timezone: 'UTC',
    description: '',
    datasetVersion: '',
    instrumentIds: [],
    start: '',
    end: '',
    strategyId: '',
    strategyConfigId: '',
    parameters: {},
    initialCapital: '',
    intrabarPolicy: '',
    feeModel: '',
    slippageModel: '',
    slippageBps: '',
  });

  readonly selectedStrategy = computed(() => {
    const strategyId = this.form().strategyId;
    return this.strategies().find((strategy) => strategy.id === strategyId) ?? null;
  });

  readonly selectedConfig = computed(() => {
    const strategy = this.selectedStrategy();
    return (
      strategy?.configs.find((config) => config.configId === this.form().strategyConfigId) ?? null
    );
  });

  readonly schemaFields = computed<StrategySchemaField[]>(() => {
    const strategy = this.selectedStrategy();
    return strategy ? parseSchemaProperties(strategy.schema) : [];
  });

  readonly selectedDataset = computed(() => {
    const datasetVersion = this.form().datasetVersion;
    return (
      this.readyDatasets().find(
        (dataset) => dataset.datasetVersion === datasetVersion && dataset.status === 'READY',
      ) ?? null
    );
  });

  readonly simulationFields = computed(() => this.selectedStrategy()?.simulationFields ?? []);
  readonly strategyOptions = computed(() =>
    this.strategies().map((strategy) => ({
      label: strategy.name,
      value: strategy.id,
    })),
  );
  readonly configOptions = computed(() =>
    (this.selectedStrategy()?.configs ?? []).map((config) => ({
      label: config.name,
      value: config.configId,
    })),
  );
  readonly datasetOptions = computed(() =>
    this.readyDatasets().map((dataset) => ({
      label: `${dataset.datasetVersion} (${dataset.instrumentIds.join(', ')})`,
      value: dataset.datasetVersion,
    })),
  );

  readonly breadcrumb = [
    { label: 'quantBacktest.breadcrumb.root' },
    { label: 'quantBacktest.breadcrumb.runs', routerLink: '/quant-backtest/runs' },
    { label: 'quantBacktest.breadcrumb.create' },
  ];

  ngOnInit(): void {
    const targetStrategyId = this.route.snapshot.queryParamMap.get('strategyId');
    this.loadInitialData(targetStrategyId);
  }

  loadInitialData(targetStrategyId?: string | null): void {
    this.serverError.set(null);
    this.serverErrorCode.set(null);
    this.initFailed.set(false);
    this.strategiesLoading.set(true);

    this.apiService.getStrategies().subscribe({
      next: (strategies) => {
        this.strategies.set(strategies);
        this.stateService.cacheStrategies(strategies);
        const selected =
          strategies.find((strategy) => strategy.id === targetStrategyId) ?? strategies[0];
        if (selected) {
          this.selectStrategy(selected);
        }
        this.strategiesLoading.set(false);
      },
      error: (error: unknown) => {
        const parsed = extractQuantBffError(error);
        this.serverError.set(parsed.message);
        this.serverErrorCode.set(parsed.code);
        this.initFailed.set(true);
        this.strategiesLoading.set(false);
      },
    });

    this.loadAllReadyDatasets();
  }

  private loadAllReadyDatasets(cursor?: string | null, accumulated: QuantDatasetDto[] = []): void {
    this.datasetsLoading.set(true);
    this.apiService.getReadyDatasets(cursor).subscribe({
      next: (page) => {
        const ready = page.items.filter((dataset) => dataset.status === 'READY');
        const nextAccumulated = [...accumulated, ...ready];
        this.readyDatasets.set(nextAccumulated);
        this.stateService.cacheDatasets(nextAccumulated);
        if (nextAccumulated.length > 0 && !this.form().datasetVersion) {
          this.selectDataset(nextAccumulated[0]!);
        }

        if (page.hasMore && page.nextCursor) {
          this.loadAllReadyDatasets(page.nextCursor, nextAccumulated);
        } else {
          this.datasetsLoading.set(false);
        }
      },
      error: (error: unknown) => {
        const parsed = extractQuantBffError(error);
        this.serverError.set(parsed.message);
        this.serverErrorCode.set(parsed.code);
        this.initFailed.set(true);
        this.datasetsLoading.set(false);
      },
    });
  }

  selectStrategy(strategy: QuantStrategyDto): void {
    const defaultConfig = strategy.configs[0];
    const parameters: Record<string, unknown> = {
      ...(defaultConfig?.parameters ?? {}),
    };
    for (const field of parseSchemaProperties(strategy.schema)) {
      if (parameters[field.key] === undefined && field.defaultValue !== undefined) {
        parameters[field.key] = field.defaultValue;
      }
    }

    const getSimulationDefault = (name: string): string => {
      const field = strategy.simulationFields.find((candidate) => candidate.name === name);
      const configuredValue = defaultConfig?.simulation[name];
      const value = configuredValue ?? field?.default;
      return value === undefined || value === null ? '' : String(value);
    };

    const capitalField = strategy.simulationFields.find(
      (field) => field.name === 'initial_capital',
    );
    const slippageField = strategy.simulationFields.find((field) => field.name === 'slippage_bps');

    this.form.update((previous) => ({
      ...previous,
      strategyId: strategy.id,
      strategyConfigId: defaultConfig?.configId ?? '',
      parameters,
      initialCapital:
        capitalField?.default === undefined
          ? previous.initialCapital
          : String(capitalField.default),
      intrabarPolicy: getSimulationDefault('intrabar_policy'),
      feeModel: getSimulationDefault('fee_model'),
      slippageModel: getSimulationDefault('slippage_model'),
      slippageBps:
        slippageField?.default === undefined ? previous.slippageBps : String(slippageField.default),
    }));
    this.clearSubmissionKey();
  }

  onStrategyChange(strategyId: string): void {
    const strategy = this.strategies().find((candidate) => candidate.id === strategyId);
    if (strategy) {
      this.selectStrategy(strategy);
    }
  }

  onPresetChange(configId: string): void {
    const strategy = this.selectedStrategy();
    const config = strategy?.configs.find(
      (candidate) => candidate.configId === configId && candidate.strategyId === strategy.id,
    );
    if (!config || !strategy) {
      return;
    }
    this.form.update((previous) => ({
      ...previous,
      strategyConfigId: config.configId,
      parameters: { ...config.parameters },
    }));
    this.clearSubmissionKey();
  }

  selectDataset(dataset: QuantDatasetDto): void {
    if (dataset.status !== 'READY') {
      return;
    }
    this.form.update((previous) => ({
      ...previous,
      datasetVersion: dataset.datasetVersion,
      instrumentIds: dataset.instrumentIds.length ? [dataset.instrumentIds[0]!] : [],
      start: dataset.start,
      end: dataset.end,
    }));
    this.clearSubmissionKey();
  }

  onDatasetChange(datasetVersion: string): void {
    const dataset = this.readyDatasets().find(
      (candidate) => candidate.datasetVersion === datasetVersion,
    );
    if (dataset) {
      this.selectDataset(dataset);
    }
  }

  onInstrumentKeydown(event: KeyboardEvent, currentIndex: number): void {
    const instruments = this.selectedDataset()?.instrumentIds ?? [];
    if (instruments.length <= 1) {
      return;
    }
    let targetIndex = -1;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      targetIndex = (currentIndex + 1) % instruments.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      targetIndex = (currentIndex - 1 + instruments.length) % instruments.length;
    }
    if (targetIndex >= 0) {
      const nextInstrument = instruments[targetIndex]!;
      this.selectInstrument(nextInstrument);
      if (typeof document !== 'undefined') {
        const el = document.getElementById(
          `instrument-choice-${nextInstrument}`,
        ) as HTMLInputElement | null;
        el?.focus();
      }
    }
  }

  selectInstrument(instrumentId: string): void {
    this.form.update((previous) => ({
      ...previous,
      instrumentIds: [instrumentId],
    }));
    this.fieldErrors.update((previous) => {
      const next = { ...previous };
      delete next['instrumentIds'];
      return next;
    });
    this.clearSubmissionKey();
  }

  toggleInstrument(instrumentId: string): void {
    this.selectInstrument(instrumentId);
  }

  updateFormField<K extends keyof BacktestCreateFormModel>(
    key: K,
    value: BacktestCreateFormModel[K],
  ): void {
    this.form.update((previous) => ({ ...previous, [key]: value }));
    this.fieldErrors.update((previous) => {
      const next = { ...previous };
      delete next[key as string];
      return next;
    });
    this.clearSubmissionKey();
  }

  updateNumericFormField(key: 'initialCapital' | 'slippageBps', value: number | null): void {
    this.updateFormField(key, value === null ? '' : String(value));
  }

  updateStrategyParam(key: string, value: unknown): void {
    const field = this.schemaFields().find((candidate) => candidate.key === key);
    this.form.update((previous) => ({
      ...previous,
      parameters: {
        ...previous.parameters,
        [key]: field ? coerceStrategyParameter(field, value) : value,
      },
    }));
    this.clearSubmissionKey();
  }

  getExecutionModeI18nKey(mode: ExecutionMode): string {
    return EXECUTION_MODE_I18N_MAP[mode] ?? 'quantBacktest.common.notAvailable';
  }

  getSimulationOptionI18nKey(value: string | undefined | null): string {
    if (!value) return 'quantBacktest.common.notAvailable';
    return SIMULATION_OPTION_I18N_MAP[value] ?? `quantBacktest.simulation.${value}`;
  }

  simulationOptions(name: string): Array<{ label: string; value: string }> {
    const field = this.simulationFields().find((candidate) => candidate.name === name);
    return (field?.options ?? []).map((value) => ({
      label: this.getSimulationOptionI18nKey(value),
      value,
    }));
  }

  goToStep(step: number): void {
    if (step < 1 || step > 4) {
      return;
    }
    if (step > this.currentStep() && !this.validateStep(this.currentStep())) {
      return;
    }
    this.currentStep.set(step);
    this.maxVisitedStep.update((visited) => Math.max(visited, step));
  }

  nextStep(): void {
    this.goToStep(this.currentStep() + 1);
  }

  prevStep(): void {
    this.goToStep(this.currentStep() - 1);
  }

  validateStep(step: number): boolean {
    const errors = validateCreateStep(step, this.form(), this.strategies(), this.readyDatasets());
    this.fieldErrors.set(errors);
    return Object.keys(errors).length === 0;
  }

  validateParametersOnServer(): void {
    const strategyId = this.form().strategyId;
    if (!strategyId || !this.validateStep(3)) {
      return;
    }
    this.validating.set(true);
    this.serverError.set(null);
    this.apiService
      .validateStrategyParameters({
        strategyId,
        strategyConfigId: this.form().strategyConfigId || undefined,
        parameters: this.form().parameters,
      })
      .subscribe({
        next: (response) => {
          this.validating.set(false);
          if (response.valid) {
            this.toast.success('quantBacktest.create.validationSuccess');
            return;
          }
          const errors: Record<string, string> = {};
          response.errors.forEach((fieldError) => {
            errors[fieldError.field] = fieldError.message;
          });
          this.fieldErrors.set(errors);
          this.toast.error(
            'quantBacktest.create.validationFailed',
            response.errors.map((fieldError) => fieldError.message).join(', '),
          );
        },
        error: (error: unknown) => {
          this.validating.set(false);
          const parsed = extractQuantBffError(error);
          this.serverError.set(parsed.message);
          this.serverErrorCode.set(parsed.code);
          this.toast.error('quantBacktest.error.validation', parsed.message);
        },
      });
  }

  submitBacktest(): void {
    if (this.submitting()) {
      this.toast.info('quantBacktest.error.duplicateSubmit');
      return;
    }

    const errors = [1, 2, 3].reduce(
      (allErrors, step) => ({
        ...allErrors,
        ...validateCreateStep(step, this.form(), this.strategies(), this.readyDatasets()),
      }),
      {} as Record<string, string>,
    );
    this.fieldErrors.set(errors);
    if (Object.keys(errors).length > 0) {
      this.toast.error('quantBacktest.create.validationRequired');
      return;
    }

    this.submitting.set(true);
    this.serverError.set(null);
    this.serverErrorCode.set(null);
    const key = this.submissionKey() ?? this.createSubmissionKey();
    this.submissionKey.set(key);

    this.apiService.createRun(mapFormToCreateRequestDto(this.form()), key).subscribe({
      next: (response: BacktestCreateResponseDto) => {
        this.submitting.set(false);
        this.submissionKey.set(null);
        if (response.executionMode === 'RUN_NOW') {
          this.toast.success('quantBacktest.create.runSuccess');
          void this.router.navigate(['/quant-backtest/runs', response.jobRunId]);
        } else {
          this.toast.success('quantBacktest.create.scheduleSuccess');
          this.scheduleSuccessResponse.set(response);
        }
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        const parsed = extractQuantBffError(error);
        this.serverError.set(parsed.message);
        this.serverErrorCode.set(parsed.code);
        if (parsed.fieldErrors) {
          const fieldErrors: Record<string, string> = {};
          parsed.fieldErrors.forEach((fieldError) => {
            fieldErrors[fieldError.field] = fieldError.message;
          });
          this.fieldErrors.set(fieldErrors);
        }
        this.toast.error('quantBacktest.error.submit', parsed.message);
      },
    });
  }

  retrySubmit(): void {
    this.submitBacktest();
  }

  retryInit(): void {
    this.loadInitialData(this.route.snapshot.queryParamMap.get('strategyId'));
  }

  onAlertAction(): void {
    if (this.initFailed() || this.strategies().length === 0 || this.readyDatasets().length === 0) {
      this.retryInit();
    } else {
      this.retrySubmit();
    }
  }

  cancel(): void {
    void this.router.navigate(['/quant-backtest/runs']);
  }

  openJobServiceJobs(): void {
    void this.router.navigate(['/job-service/jobs']);
  }

  private createSubmissionKey(): string {
    const id =
      typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return `qbt-ui-${id}`;
  }

  private clearSubmissionKey(): void {
    if (!this.submitting()) {
      this.submissionKey.set(null);
    }
  }
}
