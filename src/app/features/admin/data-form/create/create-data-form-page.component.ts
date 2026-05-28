import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, OnDestroy, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AppFileSelectEvent } from '../../../../shared/component/fileupload/fileupload';
import { finalize, firstValueFrom } from 'rxjs';
import { PermissionService } from '../../../../core/auth/permission.service';
import { I18nService } from '../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../core/ui-services/toast.service';
import { BadgeVariant } from '../../../../shared/ui/data-display/badge/badge.component';
import { KeyValueItem } from '../../../../shared/ui/data-display/key-value-list/key-value-list.component';
import { ConfirmDialogService } from '../../../../shared/ui/overlay/confirm-dialog/confirm-dialog.service';
import { TableConfig } from '../../../../shared/ui/table/models/table-config.model';
import { DataFormService } from '../data-access/api/data-form.service';
import {
  DataFormBackendValidationIssue,
  DataFormCreateErrorResponse,
  DataFormCreateRequest,
  DataFormPermissions,
  DataFormStatus
} from '../data-access/models/data-form.model';

type JsonRecord = Record<string, unknown>;
type ValidationLevel = 'critical' | 'warning' | 'suggestion';

interface JsonParseError {
  message: string;
  detail: string;
  line?: number;
  column?: number;
  position?: number;
}

interface JsonParseState {
  valid: boolean;
  empty: boolean;
  value?: unknown;
  error?: JsonParseError;
}

interface ValidationIssue {
  level: ValidationLevel;
  path?: string;
  message: string;
}

interface ValidationGroups {
  critical: ValidationIssue[];
  warnings: ValidationIssue[];
  suggestions: ValidationIssue[];
}

interface SectionIssueSummary {
  critical: number;
  warnings: number;
}

interface FormCodeAvailability {
  code: string;
  exists: boolean;
}

interface ParsedFieldRow {
  index: number;
  name: string;
  label: string;
  type: string;
  required: boolean;
  hidden: boolean;
  section: string;
  path: string;
  raw: JsonRecord;
}

interface ParsedConfigSummary {
  formCode: string;
  formName: string;
  sectionsCount: number;
  fieldsCount: number;
  requiredFieldsCount: number;
  hiddenFieldsCount: number;
  fieldTypes: Array<{ type: string; count: number }>;
  fieldRows: ParsedFieldRow[];
  sectionKeys: string[];
}

interface RawSectionEntry {
  section: JsonRecord;
  path: string;
  key: string;
}

interface RawFieldEntry {
  field: JsonRecord;
  path: string;
  sectionKey: string;
}

interface SectionNavItem {
  id: string;
  label: string;
  icon: string;
}

const DEFAULT_JSON_CONFIG = `{
  "formCode": "CUSTOMER_REGISTER",
  "formName": "Customer Register",
  "sections": [
    {
      "key": "basicInfo",
      "title": "Basic Info"
    }
  ],
  "fields": [
    {
      "name": "fullName",
      "label": "Full Name",
      "type": "text",
      "required": true,
      "section": "basicInfo",
      "maxLength": 120
    }
  ]
}`;

const EMPTY_VALIDATION_GROUPS: ValidationGroups = {
  critical: [],
  warnings: [],
  suggestions: []
};

const SUPPORTED_FIELD_TYPES = [
  'text',
  'textarea',
  'number',
  'currency',
  'date',
  'datetime',
  'select',
  'multiSelect',
  'checkbox',
  'radio',
  'switch',
  'tree',
  'file',
  'email',
  'phone',
  'password'
];

const RESERVED_FIELD_NAMES = new Set([
  'id',
  '_id',
  'createdAt',
  'updatedAt',
  'createdBy',
  'updatedBy',
  'deleted',
  'status',
  'version'
]);

const CONDITIONAL_OPERATORS = new Set([
  'equals',
  'notEquals',
  'in',
  'notIn',
  'contains',
  'notContains',
  'greaterThan',
  'greaterThanOrEqual',
  'lessThan',
  'lessThanOrEqual',
  'exists',
  'empty',
  'notEmpty'
]);

const CONDITION_KEYS = [
  'visibleWhen',
  'enabledWhen',
  'requiredWhen',
  'hiddenWhen',
  'disabledWhen',
  'readonlyWhen'
];

const FIELD_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
const FORM_CODE_PATTERN = /^[A-Z0-9_]+$/;
const JSON_IMPORT_MAX_BYTES = 1024 * 1024;

@Component({
  selector: 'app-create-data-form-page',
  standalone: false,
  templateUrl: './create-data-form-page.component.html',
  styleUrl: './create-data-form-page.component.css'
})
export class CreateDataFormPageComponent implements AfterViewInit, OnDestroy {
  readonly formName = signal('');
  readonly formCode = signal('');
  readonly description = signal('');
  readonly status = signal<DataFormStatus>('ACTIVE');
  readonly jsonText = signal(DEFAULT_JSON_CONFIG);
  readonly validated = signal(false);
  readonly validating = signal(false);
  readonly creating = signal(false);
  readonly unsavedChanges = signal(false);
  readonly backendValidation = signal<ValidationGroups>(EMPTY_VALIDATION_GROUPS);
  readonly activeSectionId = signal('general-info');
  readonly checkingFormCode = signal(false);
  readonly formCodeAvailability = signal<FormCodeAvailability | null>(null);

  readonly permissionCreateAdmin = signal(true);
  readonly permissionCreateManager = signal(false);
  readonly permissionUpdateAdmin = signal(true);
  readonly permissionImportExportAdmin = signal(true);

  private sectionObserver?: IntersectionObserver;

  readonly sectionItems: SectionNavItem[] = [
    { id: 'general-info', label: 'dataForm.section.generalInformation', icon: 'pi pi-info-circle' },
    { id: 'json-config', label: 'dataForm.section.jsonConfiguration', icon: 'pi pi-code' },
    { id: 'parsed-summary', label: 'dataForm.section.parsedSummary', icon: 'pi pi-list-check' },
    { id: 'validation-result', label: 'dataForm.section.validationResult', icon: 'pi pi-exclamation-circle' },
    { id: 'permission', label: 'dataForm.section.permission', icon: 'pi pi-lock' },
    { id: 'audit-info', label: 'dataForm.section.auditInfo', icon: 'pi pi-history' }
  ];

  readonly statusOptions = [
    { label: 'dataForm.status.active', value: 'ACTIVE' },
    { label: 'dataForm.status.inactive', value: 'INACTIVE' }
  ];

  readonly fieldTableConfig: TableConfig = {
    title: 'dataForm.table.fieldSummary',
    pagination: false,
    scrollable: true,
    scrollHeight: '24rem',
    minWidth: '48rem',
    emptyTitle: 'dataForm.empty.noParsedFields',
    emptyDescription: 'dataForm.empty.noParsedFieldsDescription',
    columns: [
      { field: 'index', header: 'dataForm.table.index', type: 'number', width: '4rem' },
      { field: 'name', header: 'dataForm.table.fieldName', type: 'copyable', minWidth: '10rem' },
      { field: 'label', header: 'dataForm.table.label', type: 'text', minWidth: '12rem' },
      { field: 'type', header: 'dataForm.table.type', type: 'badge', width: '9rem' },
      { field: 'required', header: 'dataForm.table.required', type: 'boolean', width: '7rem' },
      { field: 'section', header: 'dataForm.table.section', type: 'text', minWidth: '10rem' }
    ]
  };

  readonly parsedJson = computed(() => this.parseJson(this.jsonText()));
  readonly parsedSummary = computed(() => this.buildParsedSummary(this.parsedJson().value));
  readonly generalValidationIssues = computed(() => this.validateGeneralInformation());
  readonly permissionValidation = computed(() => this.validatePermissionConfig());
  readonly localSchemaValidation = computed(() => this.validateSchema(this.parsedJson().value));
  readonly schemaValidation = computed(() => {
    const local = this.localSchemaValidation();
    const backend = this.backendValidation();
    return {
      critical: [...local.critical, ...backend.critical],
      warnings: [...local.warnings, ...backend.warnings],
      suggestions: [...local.suggestions, ...backend.suggestions]
    };
  });
  readonly jsonValidationIssue = computed(() => this.buildJsonValidationIssue());
  readonly allCriticalIssues = computed(() => [
    ...this.generalValidationIssues(),
    ...(this.jsonValidationIssue() ? [this.jsonValidationIssue()!] : []),
    ...this.schemaValidation().critical
  ]);
  readonly allValidationGroups = computed(() => {
    const schema = this.schemaValidation();
    const permission = this.permissionValidation();
    return {
      critical: this.allCriticalIssues(),
      warnings: [...schema.warnings, ...permission.warnings],
      suggestions: [...schema.suggestions, ...permission.suggestions]
    };
  });
  readonly activeValidationGroups = computed(() => (this.validated() ? this.allValidationGroups() : EMPTY_VALIDATION_GROUPS));
  readonly totalCriticalCount = computed(() => this.allValidationGroups().critical.length);
  readonly totalWarningCount = computed(() => this.allValidationGroups().warnings.length);
  readonly totalSuggestionCount = computed(() => this.allValidationGroups().suggestions.length);
  readonly totalValidationSummary = computed(() => ({
    critical: this.totalCriticalCount(),
    warnings: this.totalWarningCount(),
    suggestions: this.totalSuggestionCount()
  }));
  readonly canCreate = computed(() => this.permissionService.has('FORM_CONFIG_CREATE'));
  readonly canImport = computed(() => this.permissionService.has('FORM_CONFIG_IMPORT'));
  readonly canExport = computed(() => this.permissionService.has('FORM_CONFIG_EXPORT'));
  readonly canUpdateConfig = computed(() => this.permissionService.has('FORM_CONFIG_UPDATE'));
  readonly canSubmit = computed(() => !this.creating() && !this.checkingFormCode() && this.canCreate() && this.totalCriticalCount() === 0);
  readonly formSummaryItems = computed(() => this.buildFormSummaryItems());
  readonly parsedSummaryItems = computed(() => this.buildParsedSummaryItems());
  readonly auditItems = computed(() => this.buildAuditItems());
  readonly topErrors = computed(() => this.allCriticalIssues().slice(0, 3));

  constructor(
    private readonly dataFormService: DataFormService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly confirmDialogService: ConfirmDialogService,
    private readonly router: Router,
    private readonly i18nService: I18nService,
    private readonly permissionService: PermissionService
  ) {}

  ngAfterViewInit(): void {
    queueMicrotask(() => this.initializeSectionObserver());
  }

  ngOnDestroy(): void {
    this.sectionObserver?.disconnect();
  }

  onFormNameChange(value: string | null): void {
    this.formName.set(value ?? '');
    this.markDirty();
  }

  onFormCodeChange(value: string | null): void {
    this.formCode.set((value ?? '').toUpperCase());
    this.formCodeAvailability.set(null);
    this.markDirty();
  }

  onFormCodeBlur(): void {
    void this.checkFormCodeAvailability();
  }

  onDescriptionChange(value: string | null): void {
    this.description.set(value ?? '');
    this.markDirty();
  }

  onStatusChange(value: string | number | boolean | null): void {
    if (this.isDataFormStatus(value)) {
      this.status.set(value);
      this.markDirty();
    }
  }

  onJsonChange(value: string | null): void {
    this.jsonText.set(value ?? '');
    this.markDirty();
  }

  onPermissionCreateAdminChange(value: boolean | null): void {
    this.permissionCreateAdmin.set(value === true);
    this.markDirty();
  }

  onPermissionCreateManagerChange(value: boolean | null): void {
    this.permissionCreateManager.set(value === true);
    this.markDirty();
  }

  onPermissionUpdateAdminChange(value: boolean | null): void {
    this.permissionUpdateAdmin.set(value === true);
    this.markDirty();
  }

  onPermissionImportExportAdminChange(value: boolean | null): void {
    this.permissionImportExportAdmin.set(value === true);
    this.markDirty();
  }

  async onCancel(): Promise<void> {
    if (!(await this.confirmDiscardChanges())) {
      return;
    }

    void this.router.navigate(['/admin/data-forms']);
  }

  hasUnsavedChanges(): boolean {
    return this.unsavedChanges();
  }

  async confirmDiscardChanges(): Promise<boolean> {
    if (!this.unsavedChanges()) {
      return true;
    }

    return await this.confirmDialogService.confirm({
      title: 'dataForm.confirm.leaveTitle',
      message: 'dataForm.confirm.leaveMessage',
      cancelText: 'dataForm.action.stay',
      confirmText: 'dataForm.action.leave',
      variant: 'warning'
    });
  }

  async onValidate(): Promise<void> {
    if (this.validating()) {
      return;
    }

    this.validating.set(true);
    try {
      await this.checkFormCodeAvailability();
      this.validated.set(true);
      if (this.totalCriticalCount() > 0) {
        this.toastService.error('dataForm.toast.validationFailed');
        this.scrollToSection('validation-result');
        return;
      }
      this.toastService.success('dataForm.toast.validationPassed');
    } finally {
      this.validating.set(false);
    }
  }

  async onCreate(): Promise<void> {
    if (this.creating()) {
      return;
    }

    if (!this.canCreate()) {
      this.toastService.error('dataForm.toast.permissionDenied');
      return;
    }

    this.validated.set(true);
    await this.checkFormCodeAvailability();
    if (this.totalCriticalCount() > 0) {
      this.toastService.error('dataForm.toast.createBlocked');
      this.scrollToSection('validation-result');
      return;
    }

    if (this.totalWarningCount() > 0) {
      const confirmed = await this.confirmDialogService.confirm({
        title: 'dataForm.confirm.warningTitle',
        message: this.message('dataForm.confirm.warningMessage', { count: this.totalWarningCount() }),
        cancelText: 'cancel',
        confirmText: 'dataForm.action.createAnyway',
        variant: 'warning'
      });

      if (!confirmed) {
        return;
      }
    }

    const jsonConfig = this.parsedJson().value;
    if (jsonConfig === undefined) {
      this.toastService.error('dataForm.toast.createBlocked');
      return;
    }

    const payload: DataFormCreateRequest = {
      formName: this.formName().trim(),
      formCode: this.formCode().trim(),
      description: this.description().trim() || undefined,
      status: this.status(),
      jsonConfig,
      permissions: this.buildPermissions()
    };

    this.creating.set(true);
    this.loadingService
      .track(this.dataFormService.create(payload))
      .pipe(finalize(() => this.creating.set(false)))
      .subscribe({
        next: () => {
          this.unsavedChanges.set(false);
          this.toastService.success('dataForm.toast.createSuccess');
          void this.router.navigate(['/admin/data-forms']);
        },
        error: (error: HttpErrorResponse) => this.handleCreateError(error)
      });
  }

  onFormatJson(): void {
    if (!this.canUpdateConfig()) {
      this.toastService.error('dataForm.toast.permissionDenied');
      return;
    }

    const parsed = this.parsedJson();
    if (!parsed.valid) {
      this.validated.set(true);
      this.toastService.error('dataForm.toast.formatInvalidJson');
      this.scrollToSection('json-config');
      return;
    }

    this.jsonText.set(JSON.stringify(parsed.value, null, 2));
    this.markDirty();
    this.toastService.success('dataForm.toast.formatSuccess');
  }

  onValidateJson(): void {
    this.validated.set(true);
    if (this.jsonValidationIssue()) {
      this.toastService.error('dataForm.toast.invalidJson');
      this.scrollToSection('json-config');
      return;
    }

    this.toastService.success('dataForm.toast.validJson');
  }

  async onImportJson(event: AppFileSelectEvent): Promise<void> {
    if (!this.canImport() || !this.canUpdateConfig()) {
      this.toastService.error('dataForm.toast.permissionDenied');
      return;
    }

    const file = event.files?.[0];
    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith('.json')) {
      this.toastService.error('dataForm.toast.importTypeError');
      return;
    }

    if (file.size > JSON_IMPORT_MAX_BYTES) {
      this.toastService.error('dataForm.toast.importSizeError');
      return;
    }

    const text = await file.text();
    const parsed = this.parseJson(text);
    if (!parsed.valid) {
      this.validated.set(true);
      this.toastService.error('dataForm.toast.importInvalidJson');
      return;
    }

    if (this.unsavedChanges() && this.jsonText().trim()) {
      const confirmed = await this.confirmDialogService.confirm({
        title: 'dataForm.confirm.importOverwriteTitle',
        message: 'dataForm.confirm.importOverwriteMessage',
        cancelText: 'cancel',
        confirmText: 'dataForm.action.overwrite',
        variant: 'warning'
      });

      if (!confirmed) {
        return;
      }
    }

    this.jsonText.set(JSON.stringify(parsed.value, null, 2));
    this.validated.set(true);
    this.markDirty();
    this.toastService.success('dataForm.toast.importSuccess');
  }

  onExportJson(): void {
    if (!this.canExport()) {
      this.toastService.error('dataForm.toast.permissionDenied');
      return;
    }

    const text = this.jsonText();
    if (!text.trim()) {
      this.toastService.error('dataForm.toast.exportEmpty');
      return;
    }

    const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.exportFileName()}.form-config.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async onCopyJson(): Promise<void> {
    const text = this.jsonText();
    if (!text.trim()) {
      this.toastService.error('dataForm.toast.copyEmpty');
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      this.toastService.success('dataForm.toast.copySuccess');
    } catch {
      if (this.fallbackCopy(text)) {
        this.toastService.success('dataForm.toast.copySuccess');
        return;
      }
      this.toastService.error('dataForm.toast.copyFailed');
    }
  }

  scrollToSection(sectionId: string): void {
    this.activeSectionId.set(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  sectionErrorCount(sectionId: string): number {
    return this.sectionIssueSummary(sectionId).critical;
  }

  sectionWarningCount(sectionId: string): number {
    return this.sectionIssueSummary(sectionId).warnings;
  }

  sectionIssueSummary(sectionId: string): SectionIssueSummary {
    if (!this.validated()) {
      return { critical: 0, warnings: 0 };
    }

    switch (sectionId) {
      case 'general-info':
        return {
          critical: this.generalValidationIssues().length + this.countBackendIssuesForPaths(this.backendValidation().critical, ['formName', 'formCode']),
          warnings: this.countBackendIssuesForPaths(this.backendValidation().warnings, ['formName', 'formCode'])
        };
      case 'json-config':
        return {
          critical: (this.jsonValidationIssue() ? 1 : 0) + this.countBackendIssuesForPaths(this.backendValidation().critical, ['jsonConfig']),
          warnings: this.countBackendIssuesForPaths(this.backendValidation().warnings, ['jsonConfig'])
        };
      case 'validation-result':
        return {
          critical: this.allValidationGroups().critical.length,
          warnings: this.allValidationGroups().warnings.length
        };
      case 'permission':
        return {
          critical: 0,
          warnings: this.permissionValidation().warnings.length
        };
      default:
        return { critical: 0, warnings: 0 };
    }
  }

  jsonStatusLabel(): string {
    return this.parsedJson().valid ? 'dataForm.status.jsonValid' : 'dataForm.status.jsonInvalid';
  }

  jsonStatusVariant(): BadgeVariant {
    return this.parsedJson().valid ? 'success' : 'danger';
  }

  schemaStatusLabel(): string {
    if (this.parsedJson().valid && this.schemaValidation().critical.length === 0) {
      return 'dataForm.status.schemaValid';
    }
    return 'dataForm.status.schemaInvalid';
  }

  schemaStatusVariant(): BadgeVariant {
    return this.parsedJson().valid && this.schemaValidation().critical.length === 0 ? 'success' : 'danger';
  }

  statusLabel(status: DataFormStatus = this.status()): string {
    return status === 'ACTIVE' ? 'dataForm.status.active' : 'dataForm.status.inactive';
  }

  statusVariant(status: DataFormStatus = this.status()): BadgeVariant {
    return status === 'ACTIVE' ? 'success' : 'muted';
  }

  generalErrorFor(path: string): string | undefined {
    if (!this.validated()) {
      return undefined;
    }
    return (
      this.generalValidationIssues().find((item) => item.path === path)?.message ??
      this.backendValidation().critical.find((item) => item.path === path)?.message
    );
  }

  jsonErrorText(): string | undefined {
    if (!this.validated()) {
      return undefined;
    }
    return this.jsonValidationIssue()?.message;
  }

  private markDirty(): void {
    this.unsavedChanges.set(true);
    this.backendValidation.set(EMPTY_VALIDATION_GROUPS);
  }

  private initializeSectionObserver(): void {
    this.sectionObserver?.disconnect();

    const sections = this.sectionItems
      .map((item) => document.getElementById(item.id))
      .filter((section): section is HTMLElement => !!section);

    if (sections.length === 0 || typeof IntersectionObserver === 'undefined') {
      return;
    }

    this.sectionObserver = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((first, second) => first.boundingClientRect.top - second.boundingClientRect.top)[0];
        if (visibleEntry?.target.id) {
          this.activeSectionId.set(visibleEntry.target.id);
        }
      },
      { root: null, rootMargin: '-20% 0px -65% 0px', threshold: [0, 0.2, 0.6] }
    );

    sections.forEach((section) => this.sectionObserver?.observe(section));
  }

  private async checkFormCodeAvailability(): Promise<void> {
    const formCode = this.formCode().trim();
    if (!formCode || !FORM_CODE_PATTERN.test(formCode)) {
      this.formCodeAvailability.set(null);
      return;
    }

    if (this.formCodeAvailability()?.code === formCode) {
      return;
    }

    this.checkingFormCode.set(true);
    try {
      const exists = await firstValueFrom(this.dataFormService.checkCodeExists(formCode));
      if (this.formCode().trim() === formCode) {
        this.formCodeAvailability.set({ code: formCode, exists });
      }
    } catch {
      this.formCodeAvailability.set(null);
    } finally {
      this.checkingFormCode.set(false);
    }
  }

  private countBackendIssuesForPaths(issues: ValidationIssue[], paths: string[]): number {
    return issues.filter((issue) => {
      const issuePath = issue.path;
      return !!issuePath && paths.some((path) => issuePath === path || issuePath.startsWith(`${path}.`));
    }).length;
  }

  private validateGeneralInformation(): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const formName = this.formName().trim();
    const formCode = this.formCode().trim();

    if (!formName) {
      issues.push(this.issue('critical', 'dataForm.validation.formNameRequired', 'formName'));
    }

    if (!formCode) {
      issues.push(this.issue('critical', 'dataForm.validation.formCodeRequired', 'formCode'));
    } else if (!FORM_CODE_PATTERN.test(formCode)) {
      issues.push(this.issue('critical', 'dataForm.validation.formCodePattern', 'formCode'));
    } else if (this.formCodeAvailability()?.code === formCode && this.formCodeAvailability()?.exists) {
      issues.push(this.issue('critical', 'dataForm.validation.formCodeDuplicated', 'formCode', { formCode }));
    }

    return issues;
  }

  private validatePermissionConfig(): ValidationGroups {
    const warnings: ValidationIssue[] = [];
    const permissions = this.buildPermissions();

    if (permissions.create.length === 0) {
      warnings.push(this.issue('warning', 'dataForm.validation.permissionCreateEmpty', 'permission.create'));
    }

    if (permissions.update.length === 0) {
      warnings.push(this.issue('warning', 'dataForm.validation.permissionUpdateEmpty', 'permission.update'));
    }

    if (permissions.importExport.length === 0) {
      warnings.push(this.issue('warning', 'dataForm.validation.permissionImportExportEmpty', 'permission.importExport'));
    }

    return { critical: [], warnings, suggestions: [] };
  }

  private buildJsonValidationIssue(): ValidationIssue | null {
    const parsed = this.parsedJson();
    if (parsed.empty) {
      return this.issue('critical', 'dataForm.validation.jsonRequired', 'jsonConfig');
    }

    if (!parsed.valid) {
      return {
        level: 'critical',
        path: 'jsonConfig',
        message: parsed.error?.message ?? this.message('dataForm.validation.invalidJson')
      };
    }

    return null;
  }

  private validateSchema(value: unknown): ValidationGroups {
    if (value === undefined || value === null) {
      return EMPTY_VALIDATION_GROUPS;
    }

    const critical: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];
    const suggestions: ValidationIssue[] = [];

    if (!this.isRecord(value)) {
      return {
        critical: [this.issue('critical', 'dataForm.validation.rootObjectRequired', '$')],
        warnings,
        suggestions
      };
    }

    const root = value;
    const sections = this.collectSections(root, critical);
    const fields = this.collectFields(root, critical);
    const sectionKeySet = new Set(sections.map((item) => item.key).filter(Boolean));

    if (!this.hasText(root['formCode'])) {
      critical.push(this.issue('critical', 'dataForm.validation.schemaFormCodeRequired', 'formCode'));
    }

    if (!this.hasText(root['formName'])) {
      critical.push(this.issue('critical', 'dataForm.validation.schemaFormNameRequired', 'formName'));
    }

    const screenFormCode = this.formCode().trim();
    const jsonFormCode = this.stringValue(root['formCode']);
    if (screenFormCode && jsonFormCode && screenFormCode !== jsonFormCode) {
      critical.push(
        this.issue('critical', 'dataForm.validation.formCodeMismatch', 'formCode', {
          screenFormCode,
          jsonFormCode
        })
      );
    }

    const screenFormName = this.formName().trim();
    const jsonFormName = this.stringValue(root['formName']);
    if (screenFormName && jsonFormName && screenFormName !== jsonFormName) {
      critical.push(
        this.issue('critical', 'dataForm.validation.formNameMismatch', 'formName', {
          screenFormName,
          jsonFormName
        })
      );
    }

    if (!Array.isArray(root['sections']) && !Array.isArray(root['fields'])) {
      critical.push(this.issue('critical', 'dataForm.validation.sectionsOrFieldsRequired', '$'));
    }

    this.validateSections(sections, critical);
    this.validateFields(fields, sectionKeySet, critical, warnings, suggestions);

    if (!fields.some((entry) => entry.field['searchable'] === true)) {
      suggestions.push(this.issue('suggestion', 'dataForm.validation.searchableSuggestion', 'fields'));
    }

    return { critical, warnings, suggestions };
  }

  private validateSections(sections: RawSectionEntry[], critical: ValidationIssue[]): void {
    const seen = new Set<string>();

    sections.forEach((entry) => {
      const key = entry.key;
      if (!key) {
        critical.push(this.issue('critical', 'dataForm.validation.sectionKeyRequired', `${entry.path}.key`));
      } else if (seen.has(key)) {
        critical.push(this.issue('critical', 'dataForm.validation.sectionKeyDuplicated', `${entry.path}.key`, { key }));
      } else {
        seen.add(key);
      }

      if (!this.hasText(entry.section['title'])) {
        critical.push(this.issue('critical', 'dataForm.validation.sectionTitleRequired', `${entry.path}.title`));
      }
    });
  }

  private validateFields(
    fields: RawFieldEntry[],
    sectionKeySet: Set<string>,
    critical: ValidationIssue[],
    warnings: ValidationIssue[],
    suggestions: ValidationIssue[]
  ): void {
    const byName = new Map<string, RawFieldEntry[]>();
    const orderBySection = new Map<string, Set<string>>();
    const fieldNames = new Set<string>();
    const fieldTypeByName = new Map<string, string>();

    fields.forEach((entry) => {
      const name = this.stringValue(entry.field['name']);
      if (name) {
        fieldNames.add(name);
        fieldTypeByName.set(name, this.stringValue(entry.field['type']));
        const bucket = byName.get(name) ?? [];
        bucket.push(entry);
        byName.set(name, bucket);
      }
    });

    byName.forEach((entries, name) => {
      if (entries.length > 1) {
        critical.push(this.issue('critical', 'dataForm.validation.fieldDuplicated', entries[1].path, { field: name }));
      }

      const uniqueSections = new Set(entries.map((entry) => entry.sectionKey).filter(Boolean));
      if (uniqueSections.size > 1) {
        warnings.push(this.issue('warning', 'dataForm.validation.fieldMultipleSections', entries[0].path, { field: name }));
      }
    });

    fields.forEach((entry) => {
      const field = entry.field;
      const path = entry.path;
      const name = this.stringValue(field['name']);
      const type = this.stringValue(field['type']);
      const section = this.stringValue(field['section']) || entry.sectionKey;

      this.validateFieldIdentity(entry, critical);
      this.validateFieldType(entry, critical, warnings, suggestions);
      this.validateFieldState(entry, critical, warnings);
      this.validateFieldOptions(entry, critical);
      this.validateTreeField(entry, critical);
      this.validateConditionalLogic(entry, fieldNames, fieldTypeByName, critical, warnings);

      if (section && sectionKeySet.size > 0 && !sectionKeySet.has(section)) {
        critical.push(this.issue('critical', 'dataForm.validation.fieldMissingSection', `${path}.section`, { field: name || path, section }));
      }

      this.validateFieldWidth(entry, critical);
      const order = field['order'];
      if (order !== undefined && order !== null && order !== '') {
        const sectionKey = section || 'default';
        const orders = orderBySection.get(sectionKey) ?? new Set<string>();
        const normalizedOrder = String(order);
        if (orders.has(normalizedOrder)) {
          critical.push(this.issue('critical', 'dataForm.validation.fieldOrderDuplicated', `${path}.order`, { section: sectionKey }));
        }
        orders.add(normalizedOrder);
        orderBySection.set(sectionKey, orders);
      }

      if (type && ['text', 'textarea', 'email', 'phone', 'password'].includes(type) && !this.hasMaxLength(field)) {
        warnings.push(this.issue('warning', 'dataForm.validation.maxLengthWarning', `${path}.maxLength`, { field: name || path }));
      }
    });

    this.validateConditionCycles(fields, critical);
  }

  private validateFieldIdentity(entry: RawFieldEntry, critical: ValidationIssue[]): void {
    const field = entry.field;
    const path = entry.path;
    const name = this.stringValue(field['name']);

    if (!name) {
      critical.push(this.issue('critical', 'dataForm.validation.fieldNameRequired', `${path}.name`));
      return;
    }

    if (!FIELD_NAME_PATTERN.test(name)) {
      critical.push(this.issue('critical', 'dataForm.validation.fieldNameInvalid', `${path}.name`, { field: name }));
    }

    if (RESERVED_FIELD_NAMES.has(name)) {
      critical.push(this.issue('critical', 'dataForm.validation.fieldNameReserved', `${path}.name`, { field: name }));
    }

    if (!this.hasText(field['label'])) {
      critical.push(this.issue('critical', 'dataForm.validation.fieldLabelRequired', `${path}.label`, { field: name }));
    }
  }

  private validateFieldType(
    entry: RawFieldEntry,
    critical: ValidationIssue[],
    warnings: ValidationIssue[],
    suggestions: ValidationIssue[]
  ): void {
    const type = this.stringValue(entry.field['type']);
    const name = this.stringValue(entry.field['name']) || entry.path;

    if (!type) {
      critical.push(this.issue('critical', 'dataForm.validation.fieldTypeRequired', `${entry.path}.type`, { field: name }));
      return;
    }

    if (!SUPPORTED_FIELD_TYPES.includes(type)) {
      critical.push(
        this.issue('critical', 'dataForm.validation.fieldTypeUnsupported', `${entry.path}.type`, {
          field: name,
          type,
          values: SUPPORTED_FIELD_TYPES.join(', ')
        })
      );
    }

    if (type === 'number' && entry.field['unit'] === undefined && entry.field['suffix'] === undefined && entry.field['prefix'] === undefined) {
      suggestions.push(this.issue('suggestion', 'dataForm.validation.numberUnitSuggestion', `${entry.path}.unit`, { field: name }));
    }

    if (type === 'file' && entry.field['accept'] === undefined) {
      warnings.push(this.issue('warning', 'dataForm.validation.fileAcceptWarning', `${entry.path}.accept`, { field: name }));
    }
  }

  private validateFieldState(entry: RawFieldEntry, critical: ValidationIssue[], warnings: ValidationIssue[]): void {
    const field = entry.field;
    const name = this.stringValue(field['name']) || entry.path;
    const required = field['required'] === true;
    const hidden = field['hidden'] === true || field['visible'] === false;
    const readonly = field['readonly'] === true || field['readOnly'] === true;
    const hasDefaultValue = field['defaultValue'] !== undefined && field['defaultValue'] !== null && field['defaultValue'] !== '';

    if (required && hidden) {
      critical.push(this.issue('critical', 'dataForm.validation.requiredHidden', entry.path, { field: name }));
    }

    if (required && readonly && !hasDefaultValue) {
      critical.push(this.issue('critical', 'dataForm.validation.requiredReadonlyNoDefault', entry.path, { field: name }));
    }

    if (hidden && field['showInTable'] === true) {
      warnings.push(this.issue('warning', 'dataForm.validation.hiddenShowInTable', `${entry.path}.showInTable`, { field: name }));
    }

    if (readonly && field['validation'] !== undefined) {
      warnings.push(this.issue('warning', 'dataForm.validation.readonlyValidation', `${entry.path}.validation`, { field: name }));
    }
  }

  private validateFieldOptions(entry: RawFieldEntry, critical: ValidationIssue[]): void {
    const field = entry.field;
    const type = this.stringValue(field['type']);
    const name = this.stringValue(field['name']) || entry.path;
    const hasDataSource = field['dataSource'] !== undefined || field['dataSourceConfig'] !== undefined;
    const hasOptions = field['options'] !== undefined && field['options'] !== null;

    if ((type === 'select' || type === 'multiSelect') && !hasOptions && !hasDataSource) {
      critical.push(this.issue('critical', 'dataForm.validation.optionsOrDatasourceRequired', entry.path, { field: name }));
      return;
    }

    if (type === 'radio' && !hasOptions) {
      critical.push(this.issue('critical', 'dataForm.validation.optionsRequired', entry.path, { field: name }));
      return;
    }

    if (!['select', 'multiSelect', 'radio', 'checkbox'].includes(type) || !hasOptions) {
      return;
    }

    const options = field['options'];
    if (!Array.isArray(options)) {
      critical.push(this.issue('critical', 'dataForm.validation.optionsArrayRequired', `${entry.path}.options`, { field: name }));
      return;
    }

    const seenValues = new Set<string>();
    options.forEach((option, index) => {
      const optionPath = `${entry.path}.options[${index}]`;
      if (!this.isRecord(option)) {
        critical.push(this.issue('critical', 'dataForm.validation.optionObjectRequired', optionPath, { field: name }));
        return;
      }

      if (!this.hasText(option['label'])) {
        critical.push(this.issue('critical', 'dataForm.validation.optionLabelRequired', `${optionPath}.label`, { field: name }));
      }

      if (option['value'] === undefined || option['value'] === null || option['value'] === '') {
        critical.push(this.issue('critical', 'dataForm.validation.optionValueRequired', `${optionPath}.value`, { field: name }));
        return;
      }

      const optionValue = String(option['value']);
      if (seenValues.has(optionValue)) {
        critical.push(this.issue('critical', 'dataForm.validation.optionValueDuplicated', `${optionPath}.value`, { field: name, value: optionValue }));
      }
      seenValues.add(optionValue);
    });
  }

  private validateTreeField(entry: RawFieldEntry, critical: ValidationIssue[]): void {
    const field = entry.field;
    const type = this.stringValue(field['type']);
    if (type !== 'tree') {
      return;
    }

    const name = this.stringValue(field['name']) || entry.path;
    const treeConfig = field['treeConfig'];
    if (!this.isRecord(treeConfig)) {
      critical.push(this.issue('critical', 'dataForm.validation.treeConfigRequired', `${entry.path}.treeConfig`, { field: name }));
      return;
    }

    if (!this.hasText(treeConfig['valueKey'])) {
      critical.push(this.issue('critical', 'dataForm.validation.treeValueKeyRequired', `${entry.path}.treeConfig.valueKey`, { field: name }));
    }

    if (!this.hasText(treeConfig['labelKey'])) {
      critical.push(this.issue('critical', 'dataForm.validation.treeLabelKeyRequired', `${entry.path}.treeConfig.labelKey`, { field: name }));
    }

    const usesFlatTree = treeConfig['flat'] === true || treeConfig['dataMode'] === 'flat';
    if (usesFlatTree && !this.hasText(treeConfig['parentKey'])) {
      critical.push(this.issue('critical', 'dataForm.validation.treeParentKeyRequired', `${entry.path}.treeConfig.parentKey`, { field: name }));
    }

    const selectionMode = this.stringValue(treeConfig['selectionMode']);
    if (selectionMode && selectionMode !== 'single' && selectionMode !== 'multiple') {
      critical.push(
        this.issue('critical', 'dataForm.validation.treeSelectionModeInvalid', `${entry.path}.treeConfig.selectionMode`, {
          field: name,
          value: selectionMode
        })
      );
    }
  }

  private validateConditionalLogic(
    entry: RawFieldEntry,
    fieldNames: Set<string>,
    fieldTypeByName: Map<string, string>,
    critical: ValidationIssue[],
    warnings: ValidationIssue[]
  ): void {
    const name = this.stringValue(entry.field['name']);

    CONDITION_KEYS.forEach((conditionKey) => {
      const condition = entry.field[conditionKey];
      if (condition === undefined || condition === null) {
        return;
      }

      if (!this.isRecord(condition)) {
        critical.push(this.issue('critical', 'dataForm.validation.conditionObjectRequired', `${entry.path}.${conditionKey}`, { field: name || entry.path }));
        return;
      }

      const dependency = this.stringValue(condition['field']);
      const operator = this.stringValue(condition['operator']);
      const conditionPath = `${entry.path}.${conditionKey}`;

      if (!dependency) {
        critical.push(this.issue('critical', 'dataForm.validation.conditionFieldRequired', `${conditionPath}.field`, { field: name || entry.path }));
      } else {
        if (!fieldNames.has(dependency)) {
          critical.push(
            this.issue('critical', 'dataForm.validation.conditionMissingField', `${conditionPath}.field`, {
              field: name || entry.path,
              dependency
            })
          );
        }

        if (name && dependency === name) {
          critical.push(this.issue('critical', 'dataForm.validation.conditionSelfReference', `${entry.path}.${conditionKey}.field`, { field: name }));
          critical.push(this.issue('critical', 'dataForm.validation.conditionCircular', entry.path, { field: name }));
        }
      }

      if (!operator || !CONDITIONAL_OPERATORS.has(operator)) {
        critical.push(
          this.issue('critical', 'dataForm.validation.conditionOperatorInvalid', `${conditionPath}.operator`, {
            field: name || entry.path,
            values: Array.from(CONDITIONAL_OPERATORS).join(', ')
          })
        );
      }

      if (operator === 'equals' && condition['value'] === undefined) {
        warnings.push(this.issue('warning', 'dataForm.validation.conditionValueWarning', `${conditionPath}.value`, { field: name || entry.path }));
      }

      if (dependency && fieldNames.has(dependency) && operator && CONDITIONAL_OPERATORS.has(operator)) {
        this.validateConditionValueType(condition, operator, fieldTypeByName.get(dependency), `${conditionPath}.value`, name || entry.path, critical);
      }
    });
  }

  private validateConditionValueType(
    condition: JsonRecord,
    operator: string,
    dependencyType: string | undefined,
    path: string,
    field: string,
    critical: ValidationIssue[]
  ): void {
    if (!dependencyType || ['exists', 'empty', 'notEmpty'].includes(operator) || condition['value'] === undefined) {
      return;
    }

    const value = condition['value'];
    const values = ['in', 'notIn'].includes(operator) ? (Array.isArray(value) ? value : null) : [value];
    if (!values) {
      critical.push(this.issue('critical', 'dataForm.validation.conditionValueArrayRequired', path, { field }));
      return;
    }

    if (['number', 'currency'].includes(dependencyType) && values.some((item) => typeof item !== 'number')) {
      critical.push(this.issue('critical', 'dataForm.validation.conditionValueTypeMismatch', path, { field, expected: 'number' }));
      return;
    }

    if (['checkbox', 'switch'].includes(dependencyType) && values.some((item) => typeof item !== 'boolean')) {
      critical.push(this.issue('critical', 'dataForm.validation.conditionValueTypeMismatch', path, { field, expected: 'boolean' }));
      return;
    }

    if (['date', 'datetime', 'text', 'textarea', 'email', 'phone', 'password', 'select', 'radio'].includes(dependencyType)) {
      if (values.some((item) => typeof item !== 'string' && typeof item !== 'number' && typeof item !== 'boolean')) {
        critical.push(this.issue('critical', 'dataForm.validation.conditionValueTypeMismatch', path, { field, expected: 'primitive' }));
      }
    }
  }

  private validateConditionCycles(fields: RawFieldEntry[], critical: ValidationIssue[]): void {
    const graph = new Map<string, string[]>();
    const pathByName = new Map<string, string>();

    fields.forEach((entry) => {
      const name = this.stringValue(entry.field['name']);
      if (!name) {
        return;
      }

      graph.set(
        name,
        this.collectConditionDependencies(entry).filter((dependency) => dependency && dependency !== name)
      );
      pathByName.set(name, entry.path);
    });

    const visiting = new Set<string>();
    const visited = new Set<string>();
    const reported = new Set<string>();

    const visit = (fieldName: string, stack: string[]): void => {
      if (visiting.has(fieldName)) {
        const cycleStartIndex = stack.indexOf(fieldName);
        const cycleFields = cycleStartIndex >= 0 ? stack.slice(cycleStartIndex) : [fieldName];
        cycleFields.forEach((cycleField) => {
          if (reported.has(cycleField)) {
            return;
          }
          reported.add(cycleField);
          critical.push(
            this.issue('critical', 'dataForm.validation.conditionCircular', pathByName.get(cycleField) ?? cycleField, {
              field: cycleField
            })
          );
        });
        return;
      }

      if (visited.has(fieldName)) {
        return;
      }

      visiting.add(fieldName);
      (graph.get(fieldName) ?? []).forEach((dependency) => {
        if (graph.has(dependency)) {
          visit(dependency, [...stack, dependency]);
        }
      });
      visiting.delete(fieldName);
      visited.add(fieldName);
    };

    graph.forEach((_dependencies, fieldName) => visit(fieldName, [fieldName]));
  }

  private collectConditionDependencies(entry: RawFieldEntry): string[] {
    return CONDITION_KEYS.map((conditionKey) => {
      const condition = entry.field[conditionKey];
      return this.isRecord(condition) ? this.stringValue(condition['field']) : '';
    }).filter(Boolean);
  }

  private validateFieldWidth(entry: RawFieldEntry, critical: ValidationIssue[]): void {
    const width = entry.field['width'];
    if (width === undefined || width === null || width === '') {
      return;
    }

    if (typeof width === 'number') {
      if (!Number.isInteger(width) || width < 1 || width > 12) {
        critical.push(this.issue('critical', 'dataForm.validation.widthInvalid', `${entry.path}.width`, { value: String(width) }));
      }
      return;
    }

    const allowedWidths = new Set(['full', '1/2', '1/3', '2/3', '1/4', '3/4', '25%', '33%', '50%', '66%', '75%', '100%']);
    const normalized = String(width);
    if (!allowedWidths.has(normalized)) {
      critical.push(this.issue('critical', 'dataForm.validation.widthInvalid', `${entry.path}.width`, { value: normalized }));
    }
  }

  private collectSections(root: JsonRecord, critical: ValidationIssue[]): RawSectionEntry[] {
    const rawSections = root['sections'];
    if (rawSections === undefined || rawSections === null) {
      return [];
    }

    if (!Array.isArray(rawSections)) {
      critical.push(this.issue('critical', 'dataForm.validation.sectionsArrayRequired', 'sections'));
      return [];
    }

    return rawSections
      .map((section, index) => ({ section, path: `sections[${index}]` }))
      .filter((entry): entry is { section: JsonRecord; path: string } => {
        if (this.isRecord(entry.section)) {
          return true;
        }
        critical.push(this.issue('critical', 'dataForm.validation.sectionObjectRequired', entry.path));
        return false;
      })
      .map((entry) => ({
        section: entry.section,
        path: entry.path,
        key: this.stringValue(entry.section['key'])
      }));
  }

  private collectFields(root: JsonRecord, critical: ValidationIssue[]): RawFieldEntry[] {
    const fields: RawFieldEntry[] = [];
    const rawFields = root['fields'];

    if (rawFields !== undefined && rawFields !== null) {
      if (Array.isArray(rawFields)) {
        rawFields.forEach((field, index) => {
          if (this.isRecord(field)) {
            fields.push({ field, path: `fields[${index}]`, sectionKey: this.stringValue(field['section']) });
            return;
          }
          critical.push(this.issue('critical', 'dataForm.validation.fieldObjectRequired', `fields[${index}]`));
        });
      } else {
        critical.push(this.issue('critical', 'dataForm.validation.fieldsArrayRequired', 'fields'));
      }
    }

    const rawSections = root['sections'];
    if (Array.isArray(rawSections)) {
      rawSections.forEach((section, sectionIndex) => {
        if (!this.isRecord(section)) {
          return;
        }

        const sectionKey = this.stringValue(section['key']);
        const sectionFields = section['fields'];
        if (sectionFields === undefined || sectionFields === null) {
          return;
        }

        if (!Array.isArray(sectionFields)) {
          critical.push(this.issue('critical', 'dataForm.validation.fieldsArrayRequired', `sections[${sectionIndex}].fields`));
          return;
        }

        sectionFields.forEach((field, fieldIndex) => {
          if (this.isRecord(field)) {
            fields.push({
              field,
              path: `sections[${sectionIndex}].fields[${fieldIndex}]`,
              sectionKey
            });
            return;
          }
          critical.push(this.issue('critical', 'dataForm.validation.fieldObjectRequired', `sections[${sectionIndex}].fields[${fieldIndex}]`));
        });
      });
    }

    return fields;
  }

  private buildParsedSummary(value: unknown): ParsedConfigSummary {
    if (!this.isRecord(value)) {
      return this.emptyParsedSummary();
    }

    const sections = this.collectSections(value, []);
    const fields = this.collectFields(value, []);
    const fieldRows = fields.map((entry, index) => {
      const section = this.stringValue(entry.field['section']) || entry.sectionKey || '-';
      return {
        index: index + 1,
        name: this.stringValue(entry.field['name']) || '-',
        label: this.stringValue(entry.field['label']) || '-',
        type: this.stringValue(entry.field['type']) || '-',
        required: entry.field['required'] === true,
        hidden: entry.field['hidden'] === true || entry.field['visible'] === false,
        section,
        path: entry.path,
        raw: entry.field
      };
    });

    const typeCounts = new Map<string, number>();
    fieldRows.forEach((field) => {
      typeCounts.set(field.type, (typeCounts.get(field.type) ?? 0) + 1);
    });

    return {
      formCode: this.stringValue(value['formCode']),
      formName: this.stringValue(value['formName']),
      sectionsCount: sections.length,
      fieldsCount: fieldRows.length,
      requiredFieldsCount: fieldRows.filter((field) => field.required).length,
      hiddenFieldsCount: fieldRows.filter((field) => field.hidden).length,
      fieldTypes: Array.from(typeCounts.entries()).map(([type, count]) => ({ type, count })),
      fieldRows,
      sectionKeys: sections.map((section) => section.key).filter(Boolean)
    };
  }

  private emptyParsedSummary(): ParsedConfigSummary {
    return {
      formCode: '',
      formName: '',
      sectionsCount: 0,
      fieldsCount: 0,
      requiredFieldsCount: 0,
      hiddenFieldsCount: 0,
      fieldTypes: [],
      fieldRows: [],
      sectionKeys: []
    };
  }

  private buildFormSummaryItems(): KeyValueItem[] {
    const summary = this.parsedSummary();
    return [
      { label: 'dataForm.summary.name', value: this.formName() || summary.formName },
      { label: 'dataForm.summary.code', value: this.formCode() || summary.formCode, type: 'copyable' },
      { label: 'dataForm.summary.status', value: this.statusLabel(), type: 'badge', variant: this.statusVariant() },
      { label: 'dataForm.summary.sections', value: summary.sectionsCount },
      { label: 'dataForm.summary.fields', value: summary.fieldsCount },
      { label: 'dataForm.summary.requiredFields', value: summary.requiredFieldsCount },
      { label: 'dataForm.summary.hiddenFields', value: summary.hiddenFieldsCount }
    ];
  }

  private buildParsedSummaryItems(): KeyValueItem[] {
    const summary = this.parsedSummary();
    return [
      { label: 'dataForm.summary.formCode', value: summary.formCode, type: 'copyable' },
      { label: 'dataForm.summary.totalSections', value: summary.sectionsCount },
      { label: 'dataForm.summary.totalFields', value: summary.fieldsCount },
      { label: 'dataForm.summary.requiredFields', value: summary.requiredFieldsCount },
      { label: 'dataForm.summary.hiddenFields', value: summary.hiddenFieldsCount }
    ];
  }

  private buildAuditItems(): KeyValueItem[] {
    return [
      { label: 'dataForm.audit.createdBy', value: null },
      { label: 'dataForm.audit.createdAt', value: null },
      { label: 'dataForm.audit.updatedBy', value: null },
      { label: 'dataForm.audit.updatedAt', value: null }
    ];
  }

  private buildPermissions(): DataFormPermissions {
    const create: string[] = [];
    if (this.permissionCreateAdmin()) {
      create.push('ADMIN');
    }
    if (this.permissionCreateManager()) {
      create.push('MANAGER');
    }

    return {
      create,
      update: this.permissionUpdateAdmin() ? ['ADMIN'] : [],
      importExport: this.permissionImportExportAdmin() ? ['ADMIN'] : []
    };
  }

  private handleCreateError(error: HttpErrorResponse): void {
    const body = error.error as DataFormCreateErrorResponse | undefined;
    const backendIssues = this.mapBackendIssues(body);
    if (backendIssues.critical.length || backendIssues.warnings.length || backendIssues.suggestions.length) {
      this.validated.set(true);
      this.backendValidation.set(backendIssues);
      this.scrollToSection('validation-result');
    }

    this.toastService.error(body?.errorMessage || body?.message || 'dataForm.toast.createFailed');
  }

  private mapBackendIssues(body: DataFormCreateErrorResponse | undefined): ValidationGroups {
    if (!body) {
      return EMPTY_VALIDATION_GROUPS;
    }

    return {
      critical: this.mapBackendIssueList(body.errors ?? [], 'critical'),
      warnings: this.mapBackendIssueList(body.warnings ?? [], 'warning'),
      suggestions: this.mapBackendIssueList(body.suggestions ?? [], 'suggestion')
    };
  }

  private mapBackendIssueList(issues: DataFormBackendValidationIssue[], level: ValidationLevel): ValidationIssue[] {
    return issues.map((issue) => ({
      level,
      path: issue.path,
      message: issue.message ?? 'dataForm.validation.backendIssue'
    }));
  }

  private parseJson(text: string): JsonParseState {
    const trimmed = text.trim();
    if (!trimmed) {
      return { valid: false, empty: true };
    }

    try {
      return { valid: true, empty: false, value: JSON.parse(trimmed) as unknown };
    } catch (error) {
      return {
        valid: false,
        empty: false,
        error: this.parseJsonError(trimmed, error)
      };
    }
  }

  private parseJsonError(text: string, error: unknown): JsonParseError {
    const detail = error instanceof Error ? error.message : String(error);
    const positionMatch = /position\s+(\d+)/i.exec(detail);
    const position = positionMatch ? Number(positionMatch[1]) : undefined;
    const lineColumnMatch = /line\s+(\d+)\s+column\s+(\d+)/i.exec(detail);

    if (position !== undefined && Number.isFinite(position)) {
      const { line, column } = this.positionToLineColumn(text, position);
      return {
        detail,
        position,
        line,
        column,
        message: this.message('dataForm.validation.jsonInvalidAt', { line, column, detail })
      };
    }

    if (lineColumnMatch) {
      const line = Number(lineColumnMatch[1]);
      const column = Number(lineColumnMatch[2]);
      return {
        detail,
        line,
        column,
        message: this.message('dataForm.validation.jsonInvalidAt', { line, column, detail })
      };
    }

    return {
      detail,
      message: this.message('dataForm.validation.invalidJsonDetail', { detail })
    };
  }

  private positionToLineColumn(text: string, position: number): { line: number; column: number } {
    const safePosition = Math.max(0, Math.min(position, text.length));
    const lines = text.slice(0, safePosition).split(/\r\n|\r|\n/);
    return {
      line: lines.length,
      column: lines[lines.length - 1].length + 1
    };
  }

  private hasMaxLength(field: JsonRecord): boolean {
    if (field['maxLength'] !== undefined && field['maxLength'] !== null) {
      return true;
    }

    const validation = field['validation'];
    if (!Array.isArray(validation)) {
      return false;
    }

    return validation.some((rule) => this.isRecord(rule) && (rule['maxLength'] !== undefined || rule['type'] === 'maxLength'));
  }

  private fallbackCopy(text: string): boolean {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);
    return copied;
  }

  private exportFileName(): string {
    const raw = this.formCode().trim() || this.parsedSummary().formCode || 'data-form';
    return raw.replace(/[^A-Za-z0-9_-]/g, '_');
  }

  private issue(level: ValidationLevel, key: string, path?: string, replacements: Record<string, unknown> = {}): ValidationIssue {
    return {
      level,
      path,
      message: this.message(key, replacements)
    };
  }

  private message(key: string, replacements: Record<string, unknown> = {}): string {
    let value = this.i18nService.t(key);
    Object.entries(replacements).forEach(([replaceKey, replaceValue]) => {
      value = value.replaceAll(`{{${replaceKey}}}`, String(replaceValue));
    });
    return value;
  }

  private hasText(value: unknown): boolean {
    return typeof value === 'string' && value.trim().length > 0;
  }

  private stringValue(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private isRecord(value: unknown): value is JsonRecord {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private isDataFormStatus(value: unknown): value is DataFormStatus {
    return value === 'ACTIVE' || value === 'INACTIVE';
  }
}
