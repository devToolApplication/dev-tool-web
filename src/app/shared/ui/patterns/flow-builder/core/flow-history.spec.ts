import { FlowDefinition } from '../models';
import { FlowHistory } from './flow-history';

describe('FlowHistory', () => {
  const base: FlowDefinition = {
    id: 'flow',
    version: 1,
    nodes: [{ id: 'a', type: 'node' }],
    edges: [],
  };

  it('undoes and redoes committed flow snapshots', () => {
    const history = new FlowHistory();
    history.reset(base);

    history.commit({
      ...base,
      nodes: [...base.nodes, { id: 'b', type: 'node' }],
    });

    expect(history.canUndo()).toBe(true);
    expect(history.undo()?.nodes.map(node => node.id)).toEqual(['a']);
    expect(history.canRedo()).toBe(true);
    expect(history.redo()?.nodes.map(node => node.id)).toEqual(['a', 'b']);
  });

  it('does not create duplicate history entries for equal snapshots', () => {
    const history = new FlowHistory();
    history.reset(base);

    history.commit({ ...base, nodes: [{ id: 'a', type: 'node' }] });

    expect(history.canUndo()).toBe(false);
  });
});
