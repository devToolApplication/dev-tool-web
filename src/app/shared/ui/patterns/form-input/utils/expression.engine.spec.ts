import { TreeFormNode } from '../models/form-config.model';
import { ExpressionEngine, formValidationHelpers } from './expression.engine';

describe('formValidationHelpers', () => {
  const tree: TreeFormNode[] = [
    {
      id: 'root',
      label: 'Root',
      value: { code: 'ROOT' },
      children: [
        {
          id: 'child-a',
          label: 'Child A',
          value: { code: 'DUPLICATE' },
          disabled: true
        },
        {
          id: 'child-b',
          label: 'Child B',
          value: { code: 'DUPLICATE' },
          children: [
            {
              id: 'leaf',
              label: 'Leaf',
              value: { code: 'LEAF' },
              data: { alias: 'target' }
            }
          ]
        }
      ]
    }
  ];

  it('flattens and counts tree nodes without depending on domain models', () => {
    expect(formValidationHelpers.flattenTree(tree).map((node) => node.id)).toEqual([
      'root',
      'child-a',
      'child-b',
      'leaf'
    ]);
    expect(formValidationHelpers.countTreeNodes(tree)).toBe(4);
    expect(formValidationHelpers.treeDepth(tree)).toBe(3);
  });

  it('handles null, empty and partial tree values safely', () => {
    expect(formValidationHelpers.flattenTree(null)).toEqual([]);
    expect(formValidationHelpers.countTreeNodes(undefined)).toBe(0);
    expect(formValidationHelpers.treeDepth([])).toBe(0);
    expect(
      formValidationHelpers.flattenTree([{ id: 'partial', label: 'Partial', value: null }])
    ).toHaveLength(1);
  });

  it('detects duplicate, disabled and matching nodes through generic helpers', () => {
    expect(formValidationHelpers.hasDuplicate(tree, 'value.code')).toBe(true);
    expect(formValidationHelpers.hasDisabledNode(tree)).toBe(true);
    expect(formValidationHelpers.findTreeNode(tree, (node) => node.data?.['alias'] === 'target')?.id).toBe('leaf');
  });
});

describe('ExpressionEngine tree helper integration', () => {
  it('exposes tree helpers to validation expressions and swallows runtime errors', () => {
    const engine = new ExpressionEngine();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const value: TreeFormNode[] = [
      {
        id: 'root',
        label: 'Root',
        value: 'root'
      }
    ];

    expect(engine.evaluate('helpers.countTreeNodes(value) === 1', { model: {}, context: {}, value })).toBe(true);
    expect(engine.evaluate('helpers.countTreeNodes(value) <= 5', { model: {}, context: {}, value })).toBe(true);
    expect(engine.evaluate('model.missing.call()', { model: {}, context: {}, value })).toBeUndefined();
    expect(consoleError).toHaveBeenCalledWith('[Runtime Error]', expect.any(Object));

    consoleError.mockRestore();
  });
});
