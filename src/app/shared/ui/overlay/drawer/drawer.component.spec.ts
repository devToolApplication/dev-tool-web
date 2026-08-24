import { Component, NgModule } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '@shared/shared.module';
import { provideSharedTesting } from '@shared/testing/shared-test.providers';
import { DrawerComponent } from './drawer.component';

@Component({
  selector: 'app-drawer-test-host',
  standalone: false,
  template: `
    <app-drawer [open]="true" title="Detail" subtitle="Subtitle">
      <span drawer-header class="projected-header">Header slot</span>
      <div class="projected-body">Body slot</div>
      <button drawer-footer type="button" class="projected-footer">Footer action</button>
    </app-drawer>
  `,
})
class DrawerTestHostComponent {}

@NgModule({
  declarations: [DrawerTestHostComponent],
  imports: [SharedModule],
})
class DrawerTestHostModule {}

describe('DrawerComponent', () => {
  let fixture: ComponentFixture<DrawerComponent>;
  let component: DrawerComponent;
  let overlayContainer: OverlayContainer;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule, DrawerTestHostModule],
      providers: provideSharedTesting(),
    }).compileComponents();

    fixture = TestBed.createComponent(DrawerComponent);
    component = fixture.componentInstance;
    overlayContainer = TestBed.inject(OverlayContainer);
  });

  afterEach(() => {
    fixture.destroy();
    overlayContainer.ngOnDestroy();
  });

  it('opens and closes with output events', () => {
    const openChange = vi.spyOn(component.openChange, 'emit');
    const closed = vi.spyOn(component.closed, 'emit');
    component.open = true;
    fixture.detectChanges();

    expect(document.body.querySelector('[role="dialog"]')).toBeTruthy();
    expect(document.body.querySelector('.app-drawer')).toBeTruthy();

    component.close();
    fixture.detectChanges();

    expect(openChange).toHaveBeenCalledWith(false);
    expect(closed).toHaveBeenCalledOnce();
    expect(document.body.querySelector('.app-drawer')).toBeNull();
  });

  it('renders title, body, header and footer projection', () => {
    const hostFixture = TestBed.createComponent(DrawerTestHostComponent);
    hostFixture.detectChanges();

    const text = document.body.textContent ?? '';
    expect(text).toContain('Detail');
    expect(text).toContain('Subtitle');
    expect(text).toContain('Header slot');
    expect(text).toContain('Body slot');
    expect(text).toContain('Footer action');
    hostFixture.destroy();
  });

  it('renders size and side variants', () => {
    render({ open: true, size: 'xl', side: 'left' });

    expect(document.body.querySelector('.app-drawer--left')).toBeTruthy();
    expect(document.body.querySelector('.app-drawer__panel--xl')).toBeTruthy();
    expect(document.body.querySelector('.app-drawer__panel--left')).toBeTruthy();

    render({ open: true, size: 'comfortable', side: 'right' });
    expect(document.body.querySelector('.app-drawer__panel--comfortable')).toBeTruthy();
    expect(document.body.querySelector('.app-drawer--right')).toBeTruthy();
  });

  it('renders loading, error and empty states', () => {
    render({ open: true, loading: true });
    expect(document.body.querySelector('app-loading-skeleton')).toBeTruthy();

    render({ open: true, error: 'Load failed' });
    expect(document.body.querySelector('app-error-state')).toBeTruthy();

    render({ open: true, empty: true, emptyTitle: 'No detail' });
    expect(document.body.querySelector('app-empty-state')).toBeTruthy();
    expect(document.body.textContent).toContain('No detail');
  });

  it('honors backdrop and escape close config', () => {
    const openChange = vi.spyOn(component.openChange, 'emit');
    component.open = true;
    component.closeOnBackdrop = false;
    fixture.detectChanges();

    component.onBackdropClick();

    expect(openChange).not.toHaveBeenCalled();

    component.closeOnBackdrop = true;
    component.onBackdropClick();

    expect(openChange).toHaveBeenCalledWith(false);
  });

  it('sets dialog accessibility attributes and restores focus', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();

    component.open = true;
    component.title = 'Accessible detail';
    component.ngOnChanges({
      open: {
        currentValue: true,
        previousValue: false,
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    fixture.detectChanges();

    const panel = document.body.querySelector<HTMLElement>('[role="dialog"]');
    expect(panel).toBeTruthy();
    if (!panel) {
      throw new Error('Drawer panel missing');
    }
    expect(panel.getAttribute('aria-modal')).toBe('true');
    expect(panel.getAttribute('aria-label')).toBe('Accessible detail');

    component.close();

    expect(document.activeElement).toBe(trigger);
    document.body.removeChild(trigger);
  });

  it('uses the CDK focus trap on the drawer panel', () => {
    component.open = true;
    fixture.detectChanges();

    const panel = document.body.querySelector<HTMLElement>('[role="dialog"]');

    expect(panel).toBeTruthy();
    expect(panel?.hasAttribute('cdktrapfocus')).toBe(true);
  });

  function render(inputs: Partial<DrawerComponent>): void {
    fixture.destroy();
    fixture = TestBed.createComponent(DrawerComponent);
    component = fixture.componentInstance;
    Object.assign(component, inputs);
    fixture.detectChanges();
  }
});
