import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import type { ActionToolbarAction } from '@shared/ui/layout/action-toolbar/action-toolbar.component';
import { WorkflowApiService } from '../api/workflow-api.service';
import { buildWorkflowRunDetailActions } from '../model/workflow-lifecycle.config';
import {
  WorkflowDetail,
  WorkflowNodeExecution,
  WorkflowRun,
} from '../model/workflow-studio.model';
import {
  workflowRunIsActive,
  workflowRunToRuntimeVisualState,
  workflowRunVersionForDetail,
} from '../model/workflow-runtime.mapper';

const POLL_INTERVAL_MS = 5000;

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
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  readonly run = signal<WorkflowRun | null>(null);
  readonly workflowDetail = signal<WorkflowDetail | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly polling = signal(false);
  readonly selectedNodeId = signal<string | null>(null);
  readonly selectedRuntimeTab = signal('overview');
  readonly runtimeTabs = [
    { label: 'workflowStudio.runtime.tab.overview', value: 'overview' },
    { label: 'workflowStudio.runtime.tab.input', value: 'input' },
    { label: 'workflowStudio.runtime.tab.output', value: 'output' },
    { label: 'workflowStudio.runtime.tab.evidence', value: 'evidence' },
    { label: 'workflowStudio.runtime.tab.execution', value: 'execution' },
    { label: 'workflowStudio.runtime.tab.error', value: 'error' },
  ];
  readonly actions = computed(() => buildWorkflowRunDetailActions({
    loading: this.loading(),
    hasRun: !!this.run(),
  }));
  readonly runtimeVersion = computed(() => workflowRunVersionForDetail(
    this.workflowDetail(),
    this.run()?.workflowVersionId,
  ));
  readonly runtimeBpmnXml = computed(() => this.runtimeVersion()?.bpmnXml ?? '');
  readonly runtimeStatus = computed(() => workflowRunToRuntimeVisualState(this.run()));
  readonly selectedNodeExecution = computed<WorkflowNodeExecution | null>(() => {
    const nodeId = this.selectedNodeId();
    return this.run()?.nodes.find((node) => node.nodeId === nodeId) ?? null;
  });
  readonly inspectorInput = computed<unknown>(() => this.selectedNodeExecution()?.inputSnapshot ?? this.run()?.input ?? null);
  readonly inspectorOutput = computed<unknown>(() => this.selectedNodeExecution()?.output ?? this.run()?.finalOutput ?? null);
  readonly inspectorEvidence = computed<unknown>(() => this.selectedNodeExecution()?.evidence ?? null);
  readonly inspectorExecution = computed<unknown>(() => {
    const execution = this.selectedNodeExecution();
    if (execution) {
      return {
        nodeId: execution.nodeId,
        nodeType: execution.nodeType,
        status: execution.executionStatus,
        outcome: execution.outcome,
        attempt: execution.attempt,
        reason: execution.reason,
      };
    }
    const run = this.run();
    return run ? {
      runId: run.id,
      status: run.status,
      outcome: run.finalOutcome,
      startedAt: run.startedAt,
      completedAt: run.completedAt,
    } : null;
  });
  readonly inspectorError = computed<unknown>(() => {
    const execution = this.selectedNodeExecution();
    return execution ? {
      errorCode: execution.errorCode,
      errorMessage: execution.errorMessage,
      reason: execution.reason,
    } : null;
  });

  ngOnInit(): void {
    const runId = this.route.snapshot.paramMap.get('runId');
    if (!runId) {
      this.error.set('workflowStudio.lifecycle.runIdMissing');
      return;
    }
    void this.loadRun(runId);
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  async loadRun(runId: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const run = await firstValueFrom(this.api.getRun(runId));
      this.setRun(run);
      await this.loadWorkflowForRun(run);
    } catch (error) {
      this.error.set(errorMessage(error));
      this.stopPolling();
    } finally {
      this.loading.set(false);
    }
  }

  onToolbarAction(action: ActionToolbarAction): void {
    if (action.id === 'retry') {
      void this.retry();
    }
  }

  async retry(): Promise<void> {
    const run = this.run();
    if (!run) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    try {
      const retried = await firstValueFrom(this.api.retryRun(run.id));
      this.setRun(retried);
      await this.loadWorkflowForRun(retried);
      await this.router.navigate(['/ai-agent-mcrs/workflow-runs', retried.id]);
    } catch (error) {
      this.error.set(errorMessage(error));
      this.stopPolling();
    } finally {
      this.loading.set(false);
    }
  }

  onNodeSelected(nodeId: string | null): void {
    this.selectedNodeId.set(nodeId);
    if (!nodeId) {
      this.selectedRuntimeTab.set('overview');
      return;
    }
    const execution = this.run()?.nodes.find((node) => node.nodeId === nodeId);
    this.selectedRuntimeTab.set(execution?.errorCode || execution?.errorMessage ? 'error' : 'execution');
  }

  setRuntimeTab(value: string): void {
    this.selectedRuntimeTab.set(value);
  }

  private async refreshRun(runId: string): Promise<void> {
    try {
      const run = await firstValueFrom(this.api.getRun(runId));
      this.setRun(run);
      await this.loadWorkflowForRun(run);
    } catch (error) {
      this.error.set(errorMessage(error));
      this.stopPolling();
    }
  }

  private async loadWorkflowForRun(run: WorkflowRun): Promise<void> {
    const current = this.workflowDetail();
    if (current?.definition.id === run.workflowDefinitionId) {
      return;
    }
    this.workflowDetail.set(await firstValueFrom(this.api.getWorkflowDetail(run.workflowDefinitionId)));
  }

  private setRun(run: WorkflowRun): void {
    this.run.set(run);
    if (this.selectedNodeId() && !run.nodes.some((node) => node.nodeId === this.selectedNodeId())) {
      this.selectedNodeId.set(null);
      this.selectedRuntimeTab.set('overview');
    }
    this.resetPolling(run);
  }

  private resetPolling(run: WorkflowRun): void {
    this.stopPolling();
    if (!workflowRunIsActive(run.status)) {
      return;
    }

    this.polling.set(true);
    this.pollTimer = setInterval(() => {
      void this.refreshRun(run.id);
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

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'workflowStudio.lifecycle.operationFailed';
}
