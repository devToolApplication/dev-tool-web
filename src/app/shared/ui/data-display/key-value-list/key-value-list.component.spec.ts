import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { SharedModule } from '../../../shared.module';
import { provideSharedTesting } from '../../../testing/shared-test.providers';
import { BadgeComponent } from '../badge/badge.component';
import { CopyableTextComponent } from '../copyable-text/copyable-text.component';
import { KeyValueListComponent } from './key-value-list.component';

describe('KeyValueListComponent', () => {
  let fixture: ComponentFixture<KeyValueListComponent>;
  let component: KeyValueListComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: provideSharedTesting()
    }).compileComponents();

    fixture = TestBed.createComponent(KeyValueListComponent);
    component = fixture.componentInstance;
  });

  it('renders label/value items without domain formatters', () => {
    component.items = [
      { label: 'Name', value: 'Alpha' },
      { label: 'Count', value: 1234, type: 'number' },
      { label: 'Active', value: true, type: 'boolean' }
    ];
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Name');
    expect(fixture.nativeElement.textContent).toContain('Alpha');
    expect(fixture.nativeElement.textContent).toContain('1,234');
    expect(fixture.nativeElement.querySelector('.pi-check')).toBeTruthy();
  });

  it('renders copyable and badge item types', () => {
    component.items = [
      { label: 'ID', value: 'cfg-1', type: 'copyable' },
      { label: 'State', value: 'READY', type: 'badge', variant: 'success' }
    ];
    fixture.detectChanges();

    const copyable = fixture.debugElement.query(By.directive(CopyableTextComponent)).componentInstance as CopyableTextComponent;
    const badge = fixture.debugElement.query(By.directive(BadgeComponent)).componentInstance as BadgeComponent;

    expect(copyable.value).toBe('cfg-1');
    expect(badge.label).toBe('READY');
    expect(badge.variant).toBe('success');
  });

  it('formats generic date, currency and percent values', () => {
    component.items = [
      { label: 'Date', value: '2026-05-15T00:00:00Z', type: 'date' },
      { label: 'Amount', value: 12.5, type: 'currency', currencyCode: 'USD' },
      { label: 'Ratio', value: 0.125, type: 'percent' }
    ];
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('2026');
    expect(text).toContain('$12.50');
    expect(text).toContain('12.5%');
  });

  it('uses null fallback and responsive layout class', () => {
    component.layout = 'one-column';
    component.items = [{ label: 'Missing', value: null, emptyValue: 'Empty value' }];
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Empty value');
    expect(fixture.nativeElement.querySelector('.key-value-list--one-column')).toBeTruthy();
  });
});
