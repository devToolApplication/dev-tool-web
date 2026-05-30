import { FLOW_PAPER_OPTIONS } from './joint-flow-paper-options';

describe('FLOW_PAPER_OPTIONS', () => {
  it('snaps dragged links by coordinate so HTML overlay ports can connect to SVG magnets', () => {
    expect(FLOW_PAPER_OPTIONS.snapLinks).toEqual({ radius: 48 });
  });
});
