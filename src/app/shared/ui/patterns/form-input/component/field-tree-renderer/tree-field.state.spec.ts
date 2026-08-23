import { TreeFormNode } from '../../models/form-config.model';
import {
  buildVisibleTreeNodes,
  normalizeJsonTreeNodes,
  replaceTreeNode,
  treeNodeSelectionState,
  updateTreeNodeSelection,
} from './tree-field.state';

describe('tree-field.state', () => {
  const nodes: TreeFormNode[] = [
    {
      id: 'root',
      label: 'Root',
      value: {},
      children: [
        {
          id: 'child-view',
          label: 'View',
          code: 'CHILD_VIEW',
          value: { code: 'VIEW' },
          checked: true,
        },
        {
          id: 'child-edit',
          label: 'Edit',
          value: { code: 'EDIT' },
        },
      ],
    },
  ];

  it('filters by search text while preserving parent context', () => {
    const visible = buildVisibleTreeNodes(nodes, 'child_view', 'all', 'parentAndChildren');

    expect(visible).toHaveLength(1);
    expect(visible[0].node.id).toBe('root');
    expect(visible[0].forceExpanded).toBe(true);
    expect(visible[0].children.map((child) => child.node.id)).toEqual(['child-view']);
  });

  it('keeps tri-state selection rules pure', () => {
    expect(treeNodeSelectionState(nodes[0], 'parentAndChildren')).toMatchObject({
      checked: false,
      indeterminate: true,
    });

    const selected = updateTreeNodeSelection(nodes, 'root', true, 'parentAndChildren');

    expect(selected[0].checked).toBe(true);
    expect(selected[0].children?.map((child) => child.checked)).toEqual([true, true]);
  });

  it('preserves existing children on replace unless the replacement forbids children', () => {
    const replacement: TreeFormNode = {
      id: 'next',
      label: 'Next',
      value: {},
      children: [],
    };
    const preserved = replaceTreeNode(nodes, 'root', replacement, 'keep-children');

    expect(preserved[0].children?.map((child) => child.id)).toEqual(['child-view', 'child-edit']);

    const dropped = replaceTreeNode(
      nodes,
      'root',
      { ...replacement, data: { allowChildren: false } },
      'keep-children',
    );

    expect(dropped[0].children).toEqual([]);
  });

  it('normalizes editable JSON without depending on crypto in tests', () => {
    const normalized = normalizeJsonTreeNodes(
      [{ value: { code: 'FROM_VALUE' }, children: [{ label: 'Child' }] }],
      () => 'generated-id',
    );

    expect(normalized).toEqual([
      expect.objectContaining({
        id: 'generated-id',
        label: 'FROM_VALUE',
        children: [expect.objectContaining({ id: 'generated-id', label: 'Child' })],
      }),
    ]);
    expect(normalizeJsonTreeNodes([{ children: [] }], () => 'unused')).toBeNull();
  });
});
