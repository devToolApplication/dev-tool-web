import { CommonModule } from '@angular/common';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { LogicNodeComponent } from './logic-node.component';
import { WorkflowNodeShellComponent } from './workflow-node-shell.component';
import { createWorkflowNode } from '../model/workflow-node-catalog';
import { LogicWorkflowNode } from '../model/workflow-studio.model';

const defaultNode: LogicWorkflowNode = {
  ...createWorkflowNode('LOGIC', 'logic-1'),
  operator: 'AND',
};

const meta: Meta<LogicNodeComponent> = {
  title: 'Features/Workflow Studio/Nodes/Logic Node',
  component: LogicNodeComponent,
  decorators: [
    moduleMetadata({
      declarations: [LogicNodeComponent, WorkflowNodeShellComponent],
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
      options: [null, 'PENDING', 'READY', 'RUNNING', 'COMPLETED', 'ERROR'],
    },
    validationSeverity: {
      control: 'select',
      options: [null, 'error', 'warning'],
    },
  },
};

export default meta;

type Story = StoryObj<LogicNodeComponent>;

export const Default: Story = {};

export const OrOperator: Story = {
  args: {
    node: {
      ...defaultNode,
      operator: 'OR',
    },
  },
};

export const Selected: Story = {
  args: {
    selected: true,
  },
};
