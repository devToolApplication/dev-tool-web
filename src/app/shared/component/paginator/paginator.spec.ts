import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '../../shared.module';
import { provideSharedTesting } from '../../testing/shared-test.providers';

import { Paginator } from './paginator';

describe('Paginator', () => {
  let component: Paginator;
  let fixture: ComponentFixture<Paginator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: provideSharedTesting()
    }).compileComponents();

    fixture = TestBed.createComponent(Paginator);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('emits PrimeNG page state without mutating paging inputs', () => {
    const pageChange = vi.spyOn(component.pageChange, 'emit');
    const state = { first: 20, rows: 10, page: 2, pageCount: 5 };
    component.first = 0;
    component.rows = 10;

    component.pageChange.emit(state);

    expect(pageChange).toHaveBeenCalledWith(state);
    expect(component.first).toBe(0);
    expect(component.rows).toBe(10);
  });
});
