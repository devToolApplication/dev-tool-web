import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { of } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { AiAgentWorkflowCanvasComponent } from './ai-agent-workflow-canvas.component';
import { AiAgentWorkflowService } from '../../../../../core/services/ai-agent-service/ai-agent-workflow.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { SharedModule } from '../../../../../shared/shared.module';
import { FlowBuilderModule } from '../../../../../shared/ui/flow-builder/flow-builder.module';
import type {
  AiAgentWorkflowDefinitionResponse,
  AiAgentWorkflowGraphDraftRequest,
  AiAgentWorkflowPublishResponse,
  AiAgentWorkflowValidationResponse,
  WorkflowEdge,
  WorkflowNode,
} from '../../../../../core/models/ai-agent/ai-agent-workflow.model';

const storyNodes: WorkflowNode[] = [
  {
    id: 'agent-1',
    type: 'AI_AGENT_STEP',
    name: 'Classify Intent',
    config: JSON.stringify({
      agentConfigId: 'support-classifier',
      promptTemplate: 'Classify the incoming support message.',
      timeoutMs: 60000,
      maxRetries: 1,
    }),
    position: { x: 160, y: 80 },
  },
  {
    id: 'branch-1',
    type: 'BRANCH_NODE',
    name: 'Bug Report?',
    config: JSON.stringify({
      routingNote: 'Route bug reports into ticket creation.',
    }),
    position: { x: 178, y: 230 },
  },
  {
    id: 'logic-1',
    type: 'LOGIC_STEP',
    name: 'Normalize Payload',
    config: JSON.stringify({
      logicCode: 'MAP_OUTPUT',
      params: { target: 'ticket' },
      timeoutMs: 30000,
      maxRetries: 0,
    }),
    position: { x: 70, y: 390 },
  },
  {
    id: 'review-1',
    type: 'REVIEW_NODE',
    name: 'Human Review',
    config: JSON.stringify({
      instructions: 'Review escalated support response before sending.',
      autoApproveTimeoutMinutes: 0,
    }),
    position: { x: 340, y: 390 },
  },
  {
    id: 'end-1',
    type: 'END_NODE',
    name: 'Complete',
    position: { x: 190, y: 560 },
  },
];

const storyEdges: WorkflowEdge[] = [
  { id: 'edge-agent-branch', source: 'agent-1', target: 'branch-1' },
  {
    id: 'edge-branch-logic',
    source: 'branch-1',
    target: 'logic-1',
    label: 'Bug',
    condition: '#intent == "bug_report"',
  },
  {
    id: 'edge-branch-review',
    source: 'branch-1',
    target: 'review-1',
    label: 'Other',
    condition: '#intent != "bug_report"',
  },
  { id: 'edge-logic-end', source: 'logic-1', target: 'end-1' },
  { id: 'edge-review-end', source: 'review-1', target: 'end-1' },
];

const workflow: AiAgentWorkflowDefinitionResponse = {
  id: 'wf-story',
  name: 'Support Triage Workflow',
  description: 'Storybook workflow used for canvas interaction tests',
  status: 'DRAFT',
};

class MockAiAgentWorkflowService {
  lastDraft: AiAgentWorkflowGraphDraftRequest | null = null;

  getById() {
    return of(workflow);
  }

  getDraftGraph() {
    return of({
      workflowDefinitionId: workflow.id,
      versionId: 'version-story',
      versionNumber: 1,
      nodesJson: JSON.stringify(storyNodes),
      edgesJson: JSON.stringify(storyEdges),
    });
  }

  updateDraftGraph(_id: string, payload: AiAgentWorkflowGraphDraftRequest) {
    this.lastDraft = payload;
    return of(workflow);
  }

  validate() {
    return of({ valid: true, errors: [] } satisfies AiAgentWorkflowValidationResponse);
  }

  publish() {
    return of({
      workflowDefinitionId: workflow.id,
      workflowVersionId: 'published-story',
      versionNumber: 2,
    } satisfies AiAgentWorkflowPublishResponse);
  }
}

const meta: Meta<AiAgentWorkflowCanvasComponent> = {
  title: 'Features/System Management/AI Agent Workflow Canvas',
  component: AiAgentWorkflowCanvasComponent,
  decorators: [
    moduleMetadata({
      declarations: [AiAgentWorkflowCanvasComponent],
      imports: [SharedModule, FlowBuilderModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => key === 'id' ? workflow.id : null,
              },
            },
          },
        },
        {
          provide: Router,
          useValue: { navigate: () => Promise.resolve(true) },
        },
        {
          provide: AiAgentWorkflowService,
          useClass: MockAiAgentWorkflowService,
        },
        {
          provide: LoadingService,
          useValue: { track: <T>(source: T) => source },
        },
        {
          provide: ToastService,
          useValue: { success: () => undefined, info: () => undefined, error: () => undefined },
        },
        {
          provide: I18nService,
          useValue: { language: () => 'en', t: (key: string) => key },
        },
      ],
    }),
  ],
  parameters: {
    layout: 'fullscreen',
  },
  render: () => ({
    template: `
      <div style="width: 100vw; min-height: 100vh; background: var(--app-surface);">
        <app-ai-agent-workflow-canvas></app-ai-agent-workflow-canvas>
      </div>
    `,
  }),
};

export default meta;
type Story = StoryObj<AiAgentWorkflowCanvasComponent>;

export const Canvas: Story = {};
