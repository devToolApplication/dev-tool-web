import { CommonModule } from '@angular/common';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { CodeGateNodeComponent } from './code-gate-node.component';
import { EndNodeComponent } from './end-node.component';
import { LogicNodeComponent } from './logic-node.component';
import { StartNodeComponent } from './start-node.component';
import { WorkflowNodeShellComponent } from './workflow-node-shell.component';
import { createWorkflowNode, workflowNodeCatalogItems } from '../model/workflow-node-catalog';

const startNode = createWorkflowNode('START', 'start-1');
const codeGateNode = {
  ...createWorkflowNode('CODE_GATE', 'code-gate-1'),
  handler: 'VALIDATE_THIRDPARTY',
};
const logicNode = {
  ...createWorkflowNode('LOGIC', 'logic-1'),
  operator: 'AND' as const,
};
const endNode = createWorkflowNode('END', 'end-1');

const meta: Meta<WorkflowNodeShellComponent> = {
  title: 'Features/Workflow Studio/Nodes/Node Shell & Catalog',
  component: WorkflowNodeShellComponent,
  decorators: [
    moduleMetadata({
      declarations: [
        WorkflowNodeShellComponent,
        StartNodeComponent,
        CodeGateNodeComponent,
        LogicNodeComponent,
        EndNodeComponent,
      ],
      imports: [CommonModule],
    }),
  ],
};

export default meta;

type Story = StoryObj<WorkflowNodeShellComponent>;

export const ShellStates: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 16px; max-width: 320px;">
        <div>
          <span style="font-size: 12px; color: var(--app-text-muted, #64748b);">Default</span>
          <app-start-node [node]="startNode" />
        </div>
        <div>
          <span style="font-size: 12px; color: var(--app-text-muted, #64748b);">Code Gate</span>
          <app-code-gate-node [node]="codeGateNode" />
        </div>
        <div>
          <span style="font-size: 12px; color: var(--app-text-muted, #64748b);">Logic Node</span>
          <app-logic-node [node]="logicNode" />
        </div>
        <div>
          <span style="font-size: 12px; color: var(--app-text-muted, #64748b);">End Node</span>
          <app-end-node [node]="endNode" />
        </div>
      </div>
    `,
    props: {
      startNode,
      codeGateNode,
      logicNode,
      endNode,
    },
  }),
};

export const CatalogTable: Story = {
  render: () => {
    const catalog = workflowNodeCatalogItems();
    return {
      template: `
        <div style="padding: 16px;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px;">
            <thead>
              <tr style="border-bottom: 2px solid var(--app-border, #dee2y6);">
                <th style="padding: 8px;">Type</th>
                <th style="padding: 8px;">Title</th>
                <th style="padding: 8px;">Description</th>
                <th style="padding: 8px;">Shape</th>
                <th style="padding: 8px;">Tone</th>
                <th style="padding: 8px;">Ports</th>
              </tr>
            </thead>
            <tbody>
              @for (item of catalog; track item.type) {
                <tr style="border-bottom: 1px solid var(--app-border, #dee2y6);">
                  <td style="padding: 8px; font-family: monospace;">{{ item.type }}</td>
                  <td style="padding: 8px;">{{ item.title }}</td>
                  <td style="padding: 8px;">{{ item.description }}</td>
                  <td style="padding: 8px;">{{ item.shape }}</td>
                  <td style="padding: 8px;">{{ item.tone }}</td>
                  <td style="padding: 8px;">{{ item.ports.length }} ports</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      `,
      props: {
        catalog,
      },
    };
  },
};
