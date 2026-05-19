import { Component, NgModule } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '../../../shared.module';
import { provideSharedTesting } from '../../../testing/shared-test.providers';
import { SectionPanelComponent } from './section-panel.component';

@Component({
  selector: 'app-section-panel-test-host',
  standalone: false,
  template: `
    <app-section-panel title="General" subtitle="Settings">
      <button section-actions type="button">Edit</button>
      <div class="section-body">Body content</div>
      <button section-footer type="button">Save</button>
    </app-section-panel>
  `
})
class SectionPanelTestHostComponent {}

@NgModule({
  declarations: [SectionPanelTestHostComponent],
  imports: [SharedModule]
})
class SectionPanelTestHostModule {}

describe('SectionPanelComponent', () => {
  let fixture: ComponentFixture<SectionPanelComponent>;
  let component: SectionPanelComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule, SectionPanelTestHostModule],
      providers: provideSharedTesting()
    }).compileComponents();

    fixture = TestBed.createComponent(SectionPanelComponent);
    component = fixture.componentInstance;
  });

  it('renders title, content, header action and footer projection', () => {
    const hostFixture = TestBed.createComponent(SectionPanelTestHostComponent);
    hostFixture.detectChanges();

    const text = hostFixture.nativeElement.textContent;
    expect(text).toContain('General');
    expect(text).toContain('Settings');
    expect(text).toContain('Edit');
    expect(text).toContain('Body content');
    expect(text).toContain('Save');
  });

  it('supports collapsed default and collapse/expand toggle', () => {
    component.title = 'Collapsible';
    component.collapsible = true;
    component.collapsed = true;
    fixture.detectChanges();

    expect(component.collapsedState()).toBe(true);
    expect(fixture.nativeElement.querySelector('.section-panel__body')).toBeNull();

    component.toggle();
    fixture.detectChanges();

    expect(component.collapsedState()).toBe(false);
    expect(fixture.nativeElement.querySelector('.section-panel__body')).toBeTruthy();
  });

  it('renders loading, empty and error indicator states', () => {
    render({ loading: true });
    expect(fixture.nativeElement.querySelector('app-loading-skeleton')).toBeTruthy();

    render({ empty: true, emptyTitle: 'No section data' });
    expect(fixture.nativeElement.querySelector('app-empty-state')).toBeTruthy();

    render({ error: 'Section failed' });
    expect(fixture.nativeElement.querySelector('app-error-state')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.section-panel--has-error')).toBeTruthy();
  });

  function render(inputs: Partial<SectionPanelComponent>): void {
    fixture.destroy();
    fixture = TestBed.createComponent(SectionPanelComponent);
    component = fixture.componentInstance;
    Object.assign(component, inputs);
    fixture.detectChanges();
  }
});
