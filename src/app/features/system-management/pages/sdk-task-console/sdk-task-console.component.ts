import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, type ParamMap } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import type { SelectOption, SelectValue } from '@shared/ui/primitives/select/select';
import type { AppTabItem } from '@shared/ui/primitives/tabs/tabs.component';
import { SdkTaskApiService } from '../../api/sdk-task-api.service';
import type {
  JsonObject,
  SdkTaskProvider,
  SdkTaskRunDetail,
  SdkTaskRunListQuery,
  SdkTaskRunRequest,
  SdkTaskRunSummary,
  SdkTaskStatus,
} from '../../model/sdk-task.model';

const POLL_INTERVAL_MS = 5000;
const TERMINAL_STATUSES: SdkTaskStatus[] = [
  'BLOCKED_CONFIG',
  'BLOCKED_MCP',
  'COMPLETED',
  'FAILED',
  'FAILED_DEPENDENCY',
  'TIMEOUT',
];

export interface SdkTaskConsoleForm {
  agentCode: string;
  provider: SdkTaskProvider;
  prompt: string;
  threadId: string;
  workingDirectory: string;
  model: string;
  reasoningEffort: string;
  outputSchemaText: string;
  requestContextText: string;
  callbackUrl: string;
  callbackAuthSecretCode: string;
}

type SdkTaskConsoleStringField = Exclude<keyof SdkTaskConsoleForm, 'provider'>;

const EMPTY_FORM: SdkTaskConsoleForm = {
  agentCode: '',
  provider: 'codex',
  prompt: '',
  threadId: '',
  workingDirectory: '',
  model: 'gpt-5.2',
  reasoningEffort: 'medium',
  outputSchemaText: '',
  requestContextText: '',
  callbackUrl: '',
  callbackAuthSecretCode: '',
};

@Component({
  selector: 'app-sdk-task-console',
  standalone: false,
  templateUrl: './sdk-task-console.component.html',
  styleUrl: './sdk-task-console.component.css',
})
export class SdkTaskConsoleComponent implements OnInit, OnDestroy {
  private readonly api = inject(SdkTaskApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  readonly form = signal<SdkTaskConsoleForm>({ ...EMPTY_FORM });
  readonly query = signal<SdkTaskRunListQuery>({ page: 1, size: 20 });
  readonly runs = signal<SdkTaskRunSummary[]>([]);
  readonly total = signal(0);
  readonly selectedRunDetail = signal<SdkTaskRunDetail | null>(null);
  readonly selectedTab = signal('summary');
  readonly loadingRuns = signal(false);
  readonly loadingDetail = signal(false);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly formError = signal<string | null>(null);
  readonly detailError = signal<string | null>(null);
  readonly polling = signal(false);

  readonly canRun = computed(() => (
    !!this.form().agentCode.trim() &&
    !!this.form().prompt.trim() &&
    !this.submitting()
  ));
  readonly providerOptions: SelectOption[] = [
    { label: 'systemManagement.sdkTask.provider.codex', value: 'codex' },
    { label: 'systemManagement.sdkTask.provider.claude', value: 'claude' },
  ];
  readonly statusOptions: SelectOption[] = [
    { label: 'systemManagement.sdkTask.status.all', value: null },
    ...(['RUNNING', 'COMPLETED', 'FAILED', 'FAILED_DEPENDENCY', 'TIMEOUT', 'BLOCKED_CONFIG', 'BLOCKED_MCP'] as SdkTaskStatus[])
      .map((status) => ({ label: `systemManagement.sdkTask.status.${status}`, value: status })),
  ];
  readonly tabs: AppTabItem[] = [
    { label: 'systemManagement.sdkTask.tab.summary', value: 'summary' },
    { label: 'systemManagement.sdkTask.tab.request', value: 'request' },
    { label: 'systemManagement.sdkTask.tab.events', value: 'events' },
    { label: 'systemManagement.sdkTask.tab.output', value: 'output' },
    { label: 'systemManagement.sdkTask.tab.raw', value: 'raw' },
  ];

  ngOnInit(): void {
    this.query.set(parseSdkTaskQuery(this.route.snapshot.queryParamMap));
    void this.loadRuns(this.query().page ?? 1, this.query().size ?? 20);
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  updateForm(key: SdkTaskConsoleStringField, value: string | null): void {
    this.form.update((current) => ({
      ...current,
      [key]: value ?? '',
    }));
  }

  updateProvider(value: SelectValue): void {
    this.form.update((current) => ({
      ...current,
      provider: value === 'claude' ? 'claude' : 'codex',
    }));
  }

  updateQuery<K extends keyof SdkTaskRunListQuery>(key: K, value: SdkTaskRunListQuery[K] | null): void {
    const next = {
      ...this.query(),
      [key]: normalizeQueryValue(value),
      page: 1,
    } as SdkTaskRunListQuery;
    this.query.set(next);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: serializeSdkTaskQuery(next),
      replaceUrl: true,
    });
  }

  updateStatusFilter(value: SelectValue): void {
    this.updateQuery('status', normalizeStatus(typeof value === 'string' ? value : null));
  }

  updateProviderFilter(value: SelectValue): void {
    this.updateQuery('provider', normalizeProvider(typeof value === 'string' ? value : null));
  }

  async loadRuns(page = this.query().page ?? 1, size = this.query().size ?? 20): Promise<void> {
    this.loadingRuns.set(true);
    this.error.set(null);
    const nextQuery = { ...this.query(), page, size };
    this.query.set(nextQuery);
    try {
      const response = await firstValueFrom(this.api.listRuns(nextQuery));
      this.runs.set(response.items ?? []);
      this.total.set(response.total ?? 0);
    } catch (error) {
      this.error.set(errorMessage(error, 'systemManagement.sdkTask.error.loadRuns'));
    } finally {
      this.loadingRuns.set(false);
    }
  }

  async runPrompt(): Promise<void> {
    const built = buildSdkTaskRunRequest(this.form());
    this.formError.set(built.errorKey ?? null);
    if (!built.payload) {
      return;
    }

    this.submitting.set(true);
    try {
      const run = await firstValueFrom(this.api.startRun(built.payload));
      await this.loadRuns(1, this.query().size ?? 20);
      await this.selectRun(run);
    } catch (error) {
      this.formError.set(errorMessage(error, 'systemManagement.sdkTask.error.submit'));
    } finally {
      this.submitting.set(false);
    }
  }

  resetForm(): void {
    this.form.set({ ...EMPTY_FORM });
    this.formError.set(null);
  }

  async selectRun(run: SdkTaskRunSummary): Promise<void> {
    this.selectedTab.set('summary');
    this.stopPolling();
    await this.loadRunDetail(run.taskId);
  }

  async loadRunDetail(taskId: string): Promise<void> {
    this.loadingDetail.set(true);
    this.detailError.set(null);
    try {
      const detail = await firstValueFrom(this.api.getRun(taskId));
      this.selectedRunDetail.set(detail);
      this.resetPolling(detail);
    } catch (error) {
      this.detailError.set(errorMessage(error, 'systemManagement.sdkTask.error.loadDetail'));
      this.stopPolling();
    } finally {
      this.loadingDetail.set(false);
    }
  }

  onPageChange(event: { page: number; rows: number }): void {
    void this.loadRuns(event.page + 1, event.rows);
  }

  currentFirst(): number {
    return ((this.query().page ?? 1) - 1) * (this.query().size ?? 20);
  }

  detailSummary(detail: SdkTaskRunDetail): Record<string, unknown> {
    return {
      taskId: detail.taskId,
      status: detail.status,
      agentCode: detail.agentCode,
      provider: detail.provider,
      threadId: detail.threadId,
      workingDirectory: detail.workingDirectory,
      model: detail.model,
      reasoningEffort: detail.reasoningEffort,
      createdAt: detail.createdAt,
      updatedAt: detail.updatedAt,
      completedAt: detail.completedAt,
      error: detail.error,
      polling: this.polling(),
    };
  }

  detailOutput(detail: SdkTaskRunDetail): unknown {
    return detail.result?.execution ?? detail.result ?? null;
  }

  statusVariant(status: SdkTaskStatus): 'info' | 'success' | 'warning' | 'danger' | 'muted' {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'RUNNING':
        return 'info';
      case 'BLOCKED_CONFIG':
      case 'BLOCKED_MCP':
      case 'FAILED_DEPENDENCY':
      case 'TIMEOUT':
        return 'warning';
      case 'FAILED':
        return 'danger';
      default:
        return 'muted';
    }
  }

  private resetPolling(detail: SdkTaskRunDetail): void {
    this.stopPolling();
    if (TERMINAL_STATUSES.includes(detail.status)) {
      return;
    }

    this.polling.set(true);
    this.pollTimer = setInterval(() => {
      void this.loadRunDetail(detail.taskId);
    }, POLL_INTERVAL_MS);
  }

  private stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    this.polling.set(false);
  }
}

export function buildSdkTaskRunRequest(
  form: SdkTaskConsoleForm,
): { payload?: SdkTaskRunRequest; errorKey?: string } {
  const agentCode = form.agentCode.trim();
  const prompt = form.prompt.trim();
  if (!agentCode || !prompt) {
    return { errorKey: 'systemManagement.sdkTask.validation.required' };
  }

  const outputSchema = parseOptionalJsonObject(form.outputSchemaText);
  const requestContext = parseOptionalJsonObject(form.requestContextText);
  if (outputSchema === false || requestContext === false) {
    return { errorKey: 'systemManagement.sdkTask.validation.jsonObject' };
  }

  return {
    payload: stripEmpty({
      agentCode,
      provider: form.provider,
      prompt,
      threadId: form.threadId.trim(),
      workingDirectory: form.workingDirectory.trim(),
      model: form.model.trim(),
      reasoningEffort: form.reasoningEffort.trim(),
      outputSchema,
      requestContext,
      callbackUrl: form.callbackUrl.trim(),
      callbackAuthSecretCode: form.callbackAuthSecretCode.trim(),
    }),
  };
}

function parseOptionalJsonObject(text: string): JsonObject | undefined | false {
  const raw = text.trim();
  if (!raw) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as JsonObject
      : false;
  } catch {
    return false;
  }
}

function stripEmpty<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined && item !== ''),
  ) as T;
}

function normalizeQueryValue<T>(value: T | null | undefined): T | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed as T : undefined;
  }
  return value ?? undefined;
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function parseSdkTaskQuery(query: Pick<ParamMap, 'get'>): SdkTaskRunListQuery {
  return {
    ...(parseNumber(query.get('page')) ? { page: parseNumber(query.get('page')) } : {}),
    ...(parseNumber(query.get('size')) ? { size: parseNumber(query.get('size')) } : {}),
    ...(normalizeStatus(query.get('status')) ? { status: normalizeStatus(query.get('status')) } : {}),
    ...(cleanString(query.get('agentCode')) ? { agentCode: cleanString(query.get('agentCode')) } : {}),
    ...(normalizeProvider(query.get('provider')) ? { provider: normalizeProvider(query.get('provider')) } : {}),
    ...(cleanString(query.get('threadId')) ? { threadId: cleanString(query.get('threadId')) } : {}),
    ...(cleanString(query.get('createdFrom')) ? { createdFrom: cleanString(query.get('createdFrom')) } : {}),
    ...(cleanString(query.get('createdTo')) ? { createdTo: cleanString(query.get('createdTo')) } : {}),
  };
}

export function serializeSdkTaskQuery(query: SdkTaskRunListQuery): Record<string, string | number> {
  return {
    ...(query.page !== undefined ? { page: query.page } : {}),
    ...(query.size !== undefined ? { size: query.size } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.agentCode ? { agentCode: query.agentCode } : {}),
    ...(query.provider ? { provider: query.provider } : {}),
    ...(query.threadId ? { threadId: query.threadId } : {}),
    ...(query.createdFrom ? { createdFrom: query.createdFrom } : {}),
    ...(query.createdTo ? { createdTo: query.createdTo } : {}),
  };
}

function parseNumber(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function normalizeProvider(value: string | null): SdkTaskProvider | undefined {
  return value === 'codex' || value === 'claude' ? value : undefined;
}

function normalizeStatus(value: string | null): SdkTaskStatus | undefined {
  const statuses: SdkTaskStatus[] = [
    'BLOCKED_CONFIG',
    'BLOCKED_MCP',
    'COMPLETED',
    'FAILED',
    'FAILED_DEPENDENCY',
    'RUNNING',
    'TIMEOUT',
  ];
  return statuses.includes(value as SdkTaskStatus) ? value as SdkTaskStatus : undefined;
}

function cleanString(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
