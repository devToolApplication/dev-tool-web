import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '../../../shared.module';
import { provideSharedTesting } from '../../../testing/shared-test.providers';
import { SkeletonFormComponent } from './skeleton-form.component';

describe('SkeletonFormComponent', () => {
  let component: SkeletonFormComponent;
  let fixture: ComponentFixture<SkeletonFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: provideSharedTesting()
    }).compileComponents();

    fixture = TestBed.createComponent(SkeletonFormComponent);
    component = fixture.componentInstance;
  });

  it('renders the form loading skeleton wrapper with configurable rows', () => {
    component.rows = 6;

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-loading-skeleton')).toBeTruthy();
    expect(component.rows).toBe(6);
  });
});
