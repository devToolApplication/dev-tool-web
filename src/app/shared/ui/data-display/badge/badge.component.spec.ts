import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '../../../shared.module';
import { provideSharedTesting } from '../../../testing/shared-test.providers';
import { BadgeComponent, BadgeVariant } from './badge.component';

describe('BadgeComponent', () => {
  let fixture: ComponentFixture<BadgeComponent>;
  let component: BadgeComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: provideSharedTesting()
    }).compileComponents();

    fixture = TestBed.createComponent(BadgeComponent);
    component = fixture.componentInstance;
  });

  it('renders the label and text signal for each generic variant', () => {
    const variants: BadgeVariant[] = ['default', 'info', 'success', 'warning', 'danger', 'muted'];

    variants.forEach((variant) => {
      fixture.destroy();
      fixture = TestBed.createComponent(BadgeComponent);
      component = fixture.componentInstance;
      component.label = `state.${variant}`;
      component.variant = variant;
      fixture.detectChanges();

      const badge: HTMLElement = fixture.nativeElement.querySelector('.app-badge');
      expect(badge.textContent).toContain(`state.${variant}`);
      expect(badge.classList.contains(`app-badge--${variant}`)).toBe(true);
    });
  });

  it('renders an optional icon', () => {
    component.label = 'Ready';
    component.icon = 'pi pi-check';
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.pi-check')).toBeTruthy();
  });

  it('falls back to the default variant for unsupported runtime values', () => {
    component.label = 'Unknown';
    component.variant = 'unsupported' as BadgeVariant;
    fixture.detectChanges();

    const badge: HTMLElement = fixture.nativeElement.querySelector('.app-badge');
    expect(badge.classList.contains('app-badge--default')).toBe(true);
    expect(badge.className).not.toContain('unsupported');
  });
});
