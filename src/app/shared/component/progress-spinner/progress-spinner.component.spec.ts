import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '../../shared.module';
import { provideSharedTesting } from '../../testing/shared-test.providers';
import { ProgressSpinnerComponent } from './progress-spinner.component';

describe('ProgressSpinnerComponent', () => {
  let component: ProgressSpinnerComponent;
  let fixture: ComponentFixture<ProgressSpinnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: provideSharedTesting()
    }).compileComponents();

    fixture = TestBed.createComponent(ProgressSpinnerComponent);
    component = fixture.componentInstance;
  });

  it('renders a progressbar with a translated accessible name fallback', async () => {
    component.ariaLabel = 'shared.loading';

    fixture.detectChanges();
    await fixture.whenStable();

    const progressbar: HTMLElement | null = fixture.nativeElement.querySelector('[role="progressbar"]');
    expect(progressbar?.getAttribute('aria-label')).toBe('shared.loading');
    expect(progressbar?.getAttribute('title')).toBe('shared.loading');
  });
});
