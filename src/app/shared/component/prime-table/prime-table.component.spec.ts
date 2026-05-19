import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '../../shared.module';
import { provideSharedTesting } from '../../testing/shared-test.providers';
import { PrimeTableComponent } from './prime-table.component';

describe('PrimeTableComponent', () => {
  let component: PrimeTableComponent<{ id: number }>;
  let fixture: ComponentFixture<PrimeTableComponent<{ id: number }>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: provideSharedTesting()
    }).compileComponents();

    fixture = TestBed.createComponent(PrimeTableComponent<{ id: number }>);
    component = fixture.componentInstance;
  });

  it('passes table inputs through to the PrimeNG table wrapper', () => {
    component.value = [{ id: 1 }];
    component.loading = true;
    component.paginator = true;
    component.rows = 25;
    component.styleClass = 'audit-table';

    fixture.detectChanges();

    const tableWrapper: HTMLElement | null = fixture.nativeElement.querySelector('p-table');
    expect(tableWrapper).toBeTruthy();
    expect(component.value).toEqual([{ id: 1 }]);
    expect(component.loading).toBe(true);
    expect(component.paginator).toBe(true);
    expect(component.rows).toBe(25);
  });
});
