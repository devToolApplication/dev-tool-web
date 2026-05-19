import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { SharedModule } from '../../../../../shared.module';
import { provideSharedTesting } from '../../../../../testing/shared-test.providers';
import { TableFilterComponent } from './table-filter';

describe('TableFilterComponent', () => {
  let fixture: ComponentFixture<TableFilterComponent>;
  let component: TableFilterComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: provideSharedTesting()
    }).compileComponents();

    fixture = TestBed.createComponent(TableFilterComponent);
    component = fixture.componentInstance;
    component.options = { enableUrlSync: false, primaryField: 'keyword' };
    component.fields = [
      { field: 'keyword', label: 'Keyword', type: 'text' },
      { field: 'amount', label: 'Amount', type: 'number-range' },
      { field: 'owner', label: 'Owner', type: 'autocomplete', options: [{ label: 'Alice', value: 'alice' }] }
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

  it('does not emit an initial empty search when the URL only represents default filters', async () => {
    fixture.destroy();
    fixture = TestBed.createComponent(TableFilterComponent);
    component = fixture.componentInstance;
    component.options = { enableUrlSync: false, primaryField: 'keyword' };
    component.fields = [
      { field: 'keyword', label: 'Keyword', type: 'text' },
      { field: 'category', label: 'Category', type: 'text' }
    ];
    const search = vi.spyOn(component.search, 'emit');

    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();

    expect(search).not.toHaveBeenCalled();
  });

  it('applies and resets number-range and autocomplete filters without duplicate search events', () => {
    const search = vi.spyOn(component.search, 'emit');
    const reset = vi.spyOn(component.reset, 'emit');

    component.onFieldChange(component.fields[1], { start: '10', end: '20' });
    component.onFieldChange(component.fields[2], 'alice');
    component.onApplyAdvanced();

    expect(search).toHaveBeenCalledWith({ amountFrom: 10, amountTo: 20, owner: 'alice' });
    expect(component.activeFilterCount()).toBe(2);

    search.mockClear();
    component.onReset();

    expect(reset).toHaveBeenCalledOnce();
    expect(search).not.toHaveBeenCalled();
    expect(component.activeFilterCount()).toBe(0);
  });

  it('syncs number-range filters to from/to query params', () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component.options = { enableUrlSync: true, primaryField: 'keyword' };

    component.onFieldChange(component.fields[1], { start: '0', end: '20' });
    component.onApplyAdvanced();

    expect(navigate).toHaveBeenCalledWith([], expect.objectContaining({
      queryParams: expect.objectContaining({
        amountFrom: 0,
        amountTo: 20
      }),
      queryParamsHandling: 'merge'
    }));
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
