import { convertToParamMap } from '@angular/router';

import type { KocCampaignSummary } from './koc-campaign.model';
import {
  buildKocCampaignRowActions,
  buildKocCampaignTableConfig,
  parseKocCampaignListQuery,
  serializeKocCampaignListQuery,
} from './koc-campaign-list.config';

function campaign(status: KocCampaignSummary['status']): KocCampaignSummary {
  return {
    campaignId: `campaign-${status}`,
    name: `Campaign ${status}`,
    code: status,
    status,
    acceptedTarget: 10,
    counters: {
      discovered: 20,
      unique: 18,
      screened: 12,
      rejected: 2,
      review: 1,
      accepted: 6,
      waiting: 3,
    },
  };
}

describe('KOC campaign list config', () => {
  it('builds the required Phase 2 table columns', () => {
    const config = buildKocCampaignTableConfig([]);

    expect(config.rowClickable).toBe(true);
    expect(config.columns.map((column) => column.field)).toEqual([
      'campaign',
      'status',
      'progress',
      'discovered',
      'screened',
      'waiting',
      'lastActivityAt',
      'actions',
    ]);
  });

  it('keeps open as primary and lifecycle actions in the row menu', () => {
    const actions = buildKocCampaignRowActions();
    const byId = Object.fromEntries(actions.map((action) => [action.id, action]));

    expect(byId['open']?.placement).toBe('primary');
    expect(['edit', 'start', 'pause', 'resume', 'clone', 'stop'].map((id) => byId[id]?.placement)).toEqual([
      'more',
      'more',
      'more',
      'more',
      'more',
      'more',
    ]);

    expect(byId['edit']?.visible?.(campaign('DRAFT'))).toBe(true);
    expect(byId['edit']?.visible?.(campaign('READY'))).toBe(true);
    expect(byId['edit']?.visible?.(campaign('RUNNING'))).toBe(false);
    expect(byId['edit']?.visible?.(campaign('PAUSED'))).toBe(false);
    expect(byId['edit']?.visible?.(campaign('COMPLETED'))).toBe(false);
    expect(byId['edit']?.visible?.(campaign('STOPPED'))).toBe(false);

    expect(byId['start']?.visible?.(campaign('DRAFT'))).toBe(true);
    expect(byId['start']?.visible?.(campaign('READY'))).toBe(true);
    expect(byId['start']?.visible?.(campaign('RUNNING'))).toBe(false);
    expect(byId['start']?.visible?.(campaign('PAUSED'))).toBe(false);

    expect(byId['pause']?.visible?.(campaign('RUNNING'))).toBe(true);
    expect(byId['pause']?.visible?.(campaign('PAUSED'))).toBe(false);

    expect(byId['resume']?.visible?.(campaign('PAUSED'))).toBe(true);
    expect(byId['resume']?.visible?.(campaign('RUNNING'))).toBe(false);

    expect(byId['clone']?.visible?.(campaign('RUNNING')) ?? true).toBe(true);

    expect(byId['stop']?.visible?.(campaign('READY'))).toBe(true);
    expect(byId['stop']?.visible?.(campaign('RUNNING'))).toBe(true);
    expect(byId['stop']?.visible?.(campaign('PAUSED'))).toBe(true);
    expect(byId['stop']?.visible?.(campaign('BLOCKED'))).toBe(true);
    expect(byId['stop']?.visible?.(campaign('DRAFT'))).toBe(false);
    expect(byId['stop']?.visible?.(campaign('COMPLETED'))).toBe(false);
    expect(byId['stop']?.visible?.(campaign('STOPPED'))).toBe(false);
  });

  it('parses and serializes URL query values without empty filters', () => {
    expect(parseKocCampaignListQuery(convertToParamMap({
      search: 'summer',
      status: 'RUNNING',
      page: '2',
      size: '25',
    }))).toEqual({
      search: 'summer',
      status: 'RUNNING',
      page: 2,
      size: 25,
    });

    expect(serializeKocCampaignListQuery({
      search: '  ',
      status: undefined,
      page: 0,
      size: 20,
    })).toEqual({ page: 0, size: 20 });
  });

  it('omits campaign editor creation entry point from the table toolbar', () => {
    const config = buildKocCampaignTableConfig();

    expect(config.toolbar?.new).toBeUndefined();
    expect(config.toolbar?.search).toBeDefined();
  });
});
