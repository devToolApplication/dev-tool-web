import type { FormConfig } from '../../../form-input/models/form-config.model';
import type { FlowNode } from '../../models';
import {
  createFlowInspectorNodePatch,
  extractFlowInspectorFieldPaths,
  flowInspectorFieldSignature,
  flowNodeToInspectorFormValue,
  resolveFlowInspectorFormContext,
} from './flow-inspector-form.utils';

describe('flow inspector form utils', () => {
  it('extracts leaf field paths and respects flat groups', () => {
    const config: FormConfig = {
      fields: [
        { name: 'operator', type: 'select', label: 'Operator' },
        {
          name: 'node',
          type: 'group',
          label: 'Node',
          children: [{ name: 'disabled', type: 'boolean', label: 'Disabled' }],
        },
        {
          name: 'params',
          type: 'group',
          label: 'Params',
          flat: true,
          children: [{ name: 'lookback', type: 'number', label: 'Lookback' }],
        },
      ],
    };

    expect(extractFlowInspectorFieldPaths(config)).toEqual([
      'operator',
      'node.disabled',
      'lookback',
    ]);
  });

  it('builds the form initial value from node data and supported node metadata', () => {
    const node: FlowNode = {
      id: 'n1',
      type: 'rule-condition',
      label: 'Condition',
      status: 'warning',
      disabled: true,
      data: { operator: 'GT' },
    };

    expect(flowNodeToInspectorFormValue(node)).toEqual({
      operator: 'GT',
      data: { operator: 'GT' },
      node: {
        label: 'Condition',
        status: 'warning',
        disabled: true,
        readonly: false,
      },
    });
  });

  it('maps default fields to node.data and node.* fields to top-level node keys', () => {
    const node: FlowNode = {
      id: 'n1',
      type: 'rule-condition',
      label: 'Old label',
      data: { operator: 'GT', params: { lookback: 1 } },
    };

    const patch = createFlowInspectorNodePatch(node, {
      operator: 'LTE',
      params: { lookback: 5 },
      node: { label: 'New label', disabled: true },
    }, ['operator', 'params.lookback', 'node.label', 'node.disabled']);

    expect(patch).toEqual({
      label: 'New label',
      disabled: true,
      data: {
        operator: 'LTE',
        params: { lookback: 5 },
      },
    });
  });

  it('preserves arrays when writing numeric path segments', () => {
    const node: FlowNode = {
      id: 'n1',
      type: 'rule-condition',
      label: 'Condition',
      data: { operands: [{ type: 'constant', value: 1 }] },
    };

    const patch = createFlowInspectorNodePatch(node, {
      operands: [{ type: 'constant', value: 2 }],
    }, ['operands.0.value']);

    expect(patch.data).toEqual({
      operands: [{ type: 'constant', value: 2 }],
    });
  });

  it('uses configured field values for stable signatures', () => {
    const paths = ['operator'];
    const fromForm = {
      operator: 'GT',
      data: { operator: 'OLD' },
    };
    const fromNode = {
      operator: 'GT',
      data: { operator: 'GT' },
    };

    expect(flowInspectorFieldSignature(fromForm, paths)).toBe(flowInspectorFieldSignature(fromNode, paths));
  });

  it('forces view mode when the flow inspector is readonly', () => {
    expect(resolveFlowInspectorFormContext({ user: 'u1', mode: 'edit' }, true)).toEqual({
      user: 'u1',
      mode: 'view',
    });
  });
});
