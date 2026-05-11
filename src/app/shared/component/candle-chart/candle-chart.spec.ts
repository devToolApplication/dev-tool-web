import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { SharedModule } from '../../shared.module';
import { provideSharedTesting } from '../../testing/shared-test.providers';

import { CandleChart } from './candle-chart';
import { CandleChartEngineService, type CandleChartEngineRenderInput } from './candle-chart-engine.service';
import { CandleChartLegacyAdapter } from './candle-chart-legacy-adapter.service';
import { CandleChartRealtimeService } from './candle-chart-realtime.service';
import { CandleChartReplayService } from './candle-chart-replay.service';
import { CandleChartStoreService } from './candle-chart-store.service';
import { CandleChartTimeUtil } from './candle-chart-time.util';

const addSeries = vi.fn(() => ({
  setData: vi.fn(),
  update: vi.fn(),
  applyOptions: vi.fn(),
  createPriceLine: vi.fn(() => ({ id: 'line' })),
  removePriceLine: vi.fn(),
  priceToCoordinate: vi.fn(() => 120),
  priceScale: vi.fn(() => ({ applyOptions: vi.fn() })),
}));

const timeScale = {
  fitContent: vi.fn(),
  setVisibleLogicalRange: vi.fn(),
  timeToCoordinate: vi.fn(() => 40),
  subscribeVisibleLogicalRangeChange: vi.fn(),
  unsubscribeVisibleLogicalRangeChange: vi.fn(),
};

vi.mock('lightweight-charts', () => ({
  createChart: vi.fn(() => ({
    addSeries,
    applyOptions: vi.fn(),
    removeSeries: vi.fn(),
    remove: vi.fn(),
    resize: vi.fn(),
    subscribeClick: vi.fn(),
    unsubscribeClick: vi.fn(),
    priceScale: vi.fn(() => ({ applyOptions: vi.fn() })),
    timeScale: vi.fn(() => timeScale),
  })),
  createSeriesMarkers: vi.fn(() => ({
    setMarkers: vi.fn(),
    markers: vi.fn(() => []),
  })),
  CandlestickSeries: { type: 'Candlestick' },
  HistogramSeries: { type: 'Histogram' },
  LineSeries: { type: 'Line' },
  ColorType: { Solid: 'solid' },
  CrosshairMode: { Normal: 0 },
  LineStyle: { Solid: 0, Dotted: 1, Dashed: 2 },
}));

class MockCandleChartEngineService {
  initialize = vi.fn(
    (
      _hostElement: HTMLDivElement,
      input: CandleChartEngineRenderInput,
      renderState: Parameters<CandleChartEngineService['initialize']>[2],
    ) => {
      renderState({
        latestCandle: input.candles.at(-1) ?? null,
        renderedBoxAreas: [],
        renderedLineLabels: [],
      });
      return Promise.resolve();
    },
  );
  render = vi.fn();
  resize = vi.fn();
  destroy = vi.fn();
  refreshTheme = vi.fn();
}

describe('CandleChart', () => {
  let component: CandleChart;
  let fixture: ComponentFixture<CandleChart>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: provideSharedTesting(),
    });
    TestBed.overrideComponent(CandleChart, {
      set: {
        template: '<div #chartRef></div>',
        providers: [
          { provide: CandleChartEngineService, useClass: MockCandleChartEngineService },
          CandleChartLegacyAdapter,
          CandleChartRealtimeService,
          CandleChartReplayService,
          CandleChartStoreService,
          CandleChartTimeUtil,
        ],
      },
    });
    await TestBed.compileComponents();

    fixture = TestBed.createComponent(CandleChart);
    component = fixture.componentInstance;
  });

  it('should create', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component).toBeTruthy();
  });

  it('should render replay candles and move current index', async () => {
    fixture.componentRef.setInput('mode', 'REPLAY');
    fixture.componentRef.setInput('candles', [
      { index: 0, time: '09:00', open: 1, high: 2, low: 0.5, close: 1.5 },
      { index: 1, time: '10:00', open: 1.5, high: 3, low: 1, close: 2.5 },
    ]);
    fixture.componentRef.setInput('replayConfig', { initialIndex: 0, speedMs: 650 });

    fixture.detectChanges();
    await fixture.whenStable();
    component.replayNext();

    expect(component.currentIndex).toBe(1);
  });
});

describe('CandleChartTimeUtil', () => {
  const util = new CandleChartTimeUtil();

  it('should normalize seconds, milliseconds and strings', () => {
    expect(util.toUnixSeconds(1_700_000_000)).toBe(1_700_000_000);
    expect(util.toUnixSeconds(1_700_000_000_000)).toBe(1_700_000_000);
    expect(util.toUnixSeconds('2000-01-01T00:01:00Z')).toBe(946684860);
  });
});

describe('CandleChartStoreService', () => {
  it('should keep replay visible candles up to current index', () => {
    const store = new CandleChartStoreService();
    store.configure(
      'REPLAY',
      [
        { time: '09:00', open: 1, high: 2, low: 1, close: 2 },
        { time: '10:00', open: 2, high: 3, low: 2, close: 3 },
      ],
      [],
      [],
      { initialIndex: 0 },
      true,
    );
    store.setCurrentIndex(1);

    expect(store.visibleCandles().length).toBe(2);
  });
});

describe('CandleChartReplayService', () => {
  it('should resolve next and ended states', () => {
    const replay = new CandleChartReplayService();

    expect(replay.next(0, 2, {}).index).toBe(1);
    expect(replay.next(1, 2, {}).status).toBe('ENDED');
  });
});

describe('CandleChartRealtimeService', () => {
  it('should parse candle and overlay realtime messages', () => {
    const realtime = new CandleChartRealtimeService();

    expect(
      realtime.parseMessage(JSON.stringify({ type: 'CANDLE', candle: { time: 1, open: 1, high: 2, low: 1, close: 2 } }))
        .type,
    ).toBe('CANDLE');
    expect(realtime.parseMessage(JSON.stringify({ type: 'OVERLAY', overlays: [{ type: 'MARKER' }] })).type).toBe(
      'OVERLAY',
    );
  });
});
