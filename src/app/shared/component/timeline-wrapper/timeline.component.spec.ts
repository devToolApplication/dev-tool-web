import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '../../shared.module';
import { provideSharedTesting } from '../../testing/shared-test.providers';
import { TimelineComponent } from './timeline.component';

describe('TimelineComponent', () => {
  let component: TimelineComponent<{ label: string }>;
  let fixture: ComponentFixture<TimelineComponent<{ label: string }>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: provideSharedTesting()
    }).compileComponents();

    fixture = TestBed.createComponent(TimelineComponent<{ label: string }>);
    component = fixture.componentInstance;
  });

  it('renders the legacy PrimeNG timeline wrapper with generic values', () => {
    component.value = [{ label: 'Created' }, { label: 'Published' }];
    component.align = 'right';
    component.layout = 'horizontal';

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('p-timeline')).toBeTruthy();
    expect(component.value.length).toBe(2);
    expect(component.align).toBe('right');
    expect(component.layout).toBe('horizontal');
  });
});
