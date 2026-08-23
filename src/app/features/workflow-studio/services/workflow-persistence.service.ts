import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { WorkflowApiService } from '../api/workflow-api.service';
import { WorkflowDetail, WorkflowUpsertPayload, WorkflowValidationIssue, WorkflowVersion } from '../model/workflow-studio.model';
import { validateWorkflowGraph } from '../model/workflow-validator';
import { WorkflowEditorStore } from '../store/workflow-editor.store';

@Injectable({ providedIn: 'root' })
export class WorkflowPersistenceService {
  private readonly api = inject(WorkflowApiService);

  async save(store: WorkflowEditorStore): Promise<WorkflowDetail> {
    const payload = this.localValidPayload(store);
    const workflowId = store.workflow()?.definition.id;
    store.setSaving(true);
    try {
      await this.validateBackend(payload, store);
      const saved = workflowId
        ? await firstValueFrom(this.api.updateWorkflow(workflowId, payload))
        : await firstValueFrom(this.api.createWorkflow(payload));
      store.loadWorkflow(saved);
      return saved;
    } finally {
      store.setSaving(false);
    }
  }

  async publish(store: WorkflowEditorStore): Promise<WorkflowDetail> {
    const payload = this.localValidPayload(store);
    const workflowId = store.workflow()?.definition.id;
    store.setSaving(true);
    try {
      await this.validateBackend(payload, store);
      const saved = workflowId
        ? await firstValueFrom(this.api.updateWorkflow(workflowId, payload))
        : await firstValueFrom(this.api.createWorkflow(payload));
      store.loadWorkflow(saved);
      const published = await firstValueFrom(this.api.publishWorkflow(saved.definition.id));
      store.loadWorkflow(published);
      return published;
    } finally {
      store.setSaving(false);
    }
  }

  async publishDetail(detail: WorkflowDetail): Promise<WorkflowDetail> {
    const payload = validPayloadFromDetail(detail);
    await this.validateBackend(payload);
    const workflowId = detail.definition.id;
    const saved = workflowId
      ? await firstValueFrom(this.api.updateWorkflow(workflowId, payload))
      : await firstValueFrom(this.api.createWorkflow(payload));
    return await firstValueFrom(this.api.publishWorkflow(saved.definition.id));
  }

  private localValidPayload(store: WorkflowEditorStore): WorkflowUpsertPayload {
    const payload = store.toUpsertPayload();
    const issues = validateWorkflowGraph(payload.definition);
    if (issues.length) {
      store.setValidationIssues(issues);
      throw new Error(firstErrorMessage(issues));
    }
    store.setValidationIssues([]);
    return payload;
  }

  private async validateBackend(payload: WorkflowUpsertPayload, store?: WorkflowEditorStore): Promise<void> {
    const result = await firstValueFrom(this.api.validateWorkflow(payload));
    if (!result.valid) {
      store?.setValidationIssues(result.issues);
      throw new Error(firstErrorMessage(result.issues));
    }
    store?.setValidationIssues([]);
  }
}

function validPayloadFromDetail(detail: WorkflowDetail): WorkflowUpsertPayload {
  const version = draftVersionForUpsert(detail);
  const payload: WorkflowUpsertPayload = {
    name: detail.definition.name,
    description: detail.definition.description,
    definition: cloneJson(version.definition),
    runtime: version.runtime ? { ...version.runtime } : null,
    editor: version.editor ? cloneJson(version.editor) : null,
  };
  const issues = validateWorkflowGraph(payload.definition);
  if (issues.length) {
    throw new Error(firstErrorMessage(issues));
  }
  return payload;
}

function draftVersionForUpsert(detail: WorkflowDetail): WorkflowVersion {
  const version = detail.versions.find((item) => item.id === detail.definition.currentDraftVersionId)
    ?? detail.versions.find((item) => item.status === 'DRAFT')
    ?? detail.versions[0];
  if (!version) {
    throw new Error('Workflow detail has no version to publish');
  }
  return version;
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function firstErrorMessage(issues: WorkflowValidationIssue[]): string {
  return issues.find((issue) => issue.severity === 'error')?.message
    ?? issues[0]?.message
    ?? 'Workflow validation failed';
}
