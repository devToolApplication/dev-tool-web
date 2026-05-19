import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '../../../shared.module';
import { provideSharedTesting } from '../../../testing/shared-test.providers';
import { FilterPanelComponent } from './filter-panel.component';

describe('FilterPanelComponent', () => {
  let fixture: ComponentFixture<FilterPanelComponent>;
  let component: FilterPanelComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: provideSharedTesting()
    }).compileComponents();

    fixture = TestBed.createComponent(FilterPanelComponent);
    component = fixture.componentInstance;
  });

  it('renders simple filters and keeps advanced filters collapsed by default', () => {
    component.filters = [
      { key: 'q', label: 'Search', type: 'text' },
      { key: 'state', label: 'State', type: 'select', advanced: true, options: [{ label: 'Ready', value: 'READY' }] }
    ];
    component.advancedCollapsed = true;
    component.ngOnChanges({
      advancedCollapsed: {
        currentValue: true,
        previousValue: false,
        firstChange: true,
        isFirstChange: () => true
      }
    });
    fixture.detectChanges();

    expect(component.simpleFilters.length).toBe(1);
    expect(component.advancedFilters.length).toBe(1);
    expect(component.showAdvanced()).toBe(false);
  });

  it('emits apply, reset and clear payloads with active filter count', () => {
    const apply = vi.spyOn(component.apply, 'emit');
    const reset = vi.spyOn(component.reset, 'emit');
    component.values = { q: 'abc', tags: ['one'], range: { from: 1, to: null } };
    component.initialValues = { q: 'initial' };

    expect(component.activeCount).toBe(3);
    expect(component.dirty).toBe(true);

    component.onApply();
    expect(apply).toHaveBeenCalledWith(component.values);

    component.onReset();
    expect(reset).toHaveBeenCalledOnce();
    expect(component.values).toEqual({ q: 'initial' });

    component.clear();
    expect(component.values).toEqual({});
  });

  it('renders option loading, empty and error retry states', () => {
    const retry = vi.spyOn(component.retryOptions, 'emit');
    component.filters = [
      { key: 'loading', label: 'Loading', type: 'select', loading: true },
      { key: 'empty', label: 'Empty', type: 'select', options: [], emptyMessage: 'No options' },
      { key: 'error', label: 'Error', type: 'select', error: 'Option failed' }
    ];
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-loading-skeleton')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('No options');
    expect(fixture.nativeElement.querySelector('app-error-state')).toBeTruthy();

    const retryButton = fixture.nativeElement.querySelector('app-error-state button');
    expect(retryButton).toBeTruthy();
    retryButton.click();

    expect(retry).toHaveBeenCalledWith(component.filters[2]);
  });

  it('debounces text and autocomplete value changes', () => {
    vi.useFakeTimers();
    const valueChange = vi.spyOn(component.valueChange, 'emit');
    component.searchDebounceMs = 250;

    component.setDebouncedValue('q', 'abc');

    expect(valueChange).not.toHaveBeenCalled();
    vi.advanceTimersByTime(250);

    expect(valueChange).toHaveBeenCalledWith({ q: 'abc' });
    vi.useRealTimers();
  });
});
