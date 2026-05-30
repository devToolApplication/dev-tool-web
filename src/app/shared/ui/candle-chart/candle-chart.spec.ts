import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, Pipe, PipeTransform } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';

import { SharedModule } from '../../shared.module';
import { provideSharedTesting } from '../../testing/shared-test.providers';

import { CandleChart } from './candle-chart';
import { CandleChartHeaderComponent } from './components/candle-chart-header/candle-chart-header.component';
import { CandleChartReplayControlsComponent } from './components/candle-chart-replay-controls/candle-chart-replay-controls.component';
import { CandleChartStateOverlayComponent } from './components/candle-chart-state-overlay/candle-chart-state-overlay.component';
import { CandleChartToolbarComponent } from './components/candle-chart-toolbar/candle-chart-toolbar.component';
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
  getVisibleLogicalRange: vi.fn(() => ({ from: 0, to: 10 })),
  scrollToRealTime: vi.fn(),
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
  AreaSeries: { type: 'Area' },
  LineSeries: { type: 'Line' },
  ColorType: { Solid: 'solid' },
  CrosshairMode: { Normal: 0 },
  LineStyle: { Solid: 0, Dotted: 1, Dashed: 2 },
}));

@Pipe({ name: 'translateContent', standalone: false })
class TranslateContentPipeStub implements PipeTransform {
  transform(value: unknown): unknown {
    return value;
  }
}

@Component({ selector: 'app-button', standalone: false, template: '' })
class ButtonStubComponent {
  @Input() label?: string;
  @Input() icon?: string;
  @Input() styleClass?: string;
  @Input() tooltip?: string;
  @Output() readonly buttonClick = new EventEmitter<void>();
}

@Component({ selector: 'p-select', standalone: false, template: '' })
class SelectStubComponent {
  @Input() options: unknown[] = [];
  @Input() optionLabel?: string;
  @Input() optionValue?: string;
  @Input() ngModel: unknown;
  @Output() readonly ngModelChange = new EventEmitter<unknown>();
}

@Component({ selector: 'p-slider', standalone: false, template: '' })
class SliderStubComponent {
  @Input() min = 0;
  @Input() max = 0;
  @Input() ngModel: unknown;
  @Output() readonly ngModelChange = new EventEmitter<unknown>();
}

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

  it('should emit commands instead of moving index in controlled replay mode', async () => {
    const replayCommand = vi.fn();
    component.replayCommand.subscribe(replayCommand);
    fixture.componentRef.setInput('mode', 'REPLAY');
    fixture.componentRef.setInput('controlledReplay', true);
    fixture.componentRef.setInput('candles', [
      { index: 0, time: '09:00', open: 1, high: 2, low: 0.5, close: 1.5 },
      { index: 1, time: '10:00', open: 1.5, high: 3, low: 1, close: 2.5 },
    ]);
    fixture.componentRef.setInput('replayConfig', { initialIndex: 0, speedMs: 650 });
    fixture.componentRef.setInput('replayState', { index: 0, status: 'READY', speedMs: 650 });

    fixture.detectChanges();
    await fixture.whenStable();
    component.replayNext();

    expect(component.currentIndex).toBe(0);
    expect(replayCommand).toHaveBeenCalledWith({ type: 'NEXT', index: 1 });

    fixture.componentRef.setInput('replayState', { index: 1, status: 'PLAYING', speedMs: 650 });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.currentIndex).toBe(1);
  });
});

describe('CandleChart template controls', () => {
  let fixture: ComponentFixture<CandleChart>;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      declarations: [
        CandleChart,
        CandleChartHeaderComponent,
        CandleChartReplayControlsComponent,
        CandleChartStateOverlayComponent,
        CandleChartToolbarComponent,
        ButtonStubComponent,
        SelectStubComponent,
        SliderStubComponent,
        TranslateContentPipeStub,
      ],
      imports: [CommonModule],
    });
    TestBed.overrideComponent(CandleChart, {
      set: {
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
  });

  it('renders replay controls through shared and Prime controls', async () => {
    fixture.componentRef.setInput('mode', 'REPLAY');
    fixture.componentRef.setInput('candles', [
      { index: 0, time: '09:00', open: 1, high: 2, low: 0.5, close: 1.5 },
      { index: 1, time: '10:00', open: 1.5, high: 3, low: 1, close: 2.5 },
    ]);
    fixture.componentRef.setInput('replayConfig', { initialIndex: 0, speedMs: 650 });

    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.debugElement.queryAll(By.css('app-button')).length).toBeGreaterThan(0);
    expect(fixture.debugElement.query(By.css('p-select'))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('p-slider'))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('select'))).toBeNull();
    expect(fixture.debugElement.query(By.css('input[type="range"]'))).toBeNull();
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
