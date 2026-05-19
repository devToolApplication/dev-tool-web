import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '../../../shared.module';
import { provideSharedTesting } from '../../../testing/shared-test.providers';
import { TimelineComponent } from './timeline.component';

describe('TimelineComponent', () => {
  let fixture: ComponentFixture<TimelineComponent>;
  let component: TimelineComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: provideSharedTesting()
    }).compileComponents();

    fixture = TestBed.createComponent(TimelineComponent);
    component = fixture.componentInstance;
  });

  it('renders generic event title, description, timestamp and status variant', () => {
    component.timestampFormat = 'yyyy-MM-dd';
    component.items = [
      {
        id: 'evt-1',
        title: 'Created',
        description: 'Created detail',
        time: '2026-05-15T00:00:00Z',
        variant: 'success'
      }
    ];
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Created');
    expect(fixture.nativeElement.textContent).toContain('Created detail');
    expect(fixture.nativeElement.textContent).toContain('2026-05-15');
    expect(fixture.nativeElement.querySelector('.app-timeline__marker--success')).toBeTruthy();
  });

  it('renders empty timeline through EmptyState', () => {
    component.items = [];
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-empty-state')).toBeTruthy();
  });

  it('emits item action without owning business logic', () => {
    const item = { id: 'evt-2', title: 'Open detail', actionLabel: 'open' };
    const emit = vi.spyOn(component.itemAction, 'emit');
    component.items = [item];
    fixture.detectChanges();

    fixture.nativeElement.querySelector('button')?.click();

    expect(emit).toHaveBeenCalledWith(item);
  });

  it('renders loading and error states', () => {
    component.loading = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-loading-skeleton')).toBeTruthy();

    fixture.destroy();
    fixture = TestBed.createComponent(TimelineComponent);
    component = fixture.componentInstance;
    component.loading = false;
    component.error = 'Load failed';
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-error-state')).toBeTruthy();
  });
});
