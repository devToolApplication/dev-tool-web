import {
  Component,
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
  JsonValue,
  WorkflowGraph,
  WorkflowNodePosition,
  WorkflowValidationIssue,
  WorkflowVersion,
} from '../model/workflow-studio.model';
import { validateWorkflowGraph } from '../model/workflow-validator';
import { WorkflowApiService } from '../api/workflow-api.service';
import { WorkflowCanvasComponent } from '../canvas/workflow-canvas.component';
import { WorkflowLayoutService } from '../services/workflow-layout.service';
import { WorkflowPersistenceService } from '../services/workflow-persistence.service';
import { WorkflowEditorStore } from '../store/workflow-editor.store';

@Component({
  selector: 'app-workflow-builder-page',
  standalone: false,
  templateUrl: './workflow-builder-page.component.html',
  styleUrl: './workflow-builder-page.component.css',
})
export class WorkflowBuilderPageComponent implements OnInit {
  @ViewChild(WorkflowCanvasComponent) workflowCanvas?: WorkflowCanvasComponent;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(WorkflowApiService);
  private readonly persistence = inject(WorkflowPersistenceService);
  private readonly layout = inject(WorkflowLayoutService);
  private readonly toastService = inject(ToastService);

  readonly store = inject(WorkflowEditorStore);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly statusMessage = signal<string | null>(null);
  readonly versionsOpen = signal(false);
  readonly runDialogOpen = signal(false);
  readonly running = signal(false);
  readonly generalInfoCollapsed = signal(false);

  readonly selectedId = computed(() => this.store.selectedNodeId() ?? this.store.selectedEdgeId());
  readonly selectedNode = computed(() => {
    const nodeId = this.store.selectedNodeId();
    if (!nodeId) {
      return null;
    }
    return this.store.nodes().find((node) => node.id === nodeId) ?? null;
  });
  readonly nodeDrawerOpen = computed(() => !!this.selectedNode());
  readonly readonlyMode = computed(() => this.store.mode() !== 'design');
  readonly actions = computed(() =>
    buildWorkflowBuilderActions({
      saving: this.store.saving(),
      readonlyMode: this.readonlyMode(),
      hasWorkflow: !!this.store.workflow(),
    }),
  );
  readonly selectedVersionId = signal<string | null>(null);
  readonly activeRuntime = computed(() => {
    const workflow = this.store.workflow();
    const versionId = this.selectedVersionId();
    return (
      workflow?.versions.find((version) => version.id === versionId)?.runtime ??
      workflow?.versions.find((version) => version.id === workflow.definition.currentDraftVersionId)
        ?.runtime ??
      workflow?.versions[0]?.runtime ??
      null
    );
  });
  readonly generalInfoSummary = computed(() => ({
    name: this.store.workflow()?.definition.name || 'workflowStudio.lifecycle.untitled',
    maxParallel: this.activeRuntime()?.maxParallel ?? null,
    statusLabel: this.store.dirty()
      ? 'workflowStudio.productivity.unsavedChanges'
      : 'workflowStudio.lifecycle.saved',
  }));

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

    if (commandKey && key === 'z' && event.shiftKey) {
      event.preventDefault();
      this.store.redo();
      return;
    }

    if (commandKey && key === 'y') {
      event.preventDefault();
      this.store.redo();
      return;
    }

    if (commandKey && key === 'z') {
      event.preventDefault();
      this.store.undo();
      return;
    }

    if (commandKey && key === '0') {
      event.preventDefault();
      this.fitView();
      return;
    }

    if (key === 'delete' || key === 'backspace') {
      event.preventDefault();
      this.store.deleteSelection();
      return;
    }

    if (key === 'escape') {
      event.preventDefault();
      this.closeTransientState();
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
      case 'run':
        this.runDialogOpen.set(true);
        break;
      default:
        break;
    }
  }

  async validate(): Promise<boolean> {
    const localIssues = validateWorkflowGraph(this.store.graph());
    if (localIssues.length) {
      this.setValidationIssues(localIssues);
      return false;
    }

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

  async applyAutoLayout(): Promise<void> {
    if (this.readonlyMode()) {
      return;
    }
    const positions = await this.layout.layout(this.store.graph(), {});
    this.store.applyLayout(positions);
    this.statusMessage.set('workflowStudio.productivity.autoLayoutApplied');
  }

  fitView(): void {
    this.workflowCanvas?.fitView();
  }

  resetView(): void {
    this.workflowCanvas?.resetView();
  }

  zoomIn(): void {
    this.workflowCanvas?.zoomIn();
  }

  zoomOut(): void {
    this.workflowCanvas?.zoomOut();
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

  async startRun(input: JsonValue): Promise<void> {
    const workflowId = this.store.workflow()?.definition.id;
    if (!workflowId) {
      await this.save();
    }
    const savedWorkflowId = this.store.workflow()?.definition.id;
    if (!savedWorkflowId) {
      return;
    }

    this.running.set(true);
    try {
      const run = await firstValueFrom(this.api.startWorkflow(savedWorkflowId, input));
      this.runDialogOpen.set(false);
      await this.router.navigate(['/ai-agent-mcrs/workflow-runs', run.id]);
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.running.set(false);
    }
  }

  closeRunDialog(): void {
    this.runDialogOpen.set(false);
  }

  closeVersions(): void {
    this.versionsOpen.set(false);
  }

  closeNodeDrawer(): void {
    this.store.selectNode(null);
  }

  toggleGeneralInfo(): void {
    this.generalInfoCollapsed.update((value) => !value);
  }

  closeTransientState(): void {
    this.versionsOpen.set(false);
    this.runDialogOpen.set(false);
    this.closeNodeDrawer();
    this.store.selectEdge(null);
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

  updateName(value: string | null): void {
    this.store.updateWorkflowMetadata(
      value ?? '',
      this.store.workflow()?.definition.description ?? null,
    );
  }

  updateDescription(value: string | null): void {
    this.store.updateWorkflowMetadata(this.store.workflow()?.definition.name ?? '', value);
  }

  updateMaxParallel(value: number | null): void {
    this.store.updateRuntime({ maxParallel: value });
  }

  addNode(event: { node: WorkflowGraph['nodes'][number]; position: WorkflowNodePosition }): void {
    this.store.addNode(event.node, event.position);
  }

  moveNode(event: { nodeId: string; position: WorkflowNodePosition }): void {
    this.store.moveNode(event.nodeId, event.position);
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
