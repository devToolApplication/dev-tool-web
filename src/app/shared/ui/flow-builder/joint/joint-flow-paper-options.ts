import * as joint from '@joint/core';

export const FLOW_PAPER_OPTIONS: Partial<joint.dia.Paper.Options> = {
  width: '100%',
  height: '100%',
  gridSize: 10,
  drawGrid: { name: 'dot', args: { color: 'var(--app-border, #e2e8f0)' } },
  background: { color: 'var(--app-surface-soft, #f8fafc)' },
  defaultConnector: { name: 'rounded', args: { radius: 8 } },
  defaultRouter: { name: 'manhattan', args: { step: 20 } },
  async: true,
  sorting: joint.dia.Paper.sorting.APPROX,
  snapLinks: { radius: 48 },
  preventDefaultBlankAction: false,
};
