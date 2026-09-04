import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import type { ActionToolbarAction } from '@shared/ui/layout/action-toolbar/action-toolbar.component';
import { ToastService } from '@core/notifications/toast.service';
import {
  buildWorkflowBuilderActions,
  createDraftWorkflowDetail,
  readonlyModeForVersion,
  workflowVersionLabel,
} from '../model/workflow-lifecycle.config';
import {
  WorkflowValidationIssue,
  WorkflowVersion,
} from '../model/workflow-studio.model';
import { WorkflowApiService } from '../api/workflow-api.service';
import { WorkflowBpmnCanvasComponent } from '../bpmn/workflow-bpmn-canvas.component';
import { ensureBpmnDiagramLayout } from '../bpmn/bpmn-auto-layout';
import { WorkflowPersistenceService } from '../services/workflow-persistence.service';
import { WorkflowEditorStore } from '../store/workflow-editor.store';

@Component({
  selector: 'app-workflow-builder-page',
  standalone: false,
  templateUrl: './workflow-builder-page.component.html',
  styleUrl: './workflow-builder-page.component.css',
})
export class WorkflowBuilderPageComponent implements OnInit {
  @ViewChild(WorkflowBpmnCanvasComponent) workflowBpmnCanvas?: WorkflowBpmnCanvasComponent;
  @ViewChild('bpmnImportInput') bpmnImportInput?: ElementRef<HTMLInputElement>;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(WorkflowApiService);
  private readonly persistence = inject(WorkflowPersistenceService);
  private readonly toastService = inject(ToastService);

  readonly store = inject(WorkflowEditorStore);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly statusMessage = signal<string | null>(null);
  readonly versionsOpen = signal(false);
  readonly importDialogOpen = signal(false);
  readonly descriptionDialogOpen = signal(false);
  readonly importXmlText = signal('');
  readonly propertiesPanelCollapsed = signal(false);

  readonly selectedId = computed(() => this.store.selectedNodeId() ?? this.store.selectedEdgeId());
  readonly readonlyMode = computed(() => this.store.mode() !== 'design');
  readonly actions = computed(() =>
    buildWorkflowBuilderActions({
      saving: this.store.saving(),
      readonlyMode: this.readonlyMode(),
      hasWorkflow: !!this.store.workflow(),
      hasBpmnXml: !!this.store.bpmnXml(),
    }),
  );
  readonly selectedVersionId = signal<string | null>(null);
  readonly activeVersion = computed(() => {
    const workflow = this.store.workflow();
    const versionId = this.selectedVersionId();
    return (
      workflow?.versions.find((version) => version.id === versionId) ??
      workflow?.versions.find(
        (version) => version.id === workflow.definition.currentDraftVersionId,
      ) ??
      workflow?.versions[0] ??
      null
    );
  });

  readonly statusBadge = computed<{ label: string; variant: 'success' | 'warning' | 'muted' }>(() => {
    if (this.store.dirty()) {
      return { label: 'workflowStudio.productivity.unsavedChanges', variant: 'warning' };
    }
    const version = this.activeVersion();
    if (version?.status === 'PUBLISHED') {
      return { label: 'workflowStudio.lifecycle.published', variant: 'success' };
    }
    return { label: 'workflowStudio.lifecycle.saved', variant: 'muted' };
  });

  ngOnInit(): void {
    const workflowId = this.route.snapshot.paramMap.get('workflowId');
    if (workflowId) {
      void this.loadWorkflow(workflowId);
      return;
    }
    const draft = createDraftWorkflowDetail();
    this.store.loadWorkflow(draft);
    this.selectedVersionId.set(draft.definition.currentDraftVersionId);
  }

  hasUnsavedChanges(): boolean {
    return this.store.dirty();
  }

  @HostListener('document:keydown', ['$event'])
  async handleShortcut(event: KeyboardEvent): Promise<void> {
    if (isEditableShortcutTarget(event.target)) {
      return;
    }

    const key = event.key.toLowerCase();
    const commandKey = event.ctrlKey || event.metaKey;

    if (commandKey && key === 's') {
      event.preventDefault();
      await this.save();
      return;
    }
  }

  async loadWorkflow(workflowId: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const detail = await firstValueFrom(this.api.getWorkflowDetail(workflowId));
      this.store.loadWorkflow(detail);
      this.selectedVersionId.set(detail.definition.currentDraftVersionId);
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  onToolbarAction(action: ActionToolbarAction): void {
    switch (action.id) {
      case 'validate':
        void this.validate();
        break;
      case 'save':
        void this.save();
        break;
      case 'versions':
        this.versionsOpen.set(true);
        break;
      case 'publish':
        void this.publish();
        break;
      case 'importBpmn':
        this.openImportDialog();
        break;
      case 'exportBpmn':
        this.exportBpmnFile();
        break;
      default:
        break;
    }
  }

  async validate(): Promise<boolean> {
    try {
      const result = await firstValueFrom(this.api.validateWorkflow(this.store.toUpsertPayload()));
      this.setValidationIssues(result.issues);
      this.statusMessage.set(result.valid ? 'workflowStudio.lifecycle.validationPassed' : null);
      return result.valid;
    } catch (error) {
      this.error.set(errorMessage(error));
      return false;
    }
  }

  async save(): Promise<void> {
    const wasNew = this.isNewWorkflow();
    try {
      const saved = await this.persistence.save(this.store);
      this.selectedVersionId.set(
        saved.definition.currentDraftVersionId ?? saved.versions[0]?.id ?? null,
      );
      this.statusMessage.set('workflowStudio.lifecycle.saved');
      if (wasNew) {
        await this.router.navigate(['/ai-agent-mcrs/workflows', saved.definition.id, 'edit'], {
          replaceUrl: true,
        });
      }
    } catch (error) {
      this.toastService.error(errorMessage(error));
    }
  }

  async publish(): Promise<void> {
    const wasNew = this.isNewWorkflow();
    try {
      const published = await this.persistence.publish(this.store);
      this.selectedVersionId.set(
        published.definition.currentDraftVersionId ?? published.versions[0]?.id ?? null,
      );
      this.statusMessage.set('workflowStudio.lifecycle.published');
      if (wasNew) {
        await this.router.navigate(['/ai-agent-mcrs/workflows', published.definition.id, 'edit'], {
          replaceUrl: true,
        });
      }
    } catch (error) {
      this.error.set(errorMessage(error));
    }
  }

  closeVersions(): void {
    this.versionsOpen.set(false);
  }

  openDescriptionDialog(): void {
    this.descriptionDialogOpen.set(true);
  }

  closeDescriptionDialog(): void {
    this.descriptionDialogOpen.set(false);
  }

  togglePropertiesPanel(): void {
    this.propertiesPanelCollapsed.update((v) => !v);
  }

  onProblemSelected(issue: WorkflowValidationIssue): void {
    if (issue.elementId) {
      this.store.selectNode(issue.elementId);
      this.workflowBpmnCanvas?.revealElement(issue.elementId);
    }
  }

  openImportDialog(): void {
    if (this.readonlyMode()) {
      return;
    }
    this.importXmlText.set(this.store.bpmnXml());
    this.importDialogOpen.set(true);
  }

  closeImportDialog(): void {
    this.importDialogOpen.set(false);
    this.importXmlText.set('');
  }

  onImportXmlInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.importXmlText.set(target.value);
  }

  applyImportXml(directValue?: string): void {
    const raw = (directValue !== undefined && directValue !== '' ? directValue : this.importXmlText()) || '';
    const xml = raw.trim();
    if (!xml) {
      this.toastService.error('workflowStudio.bpmn.importEmpty');
      return;
    }
    const formattedXml = ensureBpmnDiagramLayout(xml, this.store.workflow()?.definition?.name);
    this.updateBpmnXml(formattedXml);
    this.closeImportDialog();
  }

  openBpmnImport(fileInput: HTMLInputElement): void {
    if (this.readonlyMode()) {
      return;
    }
    fileInput.click();
  }

  async onBpmnImportSelected(event: Event): Promise<void> {
    const input = event.target instanceof HTMLInputElement ? event.target : null;
    const file = input?.files?.[0] ?? null;
    try {
      if (file) {
        await this.importBpmnFile(file);
        this.closeImportDialog();
      }
    } finally {
      if (input) {
        input.value = '';
      }
    }
  }

  async importBpmnFile(file: File): Promise<void> {
    if (this.readonlyMode()) {
      return;
    }
    if (!isBpmnImportFile(file)) {
      this.toastService.error('workflowStudio.bpmn.importInvalidExtension');
      return;
    }

    try {
      const xml = await readFileText(file);
      if (!xml.trim()) {
        this.toastService.error('workflowStudio.bpmn.importEmpty');
        return;
      }
      const formattedXml = ensureBpmnDiagramLayout(xml, this.store.workflow()?.definition?.name);
      this.updateBpmnXml(formattedXml);
    } catch (error) {
      this.toastService.error(errorMessage(error));
    }
  }

  exportBpmnFile(): void {
    const xml = this.store.bpmnXml();
    if (!xml) {
      return;
    }

    const blobUrl = URL.createObjectURL(new Blob([xml], { type: 'application/xml' }));
    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = bpmnDownloadFileName(this.store.workflow()?.definition.name);
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(blobUrl);
  }

  selectVersion(versionId: string): void {
    const workflow = this.store.workflow();
    if (!workflow) {
      return;
    }
    const version = workflow.versions.find((item) => item.id === versionId);
    if (!version) {
      return;
    }
    this.selectedVersionId.set(version.id);
    this.store.loadWorkflow(workflow, {
      versionId: version.id,
      mode: readonlyModeForVersion(version) ? 'readonly' : 'design',
    });
  }

  onNameInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.updateName(input.value);
  }

  updateName(value: string | null): void {
    this.store.updateWorkflowMetadata(
      value ?? '',
      this.store.workflow()?.definition.description ?? null,
    );
  }

  updateDescription(value: string | null): void {
    this.store.updateWorkflowMetadata(this.store.workflow()?.definition.name ?? '', value);
  }

  updateBpmnXml(value: string): void {
    this.store.updateBpmnXml(value);
  }

  versionLabel(version: WorkflowVersion): string {
    return workflowVersionLabel(version);
  }

  private setValidationIssues(issues: WorkflowValidationIssue[]): void {
    this.store.setValidationIssues(issues);
    this.statusMessage.set(issues.length ? null : 'workflowStudio.lifecycle.validationPassed');
  }

  private isNewWorkflow(): boolean {
    return !this.store.workflow()?.definition.id;
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'workflowStudio.lifecycle.operationFailed';
}

function isEditableShortcutTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();
  return (
    target.isContentEditable ||
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    !!target.closest('[contenteditable="true"]')
  );
}

function isBpmnImportFile(file: File): boolean {
  return /\.(bpmn|xml)$/i.test(file.name);
}

function bpmnDownloadFileName(name: string | null | undefined): string {
  const baseName = (name ?? 'workflow')
    .trim()
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${baseName || 'workflow'}.bpmn`;
}

async function readFileText(file: File): Promise<string> {
  if (typeof file.text === 'function') {
    return await file.text();
  }

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
