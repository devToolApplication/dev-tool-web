import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { expect, waitFor } from 'storybook/test';
import { FlowBuilderComponent } from './flow-builder.component';
import { FlowBuilderModule } from '../../flow-builder.module';
import { SharedModule } from '../../../../shared.module';
import { FlowDefinition, FlowNodeTypeDefinition, FlowToolbarConfig } from '../../models';

// ============================================================
// STORY 1: Rule Expression Flow (Trade Bot)
// ============================================================

const ruleNodeTypes: FlowNodeTypeDefinition[] = [
  {
    type: 'rule-group',
    label: 'Group',
    shape: 'diamond',
    defaultSize: { width: 100, height: 100 },
    tone: 'info',
    ports: [
      { id: 'in', group: 'in', position: 'top' },
      { id: 'out', group: 'out', position: 'bottom' },
    ],
    allowConnectFrom: true,
    allowConnectTo: true,
    allowDelete: true,
    allowMove: true,
    labelResolver: (node) => String(node.data?.['operator'] ?? 'GROUP'),
  },
  {
    type: 'rule-condition',
    label: 'Condition',
    shape: 'diamond',
    defaultSize: { width: 80, height: 80 },
    tone: 'warning',
    ports: [
      { id: 'in', group: 'in', position: 'top' },
      { id: 'out', group: 'out', position: 'bottom' },
    ],
    allowConnectFrom: false,
    allowConnectTo: true,
    allowDelete: true,
    allowMove: true,
    labelResolver: (node) => String(node.data?.['operator'] ?? '?'),
  },
  {
    type: 'rule-operand',
    label: 'Operand',
    shape: 'capsule',
    defaultSize: { width: 160, height: 46 },
    tone: 'muted',
    ports: [{ id: 'in', group: 'in', position: 'top' }],
    allowConnectFrom: false,
    allowConnectTo: true,
    allowDelete: false,
    allowMove: true,
    labelResolver: (node) => String(node.data?.['label'] ?? '?'),
  },
  {
    type: 'rule-ref',
    label: 'Rule Ref',
    shape: 'rectangle',
    defaultSize: { width: 160, height: 50 },
    tone: 'primary',
    ports: [{ id: 'in', group: 'in', position: 'top' }],
    allowConnectFrom: false,
    allowConnectTo: true,
    allowDelete: true,
    allowMove: true,
    labelResolver: (node) => node.data?.['ruleCode'] ? `Rule: ${node.data['ruleCode']}` : 'Rule: ?',
  },
  {
    type: 'rule-not',
    label: 'NOT',
    shape: 'capsule',
    defaultSize: { width: 60, height: 60 },
    tone: 'danger',
    ports: [
      { id: 'in', group: 'in', position: 'top' },
      { id: 'out', group: 'out', position: 'bottom' },
    ],
    allowConnectFrom: true,
    allowConnectTo: true,
    allowDelete: true,
    allowMove: true,
    labelResolver: () => 'NOT',
  },
];

const ruleFlowDefinition: FlowDefinition = {
  id: 'rule-demo',
  version: 1,
  nodes: [
    { id: 'g1', type: 'rule-group', label: 'AND', data: { operator: 'AND' } },
    { id: 'c1', type: 'rule-condition', label: 'CROSSOVER', data: { operator: 'CROSSOVER' } },
    { id: 'c2', type: 'rule-condition', label: 'GT', data: { operator: 'GT' } },
    { id: 'o1', type: 'rule-operand', label: 'EMA(14)', data: { label: 'EMA(14)' } },
    { id: 'o2', type: 'rule-operand', label: 'EMA(50)', data: { label: 'EMA(50)' } },
    { id: 'o3', type: 'rule-operand', label: 'RSI(14)', data: { label: 'RSI(14)' } },
    { id: 'o4', type: 'rule-operand', label: '70', data: { label: '70' } },
    { id: 'r1', type: 'rule-ref', label: 'Rule: VOL_FILTER', data: { ruleCode: 'VOL_FILTER' } },
    { id: 'n1', type: 'rule-not', label: 'NOT', data: {} },
    { id: 'c3', type: 'rule-condition', label: 'LT', data: { operator: 'LT' } },
    { id: 'o5', type: 'rule-operand', label: 'ATR(14)', data: { label: 'ATR(14)' } },
    { id: 'o6', type: 'rule-operand', label: '0.5', data: { label: '0.5' } },
  ],
  edges: [
    { id: 'e1', source: { nodeId: 'g1', portId: 'out' }, target: { nodeId: 'c1', portId: 'in' } },
    { id: 'e2', source: { nodeId: 'g1', portId: 'out' }, target: { nodeId: 'c2', portId: 'in' } },
    { id: 'e3', source: { nodeId: 'g1', portId: 'out' }, target: { nodeId: 'r1', portId: 'in' } },
    { id: 'e4', source: { nodeId: 'g1', portId: 'out' }, target: { nodeId: 'n1', portId: 'in' } },
    { id: 'e5', source: { nodeId: 'c1', portId: 'out' }, target: { nodeId: 'o1', portId: 'in' }, data: { kind: 'operand' } },
    { id: 'e6', source: { nodeId: 'c1', portId: 'out' }, target: { nodeId: 'o2', portId: 'in' }, data: { kind: 'operand' } },
    { id: 'e7', source: { nodeId: 'c2', portId: 'out' }, target: { nodeId: 'o3', portId: 'in' }, data: { kind: 'operand' } },
    { id: 'e8', source: { nodeId: 'c2', portId: 'out' }, target: { nodeId: 'o4', portId: 'in' }, data: { kind: 'operand' } },
    { id: 'e9', source: { nodeId: 'n1', portId: 'out' }, target: { nodeId: 'c3', portId: 'in' } },
    { id: 'e10', source: { nodeId: 'c3', portId: 'out' }, target: { nodeId: 'o5', portId: 'in' }, data: { kind: 'operand' } },
    { id: 'e11', source: { nodeId: 'c3', portId: 'out' }, target: { nodeId: 'o6', portId: 'in' }, data: { kind: 'operand' } },
  ],
};

const ruleHtmlNodeTypes: FlowNodeTypeDefinition[] = [
  {
    type: 'rule-ref',
    label: 'Rule Ref',
    shape: 'html',
    defaultSize: { width: 220, height: 72 },
    tone: 'primary',
    ports: [{ id: 'in', group: 'in', position: 'top' }],
    allowConnectFrom: false,
    allowConnectTo: true,
    allowDelete: true,
    allowMove: true,
    labelResolver: (node) => node.data?.['ruleCode'] ? `Rule: ${node.data['ruleCode']}` : 'Rule: ?',
  },
];

const singleRuleRefFlowDefinition: FlowDefinition = {
  id: 'single-rule-ref-demo',
  version: 1,
  nodes: [
    {
      id: 'rule-ref-1',
      type: 'rule-ref',
      label: 'Rule: TREND_IS_BEARISH_INTERNAL',
      data: { ruleCode: 'TREND_IS_BEARISH_INTERNAL' },
    },
  ],
  edges: [],
};

const htmlConnectionNodeTypes: FlowNodeTypeDefinition[] = [
  {
    type: 'source-html',
    label: 'Source',
    shape: 'html',
    defaultSize: { width: 180, height: 64 },
    tone: 'success',
    ports: [{ id: 'out', group: 'out', position: 'bottom' }],
    allowConnectFrom: true,
    allowConnectTo: false,
    allowDelete: true,
    allowMove: true,
  },
  {
    type: 'target-html',
    label: 'Target',
    shape: 'html',
    defaultSize: { width: 180, height: 64 },
    tone: 'primary',
    ports: [{ id: 'in', group: 'in', position: 'top' }],
    allowConnectFrom: false,
    allowConnectTo: true,
    allowDelete: true,
    allowMove: true,
  },
];

const htmlConnectionFlowDefinition: FlowDefinition = {
  id: 'html-port-connection-demo',
  version: 1,
  nodes: [
    {
      id: 'source-1',
      type: 'source-html',
      label: 'Source',
      position: { x: 80, y: 70 },
      data: { subtitle: 'Drag from this node' },
    },
    {
      id: 'target-1',
      type: 'target-html',
      label: 'Target',
      position: { x: 80, y: 240 },
      data: { subtitle: 'Drop on this node' },
    },
  ],
  edges: [],
};

// ============================================================
// STORY 2: AI Agent Workflow (inspired by joint-demos/ai-agent-builder)
// ============================================================

const agentNodeTypes: FlowNodeTypeDefinition[] = [
  {
    type: 'trigger',
    label: 'Trigger',
    shape: 'html',
    template: '__status',
    defaultSize: { width: 220, height: 60 },
    defaultData: { triggerType: 'New Message Received', description: 'Slack channel', tone: 'success', statusLabel: 'event' },
    tone: 'success',
    ports: [
      { id: 'out', group: 'out', position: 'bottom' },
    ],
    allowConnectFrom: true,
    allowConnectTo: false,
    allowDelete: false,
    allowMove: true,
    labelResolver: (node) => String(node.data?.['triggerType'] ?? 'Trigger'),
    subtitleResolver: (node) => String(node.data?.['description'] ?? ''),
  },
  {
    type: 'agent',
    label: 'AI Agent',
    shape: 'html',
    template: '__info',
    defaultSize: { width: 240, height: 80 },
    defaultData: { name: 'New Agent', model: 'claude-sonnet-4', prompt: '', tone: 'primary' },
    tone: 'primary',
    ports: [
      { id: 'in', group: 'in', position: 'top' },
      { id: 'out-success', group: 'out', position: 'bottom' },
      { id: 'out-fail', group: 'out', position: 'bottom' },
    ],
    allowConnectFrom: true,
    allowConnectTo: true,
    allowDelete: true,
    allowMove: true,
    labelResolver: (node) => String(node.data?.['name'] ?? 'AI Agent'),
    subtitleResolver: (node) => String(node.data?.['model'] ?? ''),
    inspector: {
      title: 'AI Agent',
      sections: [
        {
          id: 'config',
          title: 'Configuration',
          fields: [
            { key: 'name', label: 'Agent Name', type: 'text' },
            { key: 'model', label: 'Model', type: 'select', options: [
              { label: 'Claude Opus 4', value: 'claude-opus-4' },
              { label: 'Claude Sonnet 4', value: 'claude-sonnet-4' },
              { label: 'GPT-4o', value: 'gpt-4o' },
            ]},
            { key: 'prompt', label: 'System Prompt', type: 'textarea' },
            { key: 'temperature', label: 'Temperature', type: 'number' },
          ],
        },
      ],
    },
  },
  {
    type: 'action',
    label: 'Action',
    shape: 'html',
    template: '__form',
    defaultSize: { width: 220, height: 65 },
    defaultData: { actionName: 'New Action', app: 'Slack', config: {}, tone: 'info' },
    tone: 'info',
    ports: [
      { id: 'in', group: 'in', position: 'top' },
      { id: 'out', group: 'out', position: 'bottom' },
    ],
    allowConnectFrom: true,
    allowConnectTo: true,
    allowDelete: true,
    allowMove: true,
    labelResolver: (node) => String(node.data?.['actionName'] ?? 'Action'),
    subtitleResolver: (node) => String(node.data?.['app'] ?? ''),
    inspector: {
      title: 'Action',
      sections: [
        {
          id: 'config',
          title: 'Configuration',
          fields: [
            { key: 'actionName', label: 'Action Name', type: 'text' },
            { key: 'app', label: 'Application', type: 'select', options: [
              { label: 'Slack', value: 'slack' },
              { label: 'Email', value: 'email' },
              { label: 'HTTP', value: 'http' },
              { label: 'Database', value: 'database' },
            ]},
            { key: 'config', label: 'Config JSON', type: 'json' },
          ],
        },
      ],
    },
  },
  {
    type: 'condition',
    label: 'Condition',
    shape: 'diamond',
    defaultSize: { width: 100, height: 100 },
    defaultData: { condition: 'condition === true', description: '' },
    tone: 'warning',
    ports: [
      { id: 'in', group: 'in', position: 'top' },
      { id: 'out-true', group: 'out', position: 'bottom' },
      { id: 'out-false', group: 'out', position: 'right' },
    ],
    allowConnectFrom: true,
    allowConnectTo: true,
    allowDelete: true,
    allowMove: true,
    labelResolver: (node) => String(node.data?.['condition'] ?? 'IF'),
    inspector: {
      title: 'Condition',
      sections: [
        {
          id: 'config',
          title: 'Configuration',
          fields: [
            { key: 'condition', label: 'Condition Expression', type: 'text' },
            { key: 'description', label: 'Description', type: 'textarea' },
          ],
        },
      ],
    },
  },
  {
    type: 'note',
    label: 'Note',
    shape: 'note',
    defaultSize: { width: 180, height: 80 },
    defaultData: { text: 'New note' },
    tone: 'neutral',
    ports: [],
    allowConnectFrom: false,
    allowConnectTo: false,
    allowDelete: true,
    allowMove: true,
    labelResolver: (node) => String(node.data?.['text'] ?? 'Note'),
  },
];

const agentFlowDefinition: FlowDefinition = {
  id: 'agent-workflow-demo',
  version: 1,
  nodes: [
    { id: 'trigger-1', type: 'trigger', label: 'New Message', data: { triggerType: 'New Message Received', description: 'Slack #support channel', tone: 'success', statusLabel: 'event' } },
    { id: 'agent-1', type: 'agent', label: 'Classify Intent', data: { name: 'Classify Intent', model: 'claude-sonnet-4', prompt: 'Classify the user message into: bug_report, feature_request, question, other', tone: 'primary' } },
    { id: 'cond-1', type: 'condition', label: 'Is Bug?', data: { condition: 'intent === "bug_report"' } },
    { id: 'agent-2', type: 'agent', label: 'Draft Response', data: { name: 'Draft Response', model: 'claude-opus-4', prompt: 'Draft a helpful response to the user question', tone: 'primary' } },
    { id: 'action-1', type: 'action', label: 'Create Jira Ticket', data: { actionName: 'Create Jira Ticket', app: 'Jira', tone: 'info' } },
    { id: 'action-2', type: 'action', label: 'Send Reply', data: { actionName: 'Send Slack Reply', app: 'Slack', tone: 'info' } },
    { id: 'action-3', type: 'action', label: 'Send Reply', data: { actionName: 'Send Slack Reply', app: 'Slack', tone: 'info' } },
    { id: 'note-1', type: 'note', label: 'Note', data: { text: 'Auto-triage support messages\nand route to appropriate handler' } },
  ],
  edges: [
    { id: 'e1', source: { nodeId: 'trigger-1', portId: 'out' }, target: { nodeId: 'agent-1', portId: 'in' } },
    { id: 'e2', source: { nodeId: 'agent-1', portId: 'out-success' }, target: { nodeId: 'cond-1', portId: 'in' } },
    { id: 'e3', source: { nodeId: 'cond-1', portId: 'out-true' }, target: { nodeId: 'action-1', portId: 'in' }, label: 'Yes' },
    { id: 'e4', source: { nodeId: 'cond-1', portId: 'out-false' }, target: { nodeId: 'agent-2', portId: 'in' }, label: 'No' },
    { id: 'e5', source: { nodeId: 'action-1', portId: 'out' }, target: { nodeId: 'action-2', portId: 'in' } },
    { id: 'e6', source: { nodeId: 'agent-2', portId: 'out-success' }, target: { nodeId: 'action-3', portId: 'in' } },
  ],
};

// ============================================================
// Storybook Config
// ============================================================

const fullToolbar: FlowToolbarConfig = {
  visible: true,
  mode: 'floating',
  commands: [
    'undo',
    'redo',
    'fit',
    'zoomIn',
    'zoomOut',
    'resetZoom',
    'autoLayout',
    'toggleNavigator',
    'toggleInspector',
    'fullscreen',
    'duplicateSelection',
    'deleteSelection',
    'exportJson',
    'importJson',
  ],
};

const meta: Meta<FlowBuilderComponent> = {
  title: 'Shared/UI/FlowBuilder',
  component: FlowBuilderComponent,
  args: {
    palette: { visible: true },
  },
  decorators: [
    moduleMetadata({
      imports: [FlowBuilderModule, SharedModule],
    }),
  ],
  parameters: { layout: 'fullscreen' },
  render: (args) => ({
    props: args,
    template: `
      <div style="width: 100vw; height: calc(100vh - 40px); min-height: 720px; background: var(--app-surface);">
        <app-flow-builder
          [value]="value"
          [nodeTypes]="nodeTypes"
          [edgeTypes]="edgeTypes"
          [toolbar]="toolbar"
          [inspector]="inspector"
          [palette]="palette"
          [capabilities]="capabilities"
          [validationIssues]="validationIssues"
          [selectedId]="selectedId"
          [selection]="selection"
          [mode]="mode"
          [autoLayout]="autoLayout"
          [fitOnLoad]="fitOnLoad"
          [readonly]="readonly"
        ></app-flow-builder>
      </div>
    `,
  }),
  argTypes: {
    mode: { control: 'select', options: ['edit', 'readonly', 'trace'] },
    autoLayout: { control: 'boolean' },
    fitOnLoad: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<FlowBuilderComponent>;

// ============================================================
// Stories
// ============================================================

/**
 * Rule Expression Flow — Trade Bot domain.
 * Demonstrates: group/condition/operand/ruleRef/NOT nodes,
 * operand edges (dashed), logic edges (solid), BPMN-style layout.
 */
export const RuleExpressionFlow: Story = {
  args: {
    value: ruleFlowDefinition,
    nodeTypes: ruleNodeTypes,
    mode: 'edit',
    autoLayout: true,
    fitOnLoad: true,
    toolbar: fullToolbar,
  },
};

/**
 * AI Agent Workflow — inspired by joint-demos/ai-agent-builder.
 * Demonstrates: trigger/agent/action/condition/note nodes,
 * multi-port connections, edge labels, inspector schema.
 *
 * NOTE: This story demonstrates the data/layout capabilities.
 * The following features from the original ai-agent-builder demo
 * are NOT yet implemented and would require @joint/plus or custom work:
 * - Provider/action registry dialog
 * - Skill icons inside agent nodes
 * - Edge label editing inline
 * - Node resize handles
 * - Snap-to-grid visual guides
 */
export const SingleRuleRefInitialFit: Story = {
  tags: ['flow-builder-initial-fit'],
  args: {
    value: singleRuleRefFlowDefinition,
    nodeTypes: ruleHtmlNodeTypes,
    mode: 'edit',
    autoLayout: true,
    fitOnLoad: true,
    toolbar: fullToolbar,
    selectedId: 'rule-ref-1',
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="width: 100vw; height: calc(100vh - 40px); min-height: 720px; background: var(--app-surface); padding: 16px;">
        <app-flow-builder
          [value]="value"
          [nodeTypes]="nodeTypes"
          [toolbar]="toolbar"
          [selectedId]="selectedId"
          [mode]="mode"
          [autoLayout]="autoLayout"
          [fitOnLoad]="fitOnLoad"
        >
          <ng-template appFlowNodeTemplate="rule-ref" let-node>
            <div class="rule-story-node">
              <span>REF</span>
              <strong>{{ node.data?.ruleCode }}</strong>
            </div>
          </ng-template>
        </app-flow-builder>
      </div>
    `,
    styles: [`
      .rule-story-node {
        box-sizing: border-box;
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        height: 100%;
        min-width: 0;
        padding: 10px 12px;
        border: 1px solid var(--app-primary);
        border-radius: 8px;
        background: color-mix(in srgb, var(--app-card-surface) 96%, transparent);
        color: var(--app-text);
      }

      .rule-story-node span {
        display: inline-flex;
        flex: 0 0 auto;
        align-items: center;
        justify-content: center;
        height: 24px;
        padding: 0 8px;
        border-radius: 999px;
        background: var(--app-chart-primary-fill);
        color: var(--app-text-soft, var(--app-text));
        font-size: 10px;
        font-weight: 800;
      }

      .rule-story-node strong {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 13px;
        font-weight: 800;
      }
    `],
  }),
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const canvas = canvasElement.querySelector('.flow-canvas');
      const overlay = canvasElement.querySelector('.flow-node-overlay');

      expect(canvas).toBeTruthy();
      expect(overlay).toBeTruthy();

      const canvasRect = canvas!.getBoundingClientRect();
      const overlayRect = overlay!.getBoundingClientRect();
      expect(overlayRect.left - canvasRect.left).toBeGreaterThan(80);
      expect(overlayRect.top - canvasRect.top).toBeGreaterThan(80);
      expect(overlayRect.left).toBeGreaterThan(canvasRect.left);
      expect(overlayRect.top).toBeGreaterThan(canvasRect.top);
    });
  },
};

export const HtmlPortConnection: Story = {
  tags: ['flow-builder-connection'],
  args: {
    value: htmlConnectionFlowDefinition,
    nodeTypes: htmlConnectionNodeTypes,
    mode: 'edit',
    autoLayout: false,
    fitOnLoad: true,
    toolbar: fullToolbar,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="width: 100vw; height: calc(100vh - 40px); min-height: 720px; background: var(--app-surface); padding: 16px;">
        <app-flow-builder
          [value]="value"
          [nodeTypes]="nodeTypes"
          [toolbar]="toolbar"
          [mode]="mode"
          [autoLayout]="autoLayout"
          [fitOnLoad]="fitOnLoad"
        >
          <ng-template appFlowNodeTemplate="source-html" let-node>
            <div class="html-connection-node html-connection-node--source">
              <strong>{{ node.label }}</strong>
              <span>{{ node.data?.subtitle }}</span>
            </div>
          </ng-template>
          <ng-template appFlowNodeTemplate="target-html" let-node>
            <div class="html-connection-node html-connection-node--target">
              <strong>{{ node.label }}</strong>
              <span>{{ node.data?.subtitle }}</span>
            </div>
          </ng-template>
        </app-flow-builder>
      </div>
    `,
    styles: [`
      .html-connection-node {
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 3px;
        width: 100%;
        height: 100%;
        min-width: 0;
        padding: 10px 12px;
        border: 1px solid var(--app-border-soft);
        border-radius: 8px;
        background: color-mix(in srgb, var(--app-card-surface) 96%, transparent);
        color: var(--app-text);
      }

      .html-connection-node--source {
        border-color: var(--app-control-success-border, var(--app-primary));
      }

      .html-connection-node--target {
        border-color: var(--app-primary);
      }

      .html-connection-node strong,
      .html-connection-node span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .html-connection-node strong {
        font-size: 13px;
        font-weight: 800;
      }

      .html-connection-node span {
        font-size: 11px;
        color: var(--app-text-soft, var(--app-text));
      }
    `],
  }),
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      expect(canvasElement.querySelector('[data-flow-node-id="source-1"] .flow-node-overlay__port--out')).toBeTruthy();
      expect(canvasElement.querySelector('[data-flow-node-id="target-1"] .flow-node-overlay__port--in')).toBeTruthy();
      expect(canvasElement.querySelector('svg [port="out"]')).toBeTruthy();
      expect(canvasElement.querySelector('svg [port="in"]')).toBeTruthy();
    });

    const sourcePort = canvasElement.querySelector('[data-flow-node-id="source-1"] .flow-node-overlay__port--out') as HTMLElement;
    const targetPort = canvasElement.querySelector('[data-flow-node-id="target-1"] .flow-node-overlay__port--in') as HTMLElement;
    const sourceRect = sourcePort.getBoundingClientRect();
    const targetRect = targetPort.getBoundingClientRect();
    const sourceX = sourceRect.left + sourceRect.width / 2;
    const sourceY = sourceRect.top + sourceRect.height / 2;
    const targetX = targetRect.left + targetRect.width / 2;
    const targetY = targetRect.top + targetRect.height / 2;

    sourcePort.dispatchEvent(new PointerEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      button: 0,
      buttons: 1,
      clientX: sourceX,
      clientY: sourceY,
      pointerId: 1,
      pointerType: 'mouse',
    }));

    await nextAnimationFrame();

    targetPort.dispatchEvent(new PointerEvent('pointermove', {
      bubbles: true,
      cancelable: true,
      button: 0,
      buttons: 1,
      clientX: targetX,
      clientY: targetY,
      pointerId: 1,
      pointerType: 'mouse',
    }));
    targetPort.dispatchEvent(new PointerEvent('pointerup', {
      bubbles: true,
      cancelable: true,
      button: 0,
      buttons: 0,
      clientX: targetX,
      clientY: targetY,
      pointerId: 1,
      pointerType: 'mouse',
    }));

    await waitFor(() => {
      expect(canvasElement.querySelectorAll('.joint-link').length).toBeGreaterThan(0);
    });
  },
};

export const AIAgentWorkflow: Story = {
  args: {
    value: agentFlowDefinition,
    nodeTypes: agentNodeTypes,
    mode: 'edit',
    autoLayout: true,
    fitOnLoad: true,
    toolbar: fullToolbar,
  },
};

/**
 * Rule Trace — readonly mode with pass/fail status colors.
 */
export const RuleTrace: Story = {
  args: {
    value: {
      id: 'trace-demo',
      version: 1,
      readonly: true,
      nodes: [
        { id: 't1', type: 'rule-group', label: 'AND', data: { operator: 'AND', badge: 'true' }, status: 'success' },
        { id: 't2', type: 'rule-condition', label: 'CROSSOVER', data: { operator: 'CROSSOVER', badge: '142.5' }, status: 'success' },
        { id: 't3', type: 'rule-condition', label: 'GT', data: { operator: 'GT', badge: '72.3' }, status: 'success' },
        { id: 't4', type: 'rule-ref', label: 'Rule: VOL_FILTER', data: { ruleCode: 'VOL_FILTER', badge: 'true' }, status: 'success' },
        { id: 't5', type: 'rule-not', label: 'NOT', data: { badge: 'true' }, status: 'success' },
        { id: 't6', type: 'rule-condition', label: 'LT', data: { operator: 'LT', badge: null }, status: 'danger' },
      ],
      edges: [
        { id: 'te1', source: { nodeId: 't1', portId: 'out' }, target: { nodeId: 't2', portId: 'in' } },
        { id: 'te2', source: { nodeId: 't1', portId: 'out' }, target: { nodeId: 't3', portId: 'in' } },
        { id: 'te3', source: { nodeId: 't1', portId: 'out' }, target: { nodeId: 't4', portId: 'in' } },
        { id: 'te4', source: { nodeId: 't1', portId: 'out' }, target: { nodeId: 't5', portId: 'in' } },
        { id: 'te5', source: { nodeId: 't5', portId: 'out' }, target: { nodeId: 't6', portId: 'in' } },
      ],
    } as FlowDefinition,
    nodeTypes: ruleNodeTypes,
    mode: 'trace',
    autoLayout: true,
    fitOnLoad: true,
    toolbar: { visible: false },
  },
};

/**
 * Empty canvas — edit mode, ready for user to build.
 */
export const EmptyCanvas: Story = {
  args: {
    value: { id: 'empty', version: 1, nodes: [], edges: [] },
    nodeTypes: agentNodeTypes,
    mode: 'edit',
    autoLayout: true,
    toolbar: fullToolbar,
  },
};

/**
 * Large graph — 50 conditions for performance testing.
 */
export const LargeGraph: Story = {
  args: {
    value: generateLargeGraph(50),
    nodeTypes: ruleNodeTypes,
    mode: 'edit',
    autoLayout: true,
    fitOnLoad: true,
    toolbar: fullToolbar,
  },
};

// ============================================================
// Helpers
// ============================================================

function generateLargeGraph(count: number): FlowDefinition {
  const nodes: FlowDefinition['nodes'] = [
    { id: 'root', type: 'rule-group', label: 'AND', data: { operator: 'AND' } },
  ];
  const edges: FlowDefinition['edges'] = [];

  for (let i = 0; i < count; i++) {
    const cId = `c-${i}`;
    const o1 = `o-${i}-0`;
    const o2 = `o-${i}-1`;
    const ops = ['GT', 'LT', 'CROSSOVER', 'CROSSUNDER', 'GTE', 'LTE', 'EQ', 'NEQ'];

    nodes.push(
      { id: cId, type: 'rule-condition', label: ops[i % ops.length], data: { operator: ops[i % ops.length] } },
      { id: o1, type: 'rule-operand', label: `IND_${i}`, data: { label: `IND_${i}` } },
      { id: o2, type: 'rule-operand', label: `${(i + 1) * 10}`, data: { label: `${(i + 1) * 10}` } },
    );

    edges.push(
      { id: `e-root-${cId}`, source: { nodeId: 'root', portId: 'out' }, target: { nodeId: cId, portId: 'in' } },
      { id: `e-${cId}-${o1}`, source: { nodeId: cId, portId: 'out' }, target: { nodeId: o1, portId: 'in' }, data: { kind: 'operand' } },
      { id: `e-${cId}-${o2}`, source: { nodeId: cId, portId: 'out' }, target: { nodeId: o2, portId: 'in' }, data: { kind: 'operand' } },
    );
  }

  return { id: 'large-flow', version: 1, nodes, edges };
}

function nextAnimationFrame(): Promise<void> {
  return new Promise(resolve => requestAnimationFrame(() => resolve()));
}
