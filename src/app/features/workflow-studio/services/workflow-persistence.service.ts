import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { WorkflowApiService } from '../api/workflow-api.service';
import {
  WorkflowDetail,
  WorkflowUpsertPayload,
  WorkflowValidationIssue,
  WorkflowVersion,
} from '../model/workflow-studio.model';
import { WorkflowEditorStore } from '../store/workflow-editor.store';

@Injectable({ providedIn: 'root' })
export class WorkflowPersistenceService {
  private readonly api = inject(WorkflowApiService);

  async save(store: WorkflowEditorStore): Promise<WorkflowDetail> {
    const payload = this.localValidPayload(store);
    const workflowId = store.workflow()?.definition.id;
    store.setSaving(true);
    try {
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
    const workflowId = detail.definition.id;
    const saved = workflowId
      ? await firstValueFrom(this.api.updateWorkflow(workflowId, payload))
      : await firstValueFrom(this.api.createWorkflow(payload));
    return await firstValueFrom(this.api.publishWorkflow(saved.definition.id));
  }

  private localValidPayload(store: WorkflowEditorStore): WorkflowUpsertPayload {
    const payload = store.toUpsertPayload();
    store.setValidationIssues([]);
    return payload;
  }
}

function validPayloadFromDetail(detail: WorkflowDetail): WorkflowUpsertPayload {
  const version = draftVersionForUpsert(detail);
  return {
    name: detail.definition.name,
    description: detail.definition.description,
    bpmnXml: version.bpmnXml,
    runtime: version.runtime ? { ...version.runtime } : null,
  };
}

function draftVersionForUpsert(detail: WorkflowDetail): WorkflowVersion {
  const version =
    detail.versions.find((item) => item.id === detail.definition.currentDraftVersionId) ??
    detail.versions.find((item) => item.status === 'DRAFT') ??
    detail.versions[0];
  if (!version) {
    throw new Error('Workflow detail has no version to publish');
  }
  return version;
}