import { Location } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { ConfigVersionHistoryResponse } from '../../../../../core/models/trade-bot/trading-system.model';
import { TradingSystemService } from '../../../../../core/services/trade-bot-service/trading-system.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { SelectOption } from '../../../../../shared/component/select/select';
import { KeyValueItem } from '../../../../../shared/ui/data-display/key-value-list/key-value-list.component';
import { TableConfig } from '../../../../../shared/ui/table/models/table-config.model';

interface ConfigHistoryRow extends Record<string, unknown> {
  versionLabel: string;
  versionValue: string;
  updatedAt?: string;
  updatedBy?: string;
  changeReason?: string;
  status?: string;
  changedFields: string[];
  raw: Record<string, unknown>;
}

interface ConfigDiffRow extends Record<string, unknown> {
  path: string;
  changeType: 'ADDED' | 'REMOVED' | 'CHANGED';
  oldValue: unknown;
  newValue: unknown;
}

@Component({
  selector: 'app-config-version-history',
  standalone: false,
  templateUrl: './config-version-history.component.html'
})
export class ConfigVersionHistoryComponent implements OnInit {
  readonly loading = signal(false);
  readonly history = signal<ConfigVersionHistoryResponse | null>(null);
  readonly configType = signal<'indicator' | 'rule' | 'strategy'>('indicator');
  readonly configId = signal('');
  readonly selectedBaseVersion = signal('');
  readonly selectedTargetVersion = signal('');
  readonly selectedRawVersion = signal<ConfigHistoryRow | null>(null);
  readonly rawDialogVisible = signal(false);

  readonly rows = computed<ConfigHistoryRow[]>(() => this.toRows(this.history()?.versions ?? []));
  readonly latestVersion = computed<ConfigHistoryRow | undefined>(() => this.rows()[0]);
  readonly versionOptions = computed<SelectOption[]>(() =>
    this.rows().map((row) => ({ label: row.versionLabel, value: row.versionValue }))
  );
  readonly baseVersion = computed(() => this.findRow(this.selectedBaseVersion()));
  readonly targetVersion = computed(() => this.findRow(this.selectedTargetVersion()));
  readonly diffRows = computed<ConfigDiffRow[]>(() => this.diffVersions(this.baseVersion()?.raw, this.targetVersion()?.raw));
  readonly selectedRawJson = computed(() => this.selectedRawVersion()?.raw ?? {});
  readonly error = signal<string | null>(null);
  readonly overviewItems = computed<KeyValueItem[]>(() => [
    { label: 'tradeBot.field.type', value: this.configType().toUpperCase(), type: 'badge', variant: 'info' },
    { label: 'tradeBot.field.configId', value: this.configId(), type: 'copyable' },
    { label: 'tradeBot.configHistory.versionCount', value: this.rows().length, type: 'number' },
    { label: 'tradeBot.configHistory.latestVersion', value: this.latestVersion()?.versionLabel ?? '-', type: 'copyable' },
    {
      label: 'tradeBot.configHistory.latestStatus',
      value: this.latestVersion()?.status ?? 'notAvailable',
      type: 'badge',
      variant: this.statusVariant(this.latestVersion()?.status)
    },
    { label: 'tradeBot.configHistory.latestUpdatedAt', value: this.latestVersion()?.updatedAt ?? '-', type: 'datetime' }
  ]);
  readonly selectedRawItems = computed<KeyValueItem[]>(() => {
    const version = this.selectedRawVersion();
    return [
      { label: 'tradeBot.field.version', value: version?.versionLabel ?? '-', type: 'copyable' },
      { label: 'tradeBot.field.updatedAt', value: version?.updatedAt ?? '-', type: 'datetime' },
      {
        label: 'tradeBot.field.status',
        value: version?.status ?? 'notAvailable',
        type: 'badge',
        variant: this.statusVariant(version?.status)
      }
    ];
  });

  readonly timelineTableConfig: TableConfig = {
    title: 'tradeBot.configHistory.timeline',
    columns: [
      { field: 'versionLabel', header: 'tradeBot.field.version', type: 'copyable', minWidth: '10rem' },
      { field: 'updatedAt', header: 'tradeBot.field.updatedAt', type: 'date', minWidth: '13rem' },
      { field: 'updatedBy', header: 'tradeBot.field.updatedBy', minWidth: '12rem' },
      { field: 'changeReason', header: 'tradeBot.field.changeReason', minWidth: '16rem' },
      { field: 'status', header: 'tradeBot.field.status', type: 'badge' },
      { field: 'changedFields', header: 'tradeBot.configHistory.changedFields', type: 'array', minWidth: '18rem' },
      {
        field: 'actions',
        header: 'tradeBot.field.actions',
        type: 'actions',
        actions: [
          { label: 'tradeBot.action.viewJson', icon: 'pi pi-code', severity: 'secondary', showLabel: false, onClick: (row) => this.openRaw(row) },
          { label: 'tradeBot.configHistory.compareFrom', icon: 'pi pi-arrow-left', severity: 'info', showLabel: false, onClick: (row) => this.selectedBaseVersion.set(row.versionValue) },
          { label: 'tradeBot.configHistory.compareTo', icon: 'pi pi-arrow-right', severity: 'success', showLabel: false, onClick: (row) => this.selectedTargetVersion.set(row.versionValue) }
        ]
      }
    ],
    pagination: true,
    rows: 10,
    scrollable: true,
    minWidth: '92rem'
  };

  readonly diffTableConfig: TableConfig = {
    title: 'tradeBot.configHistory.diff',
    columns: [
      { field: 'path', header: 'tradeBot.field.field', type: 'copyable', minWidth: '18rem' },
      { field: 'changeType', header: 'tradeBot.field.status', type: 'badge', minWidth: '8rem' },
      { field: 'oldValue', header: 'tradeBot.configHistory.oldValue', type: 'json', minWidth: '20rem' },
      { field: 'newValue', header: 'tradeBot.configHistory.newValue', type: 'json', minWidth: '20rem' }
    ],
    pagination: true,
    rows: 15,
    scrollable: true,
    minWidth: '78rem'
  };

  constructor(
    private readonly service: TradingSystemService,
    private readonly route: ActivatedRoute,
    private readonly location: Location,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly i18nService: I18nService
  ) {}

  ngOnInit(): void {
    const type = this.route.snapshot.paramMap.get('type') as 'indicator' | 'rule' | 'strategy';
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.configType.set(type);
    this.configId.set(id);
    this.loadHistory();
  }

  loadHistory(): void {
    const type = this.configType();
    const id = this.configId();
    this.loading.set(true);
    this.error.set(null);
    this.loadingService
      .track(this.service.getConfigVersions(type, id))
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (history) => {
          this.error.set(null);
          this.history.set(history);
          this.setInitialCompareVersions();
        },
        error: () => {
          const message = this.i18nService.t('tradeBot.message.loadFailed');
          this.error.set(message);
          this.toastService.error(message);
        }
      });
  }

  goBack(): void {
    this.location.back();
  }

  openRaw(row: ConfigHistoryRow): void {
    this.selectedRawVersion.set(row);
    this.rawDialogVisible.set(true);
  }

  closeRaw(): void {
    this.rawDialogVisible.set(false);
    this.selectedRawVersion.set(null);
  }

  selectBaseVersion(value: unknown): void {
    this.selectedBaseVersion.set(String(value ?? ''));
  }

  selectTargetVersion(value: unknown): void {
    this.selectedTargetVersion.set(String(value ?? ''));
  }

  historyJson(): string {
    return JSON.stringify(this.history(), null, 2);
  }

  statusVariant(status?: string): 'default' | 'info' | 'success' | 'warning' | 'danger' | 'muted' {
    switch ((status ?? '').toUpperCase()) {
      case 'ACTIVE':
      case 'CURRENT':
      case 'PUBLISHED':
      case 'APPROVED':
        return 'success';
      case 'DRAFT':
      case 'PENDING':
        return 'warning';
      case 'DELETED':
      case 'FAILED':
      case 'REJECTED':
        return 'danger';
      case '':
        return 'muted';
      default:
        return 'info';
    }
  }

  private setInitialCompareVersions(): void {
    const rows = this.rows();
    this.selectedTargetVersion.set(rows[0]?.versionValue ?? '');
    this.selectedBaseVersion.set(rows[1]?.versionValue ?? rows[0]?.versionValue ?? '');
  }

  private toRows(versions: Array<Record<string, unknown>>): ConfigHistoryRow[] {
    return versions.map((version, index, allVersions) => {
      const previous = allVersions[index + 1];
      return {
        ...version,
        versionLabel: this.resolveVersionLabel(version, index),
        versionValue: this.resolveVersionValue(version, index),
        updatedAt: stringValue(version['updatedAt'] ?? version['createdAt'] ?? version['snapshotCreatedAt']),
        updatedBy: stringValue(version['updatedBy'] ?? version['createdBy'] ?? version['author']),
        changeReason: stringValue(version['changeReason'] ?? version['reason'] ?? version['message']),
        status: stringValue(version['status'] ?? version['state']),
        changedFields: this.resolveChangedFields(version, previous),
        raw: version
      };
    });
  }

  private findRow(versionValue: string): ConfigHistoryRow | undefined {
    return this.rows().find((row) => row.versionValue === versionValue);
  }

  private resolveVersionLabel(version: Record<string, unknown>, index: number): string {
    const value = version['version'] ?? version['configVersion'] ?? version['versionNo'] ?? version['revision'] ?? index + 1;
    return `v${String(value).replace(/^v/i, '')}`;
  }

  private resolveVersionValue(version: Record<string, unknown>, index: number): string {
    return String(version['id'] ?? version['versionId'] ?? version['version'] ?? version['configVersion'] ?? index);
  }

  private resolveChangedFields(version: Record<string, unknown>, previous?: Record<string, unknown>): string[] {
    const explicit = version['changedFields'];
    if (Array.isArray(explicit)) {
      return explicit.map(String);
    }
    const changes = version['changes'];
    if (changes && typeof changes === 'object' && !Array.isArray(changes)) {
      return Object.keys(changes);
    }
    if (!previous) {
      return [];
    }
    return this.diffVersions(previous, version).slice(0, 8).map((row) => row.path);
  }

  private diffVersions(base?: Record<string, unknown>, target?: Record<string, unknown>): ConfigDiffRow[] {
    if (!base || !target) {
      return [];
    }
    const baseFlat = flattenObject(base);
    const targetFlat = flattenObject(target);
    const paths = Array.from(new Set([...Object.keys(baseFlat), ...Object.keys(targetFlat)])).sort();
    return paths
      .map((path): ConfigDiffRow | null => {
        const hasBase = Object.prototype.hasOwnProperty.call(baseFlat, path);
        const hasTarget = Object.prototype.hasOwnProperty.call(targetFlat, path);
        const oldValue = baseFlat[path];
        const newValue = targetFlat[path];
        if (hasBase && hasTarget && JSON.stringify(oldValue) === JSON.stringify(newValue)) {
          return null;
        }
        return {
          path,
          changeType: !hasBase ? 'ADDED' : !hasTarget ? 'REMOVED' : 'CHANGED',
          oldValue: hasBase ? oldValue : null,
          newValue: hasTarget ? newValue : null
        };
      })
      .filter((row): row is ConfigDiffRow => !!row);
  }
}

function flattenObject(value: unknown, prefix = '', output: Record<string, unknown> = {}): Record<string, unknown> {
  if (Array.isArray(value)) {
    output[prefix || 'root'] = value;
    return output;
  }
  if (!value || typeof value !== 'object') {
    output[prefix || 'root'] = value;
    return output;
  }
  Object.entries(value as Record<string, unknown>).forEach(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === 'object' && !Array.isArray(child)) {
      flattenObject(child, path, output);
    } else {
      output[path] = child;
    }
  });
  return output;
}

function stringValue(value: unknown): string | undefined {
  const text = String(value ?? '').trim();
  return text || undefined;
}
