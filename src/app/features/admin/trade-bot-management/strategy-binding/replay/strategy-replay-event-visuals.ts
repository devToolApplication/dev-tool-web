import {
  ReplayTradeTimelineItem,
  StrategyReplayEventType,
} from '../../../../../core/models/trade-bot/strategy-replay.model';
import { REPLAY_EVENT_TYPE_OPTIONS } from '../shared/strategy-ui.enums';

export type ReplayLegendMarkerShape = 'circle' | 'square' | 'arrow-up' | 'arrow-down';
export type ReplayChartMarkerShape = 'circle' | 'square' | 'arrowUp' | 'arrowDown';

export interface ReplayEventLegendItem {
  type: StrategyReplayEventType;
  label: string;
  color: string;
  shape: ReplayLegendMarkerShape;
}

interface ReplayEventVisual {
  color: string;
  shape: ReplayLegendMarkerShape;
  chartShape: ReplayChartMarkerShape;
  size: number;
}

const EVENT_LABELS = new Map(
  REPLAY_EVENT_TYPE_OPTIONS.map((option) => [
    option.value as StrategyReplayEventType,
    String(option.label),
  ]),
);

const EVENT_VISUALS: Record<StrategyReplayEventType, ReplayEventVisual> = {
  'setup-formed': {
    color: 'var(--app-chart-warning)',
    shape: 'square',
    chartShape: 'square',
    size: 1.2,
  },
  'condition-matched': {
    color: 'var(--app-chart-violet)',
    shape: 'circle',
    chartShape: 'circle',
    size: 1.1,
  },
  'order-placed': {
    color: 'var(--app-chart-primary)',
    shape: 'arrow-up',
    chartShape: 'arrowUp',
    size: 1.45,
  },
  'sl-hit': {
    color: 'var(--app-chart-danger)',
    shape: 'arrow-down',
    chartShape: 'arrowDown',
    size: 1.45,
  },
  'tp-hit': {
    color: 'var(--app-chart-success)',
    shape: 'arrow-up',
    chartShape: 'arrowUp',
    size: 1.45,
  },
  'trade-closed': {
    color: 'var(--app-chart-muted)',
    shape: 'square',
    chartShape: 'square',
    size: 1.25,
  },
  'session-started': {
    color: 'var(--app-chart-info)',
    shape: 'circle',
    chartShape: 'circle',
    size: 1.05,
  },
  'session-ended': {
    color: 'var(--app-chart-muted)',
    shape: 'square',
    chartShape: 'square',
    size: 1.05,
  },
  'rule-pass': {
    color: 'var(--app-chart-success)',
    shape: 'circle',
    chartShape: 'circle',
    size: 1.05,
  },
  'rule-fail': {
    color: 'var(--app-chart-danger)',
    shape: 'circle',
    chartShape: 'circle',
    size: 1.05,
  },
};

export const REPLAY_EVENT_LEGEND_ITEMS: ReplayEventLegendItem[] = REPLAY_EVENT_TYPE_OPTIONS.map(
  (option) => {
    const type = option.value as StrategyReplayEventType;
    const visual = EVENT_VISUALS[type];
    return {
      type,
      label: String(option.label),
      color: visual.color,
      shape: visual.shape,
    };
  },
);

export function replayEventLabel(type: StrategyReplayEventType): string {
  return EVENT_LABELS.get(type) ?? type;
}

export function replayEventColor(type: StrategyReplayEventType): string {
  return EVENT_VISUALS[type]?.color ?? 'var(--app-chart-muted)';
}

export function replayEventChartShape(
  type: StrategyReplayEventType,
  tradeSide?: ReplayTradeTimelineItem['side'],
): ReplayChartMarkerShape {
  if (type === 'order-placed' && tradeSide === 'SELL') {
    return 'arrowDown';
  }
  return EVENT_VISUALS[type]?.chartShape ?? 'circle';
}

export function replayEventMarkerSize(type: StrategyReplayEventType): number {
  return EVENT_VISUALS[type]?.size ?? 1.05;
}

export function replayEventMarkerClasses(type: StrategyReplayEventType): string[] {
  const shape = EVENT_VISUALS[type]?.shape ?? 'circle';
  return [`backtest-event-marker--${type}`, `backtest-event-marker--shape-${shape}`];
}
