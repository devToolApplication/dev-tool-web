import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { CandleChartOverlayMapper } from '../../../../../shared/ui/candle-chart/candle-chart-overlay.mapper';
import { TradingSystemService } from '../../data-access/api/trading-system.service';
import { ConfigPreviewPanelComponent } from './config-preview-panel.component';

describe('ConfigPreviewPanelComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes the default date range rounded to the local hour', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-05T10:34:27.987Z'));

    const component = createComponent();
    const [from, to] = component.dateRange();

    expect(to.toISOString()).toBe('2026-06-05T10:00:00.000Z');
    expect(from.toISOString()).toBe('2026-05-05T10:00:00.000Z');
  });

  it('serializes preview payload without seconds or milliseconds noise', () => {
    const previewIndicator = vi.fn(() => of({ candles: [], indicatorValues: {}, overlays: [] }));
    const component = createComponent({ previewIndicator });

    Object.defineProperty(component, 'previewType', { value: () => 'indicator' });
    Object.defineProperty(component, 'configPayload', { value: () => ({ executor: 'ATR' }) });
    component.dateRange.set([
      new Date('2026-06-05T10:34:27.987Z'),
      new Date('2026-06-05T12:45:59.123Z')
    ]);

    component.runPreview();

    expect(previewIndicator).toHaveBeenCalledWith({
      executor: 'ATR',
      symbol: 'BTCUSDT',
      timeframe: '1h',
      fromTime: '2026-06-05T10:34:00.000Z',
      toTime: '2026-06-05T12:45:00.000Z'
    });
  });
});

function createComponent(serviceOverrides?: Partial<Pick<TradingSystemService, 'previewIndicator' | 'previewRule'>>) {
  const tradingSystemService = {
    previewIndicator: () => of({ candles: [], indicatorValues: {}, overlays: [] }),
    previewRule: () => of({ candles: [], ruleResults: [], overlays: [] }),
    ...serviceOverrides
  } as unknown as TradingSystemService;

  const overlayMapper = {
    resolveIndicatorMetaPublic: () => ({ pane: 'MAIN', type: 'LINE', color: '#000000' })
  } as unknown as CandleChartOverlayMapper;

  return TestBed.runInInjectionContext(
    () => new ConfigPreviewPanelComponent(tradingSystemService, overlayMapper)
  );
}
