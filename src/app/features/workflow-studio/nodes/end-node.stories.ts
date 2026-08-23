import { CommonModule } from '@angular/common';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { EndNodeComponent } from './end-node.component';
import { WorkflowNodeShellComponent } from './workflow-node-shell.component';
import { createWorkflowNode } from '../model/workflow-node-catalog';
import { EndWorkflowNode } from '../model/workflow-studio.model';

const defaultNode: EndWorkflowNode = createWorkflowNode('END', 'end-1');

const meta: Meta<EndNodeComponent> = {
  title: 'Features/Workflow Studio/Nodes/End Node',
  component: EndNodeComponent,
  decorators: [
    moduleMetadata({
      declarations: [EndNodeComponent, WorkflowNodeShellComponent],
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

type Story = StoryObj<EndNodeComponent>;

export const Default: Story = {};

export const Selected: Story = {
  args: {
    selected: true,
  },
};

export const Completed: Story = {
  args: {
    runtimeStatus: 'COMPLETED',
  },
};
