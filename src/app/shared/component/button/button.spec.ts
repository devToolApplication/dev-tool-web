import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '../../shared.module';
import { provideSharedTesting } from '../../testing/shared-test.providers';

import { Button } from './button';

describe('Button', () => {
  let component: Button;
  let fixture: ComponentFixture<Button>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: provideSharedTesting()
    }).compileComponents();

    fixture = TestBed.createComponent(Button);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('uses tooltip as the accessible name when label is absent', async () => {
    component.icon = 'pi pi-refresh';
    component.tooltip = 'test.iconOnlyRefresh';

    fixture.detectChanges();
    await fixture.whenStable();

    const button: HTMLButtonElement | null = fixture.nativeElement.querySelector('button');
    expect(button?.getAttribute('aria-label')).toBe('test.iconOnlyRefresh');
  });
});
