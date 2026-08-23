import { CommonModule } from '@angular/common';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AiGateNodeComponent } from './ai-gate-node.component';
import { WorkflowNodeShellComponent } from './workflow-node-shell.component';
import { createWorkflowNode } from '../model/workflow-node-catalog';
import { AiGateWorkflowNode } from '../model/workflow-studio.model';

const defaultNode: AiGateWorkflowNode = {
  ...createWorkflowNode('AI_GATE', 'ai-gate-1'),
  instruction: 'Evaluate customer risk profile',
  provider: 'openai',
  modelProfile: 'gpt-4o',
};

const meta: Meta<AiGateNodeComponent> = {
  title: 'Features/Workflow Studio/Nodes/AI Gate',
  component: AiGateNodeComponent,
  decorators: [
    moduleMetadata({
      declarations: [AiGateNodeComponent, WorkflowNodeShellComponent],
      imports: [CommonModule],
    }),
  ],
  args: {
    node: defaultNode,
    selected: false,
    runtimeStatus: null,
    validationSeverity: null,
  },
  argTypes: {
    runtimeStatus: {
      control: 'select',
      options: [
        null,
        'PENDING',
        'READY',
        'RUNNING',
        'WAITING_EXTERNAL',
        'COMPLETED',
        'ERROR',
        'TIMED_OUT',
        'CANCELLED',
        'SKIPPED',
      ],
    },
    validationSeverity: {
      control: 'select',
      options: [null, 'error', 'warning'],
    },
  },
};

export default meta;

type Story = StoryObj<AiGateNodeComponent>;

export const Default: Story = {};

export const Selected: Story = {
  args: {
    selected: true,
  },
};

export const Invalid: Story = {
  args: {
    validationSeverity: 'error',
  },
};

export const Running: Story = {
  args: {
    runtimeStatus: 'RUNNING',
  },
};

export const WaitingExternal: Story = {
  args: {
    runtimeStatus: 'WAITING_EXTERNAL',
  },
};

export const Completed: Story = {
  args: {
    runtimeStatus: 'COMPLETED',
  },
};

export const Error: Story = {
  args: {
    runtimeStatus: 'ERROR',
  },
};

export const StateMatrix: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 16px; max-width: 320px;">
        <div>
          <span style="font-size: 12px; color: var(--app-text-muted, #64748b);">Default</span>
          <app-ai-gate-node [node]="defaultNode" />
        </div>
        <div>
          <span style="font-size: 12px; color: var(--app-text-muted, #64748b);">Selected</span>
          <app-ai-gate-node [node]="defaultNode" [selected]="true" />
        </div>
        <div>
          <span style="font-size: 12px; color: var(--app-text-muted, #64748b);">Invalid (Error)</span>
          <app-ai-gate-node [node]="defaultNode" validationSeverity="error" />
        </div>
        <div>
          <span style="font-size: 12px; color: var(--app-text-muted, #64748b);">Running</span>
          <app-ai-gate-node [node]="defaultNode" runtimeStatus="RUNNING" />
        </div>
        <div>
          <span style="font-size: 12px; color: var(--app-text-muted, #64748b);">Waiting External</span>
          <app-ai-gate-node [node]="defaultNode" runtimeStatus="WAITING_EXTERNAL" />
        </div>
        <div>
          <span style="font-size: 12px; color: var(--app-text-muted, #64748b);">Completed</span>
          <app-ai-gate-node [node]="defaultNode" runtimeStatus="COMPLETED" />
        </div>
        <div>
          <span style="font-size: 12px; color: var(--app-text-muted, #64748b);">Error</span>
          <app-ai-gate-node [node]="defaultNode" runtimeStatus="ERROR" />
        </div>
      </div>
    `,
    props: {
      defaultNode,
    },
  }),
};
