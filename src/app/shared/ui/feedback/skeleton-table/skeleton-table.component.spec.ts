import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '../../../shared.module';
import { provideSharedTesting } from '../../../testing/shared-test.providers';
import { SkeletonTableComponent } from './skeleton-table.component';

describe('SkeletonTableComponent', () => {
  let component: SkeletonTableComponent;
  let fixture: ComponentFixture<SkeletonTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: provideSharedTesting()
    }).compileComponents();

    fixture = TestBed.createComponent(SkeletonTableComponent);
    component = fixture.componentInstance;
  });

  it('renders the table loading skeleton wrapper with configurable rows and columns', () => {
    component.rows = 5;
    component.columns = 7;

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-loading-skeleton')).toBeTruthy();
    expect(component.rows).toBe(5);
    expect(component.columns).toBe(7);
  });
});
