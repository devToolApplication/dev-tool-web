import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { SharedModule } from '@shared/shared.module';
import { TableFilterComponent } from './table-filter';

describe('TableFilterComponent', () => {
  let fixture: ComponentFixture<TableFilterComponent>;
  let component: TableFilterComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: [provideHttpClient(), provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(TableFilterComponent);
    component = fixture.componentInstance;
    component.options = { primaryField: 'keyword' };
    component.fields = [
      { field: 'keyword', label: 'Keyword', type: 'text' },
      { field: 'amount', label: 'Amount', type: 'number-range' },
      {
        field: 'owner',
        label: 'Owner',
        type: 'autocomplete',
        options: [{ label: 'Alice', value: 'alice' }],
      },
    ];
    fixture.detectChanges();
  });

  it('debounces quick search and emits normalized payloads', () => {
    vi.useFakeTimers();
    const search = vi.spyOn(component.search, 'emit');
    component.searchDebounceMs = 250;

    component.onInputChange('alpha');
    expect(search).not.toHaveBeenCalledWith({ keyword: 'alpha' });

    vi.advanceTimersByTime(250);

    expect(search).toHaveBeenCalledWith({ keyword: 'alpha' });
    vi.useRealTimers();
  });

  it('does not emit an initial empty search for default controlled values', async () => {
    fixture.destroy();
    fixture = TestBed.createComponent(TableFilterComponent);
    component = fixture.componentInstance;
    component.options = { primaryField: 'keyword' };
    component.fields = [
      { field: 'keyword', label: 'Keyword', type: 'text' },
      { field: 'category', label: 'Category', type: 'text' },
    ];
    const search = vi.spyOn(component.search, 'emit');

    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();

    expect(search).not.toHaveBeenCalled();
  });

  it('applies and resets number-range and autocomplete filters without duplicate search events', () => {
    const search = vi.spyOn(component.search, 'emit');
    const valueChange = vi.spyOn(component.valueChange, 'emit');
    const reset = vi.spyOn(component.reset, 'emit');

    component.onFieldChange(component.fields[1], { start: '10', end: '20' });
    component.onFieldChange(component.fields[2], 'alice');
    component.onApplyAdvanced();

    expect(search).toHaveBeenCalledWith({ amount: { start: 10, end: 20 }, owner: 'alice' });
    expect(valueChange).toHaveBeenCalledWith({
      amount: { start: 10, end: 20 },
      owner: 'alice',
    });
    expect(component.activeFilterCount()).toBe(2);

    search.mockClear();
    valueChange.mockClear();
    component.onReset();

    expect(reset).toHaveBeenCalledOnce();
    expect(valueChange).toHaveBeenCalledWith({});
    expect(search).not.toHaveBeenCalled();
    expect(component.activeFilterCount()).toBe(0);
  });

  it('accepts controlled filter values without router providers', () => {
    component.fields = [
      ...component.fields,
      { field: 'enabled', label: 'Enabled', type: 'boolean' },
    ];
    component.value = { keyword: 'alpha', amount: { start: 0, end: 20 }, enabled: true };

    component.ngOnChanges({
      value: {
        currentValue: component.value,
        previousValue: {},
        firstChange: false,
        isFirstChange: () => false,
      },
    });

    expect(component.searchValue()).toBe('alpha');
    expect(component.valueOf(component.fields[1])).toEqual({ start: 0, end: 20 });
    expect(component.valueOf(component.fields[3])).toBe(true);
    expect(component.activeFilterCount()).toBe(3);
  });

  it('blocks invalid range filters and renders inline validation errors', () => {
    const search = vi.spyOn(component.search, 'emit');
    component.drawerOpen.set(true);

    component.onFieldChange(component.fields[1], { start: '20', end: '10' });
    component.onApplyAdvanced();
    fixture.detectChanges();

    expect(search).not.toHaveBeenCalled();
    expect(component.validationErrors()).toEqual([
      { field: 'amount', message: 'shared.filter.numberRangeInvalid' },
    ]);
    expect(component.fieldErrors(component.fields[1]).map((error) => error.message)).toEqual([
      'shared.filter.numberRangeInvalid',
    ]);

    component.onFieldChange(component.fields[1], { start: '10', end: '20' });
    component.onApplyAdvanced();

    expect(component.validationErrors()).toEqual([]);
    expect(search).toHaveBeenCalledWith({ amount: { start: 10, end: 20 } });
  });

  it('renders active filter chips and removes an individual filter', () => {
    const search = vi.spyOn(component.search, 'emit');

    component.onFieldChange(component.fields[0], 'alpha');
    component.onFieldChange(component.fields[2], 'alice');
    component.onApplyAdvanced();
    fixture.detectChanges();

    expect(component.activeFilterChips().map((chip) => chip.label)).toEqual(['Keyword', 'Owner']);
    expect(fixture.nativeElement.querySelectorAll('.filter-chip').length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('Alice');

    component.removeFilter(component.fields[2]);

    expect(component.activeFilterChips().map((chip) => chip.label)).toEqual(['Keyword']);
    expect(search).toHaveBeenLastCalledWith({ keyword: 'alpha' });
  });
});
