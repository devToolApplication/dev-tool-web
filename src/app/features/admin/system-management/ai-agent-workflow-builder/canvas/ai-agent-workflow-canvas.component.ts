import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import {
  AiAgentWorkflowDefinitionResponse,
  AiAgentWorkflowGraphDraftRequest,
  WorkflowEdge,
  WorkflowNode,
} from '../../../../../core/models/ai-agent/ai-agent-workflow.model';
import { AiAgentWorkflowService } from '../../../../../core/services/ai-agent-service/ai-agent-workflow.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { AI_AGENT_WORKFLOW_ROUTES } from '../ai-agent-workflow.constants';
import type {
  FlowCommandEvent,
  FlowDefinition,
  FlowEdge as BuilderFlowEdge,
  FlowNode as BuilderFlowNode,
} from '../../../../../shared/ui/flow-builder/models';
import {
  AI_AGENT_WORKFLOW_FLOW_CAPABILITIES,
  AI_AGENT_WORKFLOW_FLOW_TOOLBAR,
  createAiAgentWorkflowNodeTypes,
  flowDefinitionToWorkflowGraph,
  logicCodeLabel,
  normalizeWorkflowFlowDefinition,
  workflowGraphToFlowDefinition,
  workflowNodeIcon,
  workflowNodeSubtitle,
  workflowNodeTypeLabel,
  workflowValidationIssues,
} from './ai-agent-workflow-flow-adapter';

@Component({
  selector: 'app-ai-agent-workflow-canvas',
  standalone: false,
  templateUrl: './ai-agent-workflow-canvas.component.html',
  styleUrl: './ai-agent-workflow-canvas.component.scss',
})
export class AiAgentWorkflowCanvasComponent implements OnInit, OnDestroy {
  readonly workflowId = signal<string>('');
  readonly workflow = signal<AiAgentWorkflowDefinitionResponse | null>(null);
  readonly nodes = signal<WorkflowNode[]>([]);
  readonly edges = signal<WorkflowEdge[]>([]);
  readonly flowDefinition = signal<FlowDefinition>(workflowGraphToFlowDefinition({
    id: 'ai-agent-workflow',
    nodes: [],
    edges: [],
  }));
  readonly selectedFlowId = signal<string | null>(null);
  readonly selectedEdgeId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly validating = signal(false);
  readonly validationErrors = signal<string[]>([]);

  readonly nodeCount = computed(() => this.nodes().length);
  readonly edgeCount = computed(() => this.edges().length);
  readonly canPublish = computed(() => this.workflow()?.status !== 'ARCHIVED');
  readonly validationIssues = computed(() => workflowValidationIssues(this.validationErrors()));
  readonly selectedWorkflowEdge = computed(() => {
    const id = this.selectedEdgeId();
    return id ? this.edges().find(edge => edge.id === id) ?? null : null;
  });

  readonly flowNodeTypes = createAiAgentWorkflowNodeTypes();
  readonly flowToolbar = AI_AGENT_WORKFLOW_FLOW_TOOLBAR;
  readonly flowCapabilities = AI_AGENT_WORKFLOW_FLOW_CAPABILITIES;
  readonly flowPalette = {
    visible: true,
    title: 'Workflow nodes',
    width: '15rem',
  };
  readonly flowInspector = {
    visible: true,
    position: 'right' as const,
    width: '23rem',
  };

  private readonly graphChanged$ = new Subject<void>();
  private readonly destroy$ = new Subject<void>();
  private applyingFlowChange = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly service: AiAgentWorkflowService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly i18nService: I18nService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.workflowId.set(id);
      this.loadWorkflow(id);
    }

    this.graphChanged$.pipe(
      debounceTime(3000),
      takeUntil(this.destroy$)
    ).subscribe(() => this.saveDraft());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  validate(): void {
    this.validating.set(true);
    this.service.validate(this.workflowId()).subscribe({
      next: (res) => {
        this.validating.set(false);
        this.validationErrors.set(res.errors ?? []);
        if (res.valid) {
          this.toastService.success(this.i18nService.t('systemManagement.aiAgentWorkflow.toast.validationPassed'));
        } else {
          this.toastService.info(this.i18nService.t('systemManagement.aiAgentWorkflow.toast.validationFailed'));
        }
      },
      error: () => {
        this.validating.set(false);
        this.toastService.error(this.i18nService.t('systemManagement.aiAgentWorkflow.toast.validationError'));
      },
    });
  }

  publish(): void {
    this.service.publish(this.workflowId()).subscribe({
      next: (res) => {
        this.toastService.success(`Published as v${res.versionNumber}`);
        this.loadWorkflow(this.workflowId());
      },
      error: (err) => {
        const msg = err?.error?.message || 'Publish failed';
        this.toastService.error(msg);
      },
    });
  }

  goBack(): void {
    void this.router.navigate([AI_AGENT_WORKFLOW_ROUTES.list]);
  }

  onFlowValueChange(definition: FlowDefinition): void {
    if (this.applyingFlowChange) return;
    this.applyFlowDefinition(normalizeWorkflowFlowDefinition(definition), true);
  }

  onSelectedIdChange(id: string | null): void {
    this.selectedFlowId.set(id);
    this.selectedEdgeId.set(this.flowDefinition().edges.some(edge => edge.id === id) ? id : null);
  }

  onNodeClick(node: BuilderFlowNode): void {
    this.selectedFlowId.set(node.id);
    this.selectedEdgeId.set(null);
  }

  onEdgeClick(edge: BuilderFlowEdge): void {
    this.selectedFlowId.set(edge.id);
    this.selectedEdgeId.set(edge.id);
  }

  onBlankClick(): void {
    this.selectedFlowId.set(null);
    this.selectedEdgeId.set(null);
  }

  onFlowCommand(event: FlowCommandEvent): void {
    if (event.command === 'deleteSelection') {
      this.selectedEdgeId.set(null);
    }
  }

  updateSelectedEdgeCondition(condition: string | null): void {
    const edgeId = this.selectedEdgeId();
    if (!edgeId) return;
    this.patchEdge(edgeId, {
      condition: condition ?? '',
      label: condition || undefined,
    });
  }

  updateSelectedEdgeLabel(label: string | null): void {
    const edgeId = this.selectedEdgeId();
    if (!edgeId) return;
    const current = this.flowDefinition().edges.find(edge => edge.id === edgeId);
    const condition = String(current?.data?.['condition'] ?? '');
    this.patchEdge(edgeId, {
      condition,
      label: label || condition || undefined,
    });
  }

  closeEdgePanel(): void {
    this.selectedEdgeId.set(null);
    this.selectedFlowId.set(null);
  }

  nodeSubtitle(node: BuilderFlowNode): string {
    return workflowNodeSubtitle(node, node.type as any);
  }

  nodeIcon(node: BuilderFlowNode): string {
    return workflowNodeIcon(node.type as any);
  }

  nodeTypeLabel(node: BuilderFlowNode): string {
    return workflowNodeTypeLabel(node.type as any);
  }

  logicCodeText(value: unknown): string {
    return logicCodeLabel(typeof value === 'string' ? value : null) || 'Logic code required';
  }

  private loadWorkflow(id: string): void {
    this.loadingService.track(this.service.getById(id)).subscribe({
      next: (wf) => {
        this.workflow.set(wf);
        this.loadDraftGraph(id);
      },
      error: () => this.toastService.error('Failed to load workflow'),
    });
  }

  private loadDraftGraph(id: string): void {
    this.service.getDraftGraph(id).subscribe({
      next: (draft) => {
        let parsedNodes: WorkflowNode[] = [];
        let parsedEdges: WorkflowEdge[] = [];

        if (draft.nodesJson) {
          try {
            parsedNodes = JSON.parse(draft.nodesJson) as WorkflowNode[];
          } catch {
            parsedNodes = [];
          }
        }

        if (draft.edgesJson) {
          try {
            parsedEdges = JSON.parse(draft.edgesJson) as WorkflowEdge[];
          } catch {
            parsedEdges = [];
          }
        }

        this.applyFlowDefinition(workflowGraphToFlowDefinition({
          id,
          name: this.workflow()?.name,
          nodes: parsedNodes,
          edges: parsedEdges,
        }), false);
      },
      error: () => {
        this.applyFlowDefinition(workflowGraphToFlowDefinition({
          id,
          name: this.workflow()?.name,
          nodes: [],
          edges: [],
        }), false);
      },
    });
  }

  private saveDraft(): void {
    if (!this.workflowId()) return;

    this.saving.set(true);
    const payload: AiAgentWorkflowGraphDraftRequest = {
      nodesJson: JSON.stringify(this.nodes()),
      edgesJson: JSON.stringify(this.edges()),
    };

    this.service.updateDraftGraph(this.workflowId(), payload).subscribe({
      next: () => this.saving.set(false),
      error: () => {
        this.saving.set(false);
        this.toastService.info('Auto-save failed - will retry');
      },
    });
  }

  private onGraphChanged(): void {
    this.graphChanged$.next();
  }

  private applyFlowDefinition(definition: FlowDefinition, changed: boolean): void {
    const normalized = normalizeWorkflowFlowDefinition(definition);
    const graph = flowDefinitionToWorkflowGraph(normalized);

    this.applyingFlowChange = true;
    try {
      this.flowDefinition.set({
        ...normalized,
        id: this.workflowId() || normalized.id,
        name: this.workflow()?.name ?? normalized.name,
      });
      this.nodes.set(graph.nodes);
      this.edges.set(graph.edges);
      this.keepSelectionInBounds();
    } finally {
      this.applyingFlowChange = false;
    }

    if (changed) {
      this.validationErrors.set([]);
      this.onGraphChanged();
    }
  }

  private patchEdge(edgeId: string, patch: { condition: string; label?: string }): void {
    const updated: FlowDefinition = {
      ...this.flowDefinition(),
      edges: this.flowDefinition().edges.map(edge => {
        if (edge.id !== edgeId) return edge;
        return {
          ...edge,
          label: patch.label,
          data: {
            ...(edge.data ?? {}),
            condition: patch.condition,
          },
        };
      }),
    };
    this.applyFlowDefinition(updated, true);
  }

  private keepSelectionInBounds(): void {
    const selected = this.selectedFlowId();
    if (!selected) return;
    const flow = this.flowDefinition();
    const exists = flow.nodes.some(node => node.id === selected) || flow.edges.some(edge => edge.id === selected);
    if (!exists) {
      this.selectedFlowId.set(null);
      this.selectedEdgeId.set(null);
    }
  }
}
