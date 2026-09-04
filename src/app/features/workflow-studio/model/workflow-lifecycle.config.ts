import type { ActionToolbarAction } from '@shared/ui/layout/action-toolbar/action-toolbar.component';
import type { TableAction, TableConfig } from '@shared/ui/patterns/table/models/table-config.model';
import {
  WorkflowDefinition,
  WorkflowDetail,
  WorkflowVersion,
} from './workflow-studio.model';

export const DEFAULT_BPMN_XML = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<definitions xmlns=\"http://www.omg.org/spec/BPMN/20100524/MODEL\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:flowable=\"http://flowable.org/bpmn\" xmlns:bpmndi=\"http://www.omg.org/spec/BPMN/20100524/DI\" xmlns:di=\"http://www.omg.org/spec/DD/20100524/DI\" xmlns:dc=\"http://www.omg.org/spec/DD/20100524/DC\" targetNamespace=\"http://devtool.vn/workflow\">\n  <process id=\"workflow_draft\" name=\"workflowStudio.lifecycle.untitled\" isExecutable=\"true\">\n    <startEvent id=\"start-event-1\" name=\"Start\" />\n    <sequenceFlow id=\"flow-start-end\" sourceRef=\"start-event-1\" targetRef=\"end-event-1\" />\n    <endEvent id=\"end-event-1\" name=\"End\" />\n  </process>\n  <bpmndi:BPMNDiagram id=\"workflow_draft_diagram\">\n    <bpmndi:BPMNPlane id=\"workflow_draft_plane\" bpmnElement=\"workflow_draft\">\n      <bpmndi:BPMNShape id=\"start-event-1_shape\" bpmnElement=\"start-event-1\">\n        <dc:Bounds x=\"120\" y=\"140\" width=\"36\" height=\"36\" />\n      </bpmndi:BPMNShape>\n      <bpmndi:BPMNShape id=\"end-event-1_shape\" bpmnElement=\"end-event-1\">\n        <dc:Bounds x=\"360\" y=\"140\" width=\"36\" height=\"36\" />\n      </bpmndi:BPMNShape>\n      <bpmndi:BPMNEdge id=\"flow-start-end_di\" bpmnElement=\"flow-start-end\">\n        <di:waypoint x=\"156\" y=\"158\" />\n        <di:waypoint x=\"360\" y=\"158\" />\n      </bpmndi:BPMNEdge>\n    </bpmndi:BPMNPlane>\n  </bpmndi:BPMNDiagram>\n</definitions>";

export function createDraftWorkflowDetail(
  workflowId = '',
): WorkflowDetail {
  return {
    definition: {
      id: workflowId,
      name: 'workflowStudio.lifecycle.untitled',
      description: null,
      status: 'DRAFT',
      currentDraftVersionId: 'draft-new',
      currentPublishedVersionId: null,
    },
    versions: [
      {
        id: 'draft-new',
        workflowDefinitionId: workflowId,
        version: 1,
        status: 'DRAFT',
        bpmnXml: DEFAULT_BPMN_XML,
        runtime: { maxParallel: 1 },
      },
    ],
  };
}

export function buildWorkflowListActions(): ActionToolbarAction[] {
  return [
    {
      id: 'create',
      label: 'workflowStudio.lifecycle.create',
      icon: 'pi pi-plus',
      placement: 'primary',
      variant: 'primary',
    },
    {
      id: 'refresh',
      label: 'refresh',
      icon: 'pi pi-refresh',
      placement: 'secondary',
      variant: 'ghost',
    },
  ];
}

export function buildWorkflowBuilderActions(options: {
  saving: boolean;
  readonlyMode: boolean;
  hasWorkflow: boolean;
  hasBpmnXml: boolean;
}): ActionToolbarAction[] {
  const disabled = options.saving || !options.hasWorkflow;
  return [
    {
      id: 'importBpmn',
      label: 'workflowStudio.bpmn.import',
      icon: 'pi pi-upload',
      placement: 'secondary',
      variant: 'ghost',
      disabled: disabled || options.readonlyMode,
    },
    {
      id: 'exportBpmn',
      label: 'workflowStudio.bpmn.export',
      icon: 'pi pi-download',
      placement: 'secondary',
      variant: 'ghost',
      disabled: disabled || !options.hasBpmnXml,
    },
    {
      id: 'validate',
      label: 'workflowStudio.lifecycle.validate',
      icon: 'pi pi-check-circle',
      placement: 'secondary',
      variant: 'ghost',
      disabled,
    },
    {
      id: 'save',
      label: 'save',
      icon: 'pi pi-save',
      placement: 'primary',
      variant: 'primary',
      loading: options.saving,
      disabled: disabled || options.readonlyMode,
    },
    {
      id: 'versions',
      label: 'workflowStudio.lifecycle.versions',
      icon: 'pi pi-history',
      placement: 'secondary',
      variant: 'secondary',
      disabled,
    },
    {
      id: 'publish',
      label: 'workflowStudio.lifecycle.publish',
      icon: 'pi pi-send',
      placement: 'secondary',
      variant: 'secondary',
      loading: options.saving,
      disabled: disabled || options.readonlyMode,
    },
  ];
}

export function buildWorkflowListTable(): TableConfig<WorkflowDefinition> {
  return {
    title: 'workflowStudio.lifecycle.tableTitle',
    rowClickable: true,
    pagination: true,
    rows: 20,
    emptyTitle: 'workflowStudio.lifecycle.emptyTitle',
    emptyDescription: 'workflowStudio.lifecycle.emptyDescription',
    toolbar: {
      search: {
        visible: true,
        field: 'name',
        label: 'search',
        placeholder: 'workflowStudio.lifecycle.searchPlaceholder',
      },
      refresh: {
        visible: true,
        label: 'refresh',
        icon: 'pi pi-refresh',
      },
      columnVisibility: { visible: true },
      density: { visible: true },
    },
    columns: [
      {
        field: 'name',
        header: 'workflowStudio.lifecycle.workflow',
        type: 'text',
        minWidth: '14rem',
      },
      {
        field: 'status',
        header: 'workflowStudio.lifecycle.status',
        type: 'badge',
        width: '10rem',
        badgeMap: {
          DRAFT: 'muted',
          PUBLISHED: 'success',
          ARCHIVED: 'warning',
        },
      },
      {
        field: 'currentPublishedVersionId',
        header: 'workflowStudio.lifecycle.version',
        type: 'text',
        width: '10rem',
        formatter: (row: WorkflowDefinition) => versionCell(row),
      },
      {
        field: 'description',
        header: 'workflowStudio.lifecycle.description',
        type: 'text',
        minWidth: '18rem',
      },
      {
        field: 'actions',
        header: 'actions',
        type: 'actions',
        width: '12rem',
        align: 'right',
        frozen: true,
        alignFrozen: 'right',
        actions: workflowRowActions(),
      },
    ],
  };
}

export function workflowVersionLabel(version: Pick<WorkflowVersion, 'version' | 'status'>): string {
  return `v${version.version} - ${version.status}`;
}

export function readonlyModeForVersion(version: WorkflowVersion): boolean {
  return version.status === 'PUBLISHED';
}

function workflowRowActions(): TableAction<WorkflowDefinition>[] {
  return [
    { id: 'edit', label: 'edit', icon: 'pi pi-pencil', variant: 'ghost', onClick: () => undefined },
    {
      id: 'publish',
      label: 'workflowStudio.lifecycle.publish',
      icon: 'pi pi-send',
      variant: 'ghost',
      onClick: () => undefined,
    },
    {
      id: 'delete',
      label: 'workflowStudio.lifecycle.delete',
      icon: 'pi pi-trash',
      variant: 'danger',
      placement: 'more',
      onClick: () => undefined,
    },
  ];
}

function versionCell(row: WorkflowDefinition): string {
  if (row.currentPublishedVersionId) {
    return row.currentPublishedVersionId;
  }
  return row.currentDraftVersionId ?? '';
}
