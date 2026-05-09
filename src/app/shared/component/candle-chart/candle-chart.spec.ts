import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { SharedModule } from '../../shared.module';
import { provideSharedTesting } from '../../testing/shared-test.providers';

import { CandleChart } from './candle-chart';

const addSeries = vi.fn(() => ({
  setData: vi.fn(),
  applyOptions: vi.fn(),
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

describe('CandleChart', () => {
  let component: CandleChart;
  let fixture: ComponentFixture<CandleChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: provideSharedTesting(),
    }).compileComponents();

    fixture = TestBed.createComponent(CandleChart);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
