import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { SharedModule } from '../../shared.module';
import { provideSharedTesting } from '../../testing/shared-test.providers';

import { CandleChart } from './candle-chart';

vi.mock('echarts', () => ({
  init: vi.fn(() => ({
    dispose: vi.fn(),
    resize: vi.fn(),
    setOption: vi.fn()
  }))
}));

describe('CandleChart', () => {
  let component: CandleChart;
  let fixture: ComponentFixture<CandleChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: provideSharedTesting()
    }).compileComponents();

    fixture = TestBed.createComponent(CandleChart);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
