import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CandleChart } from './candle-chart';

describe('CandleChart', () => {
  let component: CandleChart;
  let fixture: ComponentFixture<CandleChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CandleChart],
    }).compileComponents();

    fixture = TestBed.createComponent(CandleChart);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
