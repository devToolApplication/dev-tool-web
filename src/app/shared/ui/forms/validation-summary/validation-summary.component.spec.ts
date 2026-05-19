import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { SharedModule } from '../../../shared.module';
import { provideSharedTesting } from '../../../testing/shared-test.providers';
import { ValidationSummaryComponent, ValidationSummaryItem } from './validation-summary.component';

describe('ValidationSummaryComponent', () => {
  let fixture: ComponentFixture<ValidationSummaryComponent>;
  let component: ValidationSummaryComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: provideSharedTesting()
    }).compileComponents();

    fixture = TestBed.createComponent(ValidationSummaryComponent);
    component = fixture.componentInstance;
  });

  it('does not render when there are no items', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.validation-summary')).toBeNull();
  });

  it('renders error and warning counts with translated messages', () => {
    component.items = [
      { fieldPath: 'name', label: 'Name', message: 'Name is required' },
      { fieldPath: 'limit', label: 'Limit', message: 'Limit is high', severity: 'warning' }
    ];

    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(component.errorCount).toBe(1);
    expect(component.warningCount).toBe(1);
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
    expect(text).toContain('Name is required');
    expect(text).toContain('Limit is high');
  });

  it('emits the clicked validation item so forms can focus the field', () => {
    const item: ValidationSummaryItem = {
      fieldPath: 'name',
      label: 'Name',
      message: 'Name is required'
    };
    const itemClick = vi.fn();
    component.items = [item];
    component.itemClick.subscribe(itemClick);

    fixture.detectChanges();
    fixture.debugElement.query(By.css('button')).triggerEventHandler('click');

    expect(itemClick).toHaveBeenCalledWith(item);
  });
});
