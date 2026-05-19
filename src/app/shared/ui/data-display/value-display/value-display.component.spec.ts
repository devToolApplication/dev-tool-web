import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '../../../shared.module';
import { provideSharedTesting } from '../../../testing/shared-test.providers';
import { ValueDisplayComponent } from './value-display.component';

describe('ValueDisplayComponent', () => {
  let fixture: ComponentFixture<ValueDisplayComponent>;
  let component: ValueDisplayComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: provideSharedTesting()
    }).compileComponents();

    fixture = TestBed.createComponent(ValueDisplayComponent);
    component = fixture.componentInstance;
  });

  it('renders value with prefix, suffix and empty fallback', () => {
    render({ type: 'number', prefix: '$', suffix: ' USD', value: 1234 });

    expect(fixture.nativeElement.textContent).toContain('$1,234 USD');

    render({ type: 'number', value: null });
    expect(fixture.nativeElement.textContent).toContain('-');
  });

  it('formats currency and percent generically', () => {
    render({ type: 'currency', value: 12.5 });
    expect(fixture.nativeElement.textContent).toContain('$12.50');

    render({ type: 'percent', value: 0.125 });
    expect(fixture.nativeElement.textContent).toContain('12.5%');
  });

  it('renders semantic badge without domain mapping', () => {
    component.type = 'badge';
    component.value = 'READY';
    component.variant = 'info';
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('READY');
    expect(fixture.nativeElement.querySelector('.app-badge--info')).toBeTruthy();
  });

  function render(inputs: Partial<ValueDisplayComponent>): void {
    fixture.destroy();
    fixture = TestBed.createComponent(ValueDisplayComponent);
    component = fixture.componentInstance;
    Object.assign(component, inputs);
    fixture.detectChanges();
  }
});
