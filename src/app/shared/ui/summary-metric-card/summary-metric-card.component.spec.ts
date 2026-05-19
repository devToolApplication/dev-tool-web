import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '../../shared.module';
import { provideSharedTesting } from '../../testing/shared-test.providers';
import { SummaryMetricCardComponent } from './summary-metric-card.component';

describe('SummaryMetricCardComponent', () => {
  let fixture: ComponentFixture<SummaryMetricCardComponent>;
  let component: SummaryMetricCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: provideSharedTesting()
    }).compileComponents();

    fixture = TestBed.createComponent(SummaryMetricCardComponent);
    component = fixture.componentInstance;
    component.label = 'Metric';
  });

  it('renders label, value, prefix, suffix and generic trend', () => {
    component.value = 42;
    component.prefix = '$';
    component.suffix = 'k';
    component.trend = '+5%';
    component.trendVariant = 'success';
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Metric');
    expect(text).toContain('$42k');
    expect(text).toContain('+5%');
    expect(fixture.nativeElement.querySelector('.app-badge--success')).toBeTruthy();
  });

  it('renders loading state', () => {
    component.loading = true;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-loading-skeleton')).toBeTruthy();
  });

  it('renders empty fallback and error state', () => {
    component.value = null;
    component.emptyValue = 'No value';
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No value');

    fixture.destroy();
    fixture = TestBed.createComponent(SummaryMetricCardComponent);
    component = fixture.componentInstance;
    component.label = 'Metric';
    component.error = 'Load failed';
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-error-state')).toBeTruthy();
  });
});
