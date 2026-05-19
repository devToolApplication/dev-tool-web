import { Component, NgModule } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '../../../shared.module';
import { provideSharedTesting } from '../../../testing/shared-test.providers';
import { EmptyStateComponent } from './empty-state.component';

@Component({
  selector: 'app-empty-state-test-host',
  standalone: false,
  template: `
    <app-empty-state title="Empty title" description="Empty description">
      <span class="projected-content">Projected help</span>
    </app-empty-state>
  `
})
class EmptyStateTestHostComponent {}

@NgModule({
  declarations: [EmptyStateTestHostComponent],
  imports: [SharedModule]
})
class EmptyStateTestHostModule {}

describe('EmptyStateComponent', () => {
  let fixture: ComponentFixture<EmptyStateComponent>;
  let component: EmptyStateComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule, EmptyStateTestHostModule],
      providers: provideSharedTesting()
    }).compileComponents();

    fixture = TestBed.createComponent(EmptyStateComponent);
    component = fixture.componentInstance;
  });

  it('renders title, description, icon and accessibility role', () => {
    component.title = 'No records';
    component.description = 'Create the first record';
    component.icon = 'pi pi-search';
    component.variant = 'search';
    fixture.detectChanges();

    const state: HTMLElement = fixture.nativeElement.querySelector('.empty-state');
    expect(state.getAttribute('role')).toBe('status');
    expect(fixture.nativeElement.textContent).toContain('No records');
    expect(fixture.nativeElement.textContent).toContain('Create the first record');
    expect(fixture.nativeElement.querySelector('.pi-search')).toBeTruthy();
  });

  it('does not render actions when action labels are absent', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.empty-state__actions')).toBeNull();
  });

  it('renders primary and secondary actions and emits clicks', () => {
    const primary = vi.spyOn(component.primaryAction, 'emit');
    const secondary = vi.spyOn(component.secondaryAction, 'emit');
    component.primaryActionLabel = 'Create';
    component.secondaryActionLabel = 'Clear filters';
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button');
    buttons[0].click();
    buttons[1].click();

    expect(primary).toHaveBeenCalledOnce();
    expect(secondary).toHaveBeenCalledOnce();
  });

  it('supports projected content and null-like input safely', () => {
    const hostFixture = TestBed.createComponent(EmptyStateTestHostComponent);
    hostFixture.detectChanges();

    expect(hostFixture.nativeElement.textContent).toContain('Projected help');

    fixture.destroy();
    fixture = TestBed.createComponent(EmptyStateComponent);
    component = fixture.componentInstance;
    component.title = null as unknown as string;
    component.description = undefined;
    component.align = 'start';
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.empty-state--start')).toBeTruthy();
  });
});
