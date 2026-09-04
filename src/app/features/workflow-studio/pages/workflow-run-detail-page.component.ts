import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { firstValueFrom } from 'rxjs';

import type { ActionToolbarAction } from '@shared/ui/layout/action-toolbar/action-toolbar.component';
import { WorkflowApiService } from '../api/workflow-api.service';
import { computeWorkflowRuntimeVisualState } from '../model/workflow-graph.utils';
import {
  WorkflowDetail,
  WorkflowEdge,
  WorkflowNodeExecution,
  WorkflowRun,
  WorkflowRuntimeVisualState,
} from '../model/workflow-studio.model';

@Component({
  selector: 'app-workflow-run-detail-page',
  standalone: false,
  templateUrl: './workflow-run-detail-page.component.html',
  styleUrl: './workflow-run-detail-page.component.css',
})
export class WorkflowRunDetailPageComponent implements OnInit, OnDestroy {
  private readonly api = inject(WorkflowApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly runId = signal<string>('');
  readonly run = signal<WorkflowRun | null>(null);
  readonly workflowDetail = signal<WorkflowDetail | null>(null);
  readonly bpmnXml = signal<string>('');
  readonly runtimeVisualState = signal<WorkflowRuntimeVisualState>({});
  readonly selectedNodeId = signal<string | null>(null);
  readonly selectedExecution = signal<WorkflowNodeExecution | null>(null);

  readonly loading = signal(false);
  readonly retrying = signal(false);
  readonly error = signal<string | null>(null);
  readonly autoPolling = signal(true);

  private pollingSub?: Subscription;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('runId');
    if (id) {
      this.runId.set(id);
      void this.loadRun(id, true);
    }
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  get actions(): ActionToolbarAction[] {
    const isRunning = this.run()?.status === 'RUNNING' || this.run()?.status === 'PENDING';
    const isError = this.run()?.status === 'ERROR' || this.run()?.status === 'TIMED_OUT';

    return [
      {
        id: 'back',
        label: 'common.back',
        icon: 'pi pi-arrow-left',
        placement: 'secondary',
        variant: 'ghost',
      },
      {
        id: 'refresh',
        label: 'refresh',
        icon: 'pi pi-refresh',
        placement: 'secondary',
        variant: 'ghost',
      },
      {
        id: 'polling',
        label: this.autoPolling()
          ? 'workflowStudio.runtime.pollingActive'
          : 'workflowStudio.runtime.pollingStopped',
        icon: this.autoPolling() ? 'pi pi-sync pi-spin' : 'pi pi-pause',
        placement: 'secondary',
        variant: this.autoPolling() ? 'secondary' : 'ghost',
      },
      {
        id: 'retry',
        label: 'workflowStudio.lifecycle.retryRun',
        icon: 'pi pi-replay',
        placement: 'primary',
        variant: 'primary',
        disabled: !isError || this.retrying(),
        loading: this.retrying(),
      },
    ];
  }

  async loadRun(runId: string, initial = false): Promise<void> {
    if (initial) {
      this.loading.set(true);
    }
    this.error.set(null);
    try {
      const runData = await firstValueFrom(this.api.getRun(runId));
      this.run.set(runData);

      if (!this.workflowDetail() && runData.workflowDefinitionId) {
        await this.loadWorkflowDetail(runData.workflowDefinitionId, runData.workflowVersionId);
      }

      this.updateRuntimeState();

      if (this.autoPolling() && (runData.status === 'RUNNING' || runData.status === 'PENDING')) {
        this.startPolling();
      } else {
        this.stopPolling();
      }
    } catch (err) {
      this.error.set(errorMessage(err));
    } finally {
      if (initial) {
        this.loading.set(false);
      }
    }
  }

  async loadWorkflowDetail(workflowId: string, versionId?: string): Promise<void> {
    try {
      const detail = await firstValueFrom(this.api.getWorkflowDetail(workflowId));
      this.workflowDetail.set(detail);

      const targetVersion =
        detail.versions.find((v) => v.id === versionId) ||
        detail.versions[0];
      if (targetVersion?.bpmnXml) {
        this.bpmnXml.set(targetVersion.bpmnXml);
      }
    } catch {
      // ignore
    }
  }

  updateRuntimeState(): void {
    const currentRun = this.run();
    if (!currentRun) {
      return;
    }

    const xml = this.bpmnXml();
    const edges = extractEdgesFromBpmnXml(xml);
    const visualState = computeWorkflowRuntimeVisualState(currentRun.nodes || [], edges);
    this.runtimeVisualState.set(visualState);

    const selId = this.selectedNodeId();
    if (selId) {
      const exec = (currentRun.nodes || []).find((n) => n.nodeId === selId) || null;
      this.selectedExecution.set(exec);
    } else if (currentRun.nodes?.length) {
      const lastExec = currentRun.nodes[currentRun.nodes.length - 1];
      this.selectedNodeId.set(lastExec.nodeId);
      this.selectedExecution.set(lastExec);
    }
  }

  onNodeSelected(nodeId: string | null): void {
    this.selectedNodeId.set(nodeId);
    if (!nodeId) {
      this.selectedExecution.set(null);
      return;
    }
    const exec = this.run()?.nodes?.find((n) => n.nodeId === nodeId) || null;
    this.selectedExecution.set(exec);
  }

  selectExecution(exec: WorkflowNodeExecution): void {
    this.selectedNodeId.set(exec.nodeId);
    this.selectedExecution.set(exec);
  }

  togglePolling(): void {
    this.autoPolling.update((v) => !v);
    if (this.autoPolling()) {
      this.startPolling();
    } else {
      this.stopPolling();
    }
  }

  startPolling(): void {
    if (this.pollingSub) {
      return;
    }
    this.pollingSub = interval(2500).subscribe(() => {
      const id = this.runId();
      if (id) {
        void this.loadRun(id, false);
      }
    });
  }

  stopPolling(): void {
    this.pollingSub?.unsubscribe();
    this.pollingSub = undefined;
  }

  async retryRun(): Promise<void> {
    const id = this.runId();
    if (!id) {
      return;
    }
    this.retrying.set(true);
    try {
      const retried = await firstValueFrom(this.api.retryRun(id));
      this.run.set(retried);
      this.updateRuntimeState();
      this.startPolling();
    } catch (err) {
      this.error.set(errorMessage(err));
    } finally {
      this.retrying.set(false);
    }
  }

  onToolbarAction(action: { id: string }): void {
    switch (action.id) {
      case 'back':
        void this.router.navigate(['../'], { relativeTo: this.route });
        break;
      case 'refresh':
        void this.loadRun(this.runId(), true);
        break;
      case 'polling':
        this.togglePolling();
        break;
      case 'retry':
        void this.retryRun();
        break;
      default:
        break;
    }
  }
}

function extractEdgesFromBpmnXml(xml: string): WorkflowEdge[] {
  if (!xml) {
    return [];
  }
  const edges: WorkflowEdge[] = [];
  const regex = /<(?:\w+:)?sequenceFlow\s+([^>]+)>/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(xml)) !== null) {
    const attrs = match[1];
    const idMatch = /id="([^"]+)"/.exec(attrs);
    const sourceMatch = /sourceRef="([^"]+)"/.exec(attrs);
    const targetMatch = /targetRef="([^"]+)"/.exec(attrs);
    if (sourceMatch && targetMatch) {
      edges.push({
        id: idMatch ? idMatch[1] : null,
        source: sourceMatch[1],
        target: targetMatch[1],
      });
    }
  }
  return edges;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'workflowStudio.lifecycle.operationFailed';
}
