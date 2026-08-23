import { CommonModule } from '@angular/common';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { StartNodeComponent } from './start-node.component';
import { WorkflowNodeShellComponent } from './workflow-node-shell.component';
import { createWorkflowNode } from '../model/workflow-node-catalog';
import { StartWorkflowNode } from '../model/workflow-studio.model';

const defaultNode: StartWorkflowNode = createWorkflowNode('START', 'start-1');

const meta: Meta<StartNodeComponent> = {
  title: 'Features/Workflow Studio/Nodes/Start Node',
  component: StartNodeComponent,
  decorators: [
    moduleMetadata({
      declarations: [StartNodeComponent, WorkflowNodeShellComponent],
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

type Story = StoryObj<StartNodeComponent>;

export const Default: Story = {};

export const Selected: Story = {
  args: {
    selected: true,
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
