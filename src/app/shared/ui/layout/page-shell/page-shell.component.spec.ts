import { Component, NgModule } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '../../../shared.module';
import { provideSharedTesting } from '../../../testing/shared-test.providers';
import { PageShellComponent } from './page-shell.component';

@Component({
  selector: 'app-page-shell-test-host',
  standalone: false,
  template: `
    <app-page-shell title="Orders" subtitle="Live orders" [breadcrumb]="breadcrumb">
      <button page-actions type="button">Refresh</button>
      <div page-summary>Summary slot</div>
      <div page-toolbar>Toolbar slot</div>
      <div class="projected-content">Content slot</div>
    </app-page-shell>
  `
})
class PageShellTestHostComponent {
  breadcrumb = [{ label: 'Admin', routerLink: '/' }, { label: 'Orders' }];
}

@NgModule({
  declarations: [PageShellTestHostComponent],
  imports: [SharedModule]
})
class PageShellTestHostModule {}

describe('PageShellComponent', () => {
  let fixture: ComponentFixture<PageShellComponent>;
  let component: PageShellComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule, PageShellTestHostModule],
      providers: provideSharedTesting()
    }).compileComponents();

    fixture = TestBed.createComponent(PageShellComponent);
    component = fixture.componentInstance;
  });

  it('renders title, subtitle, breadcrumb and projected slots', () => {
    const hostFixture = TestBed.createComponent(PageShellTestHostComponent);
    hostFixture.detectChanges();

    const text = hostFixture.nativeElement.textContent;
    expect(text).toContain('Orders');
    expect(text).toContain('Live orders');
    expect(text).toContain('Admin');
    expect(text).toContain('Refresh');
    expect(text).toContain('Summary slot');
    expect(text).toContain('Toolbar slot');
    expect(text).toContain('Content slot');
  });

  it('renders loading, error and empty page states', () => {
    render({ loading: true });
    expect(fixture.nativeElement.querySelector('app-loading-skeleton')).toBeTruthy();

    render({ error: 'Load failed' });
    expect(fixture.nativeElement.querySelector('app-error-state')).toBeTruthy();

    render({ empty: true, emptyTitle: 'No records' });
    expect(fixture.nativeElement.querySelector('app-empty-state')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('No records');
  });

  function render(inputs: Partial<PageShellComponent>): void {
    fixture.destroy();
    fixture = TestBed.createComponent(PageShellComponent);
    component = fixture.componentInstance;
    Object.assign(component, inputs);
    fixture.detectChanges();
  }
});
