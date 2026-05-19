import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '../../../shared.module';
import { provideSharedTesting } from '../../../testing/shared-test.providers';
import { SkeletonCardComponent } from './skeleton-card.component';

describe('SkeletonCardComponent', () => {
  let component: SkeletonCardComponent;
  let fixture: ComponentFixture<SkeletonCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: provideSharedTesting()
    }).compileComponents();

    fixture = TestBed.createComponent(SkeletonCardComponent);
    component = fixture.componentInstance;
  });

  it('renders the card loading skeleton wrapper with configurable rows', () => {
    component.rows = 3;
    component.animated = false;

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-loading-skeleton')).toBeTruthy();
    expect(component.rows).toBe(3);
    expect(component.animated).toBe(false);
  });
});
