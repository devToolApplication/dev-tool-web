import { CommonModule } from '@angular/common';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { CodeGateNodeComponent } from './code-gate-node.component';
import { WorkflowNodeShellComponent } from './workflow-node-shell.component';
import { createWorkflowNode } from '../model/workflow-node-catalog';
import { CodeGateWorkflowNode } from '../model/workflow-studio.model';

const defaultNode: CodeGateWorkflowNode = {
  ...createWorkflowNode('CODE_GATE', 'code-gate-1'),
  handler: 'EXECUTE_STAKE_CHECK',
};

const meta: Meta<CodeGateNodeComponent> = {
  title: 'Features/Workflow Studio/Nodes/Code Gate',
  component: CodeGateNodeComponent,
  decorators: [
    moduleMetadata({
      declarations: [CodeGateNodeComponent, WorkflowNodeShellComponent],
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

type Story = StoryObj<CodeGateNodeComponent>;

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
