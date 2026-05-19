import { Component, NgModule } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '../../../shared.module';
import { provideSharedTesting } from '../../../testing/shared-test.providers';
import { PageHeaderComponent } from './page-header.component';

@Component({
  selector: 'app-page-header-test-host',
  standalone: false,
  template: `
    <app-page-header
      title="A very long title that should wrap safely across the available header width"
      subtitle="Subtitle"
      [breadcrumb]="breadcrumb"
      [status]="{ label: 'Ready', variant: 'success' }"
    >
      <button page-actions type="button">Create</button>
    </app-page-header>
  `
})
class PageHeaderTestHostComponent {
  breadcrumb = [{ label: 'Admin', routerLink: '/' }, { label: 'Current' }];
}

@NgModule({
  declarations: [PageHeaderTestHostComponent],
  imports: [SharedModule]
})
class PageHeaderTestHostModule {}

describe('PageHeaderComponent', () => {
  let fixture: ComponentFixture<PageHeaderComponent>;
  let component: PageHeaderComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule, PageHeaderTestHostModule],
      providers: provideSharedTesting()
    }).compileComponents();

    fixture = TestBed.createComponent(PageHeaderComponent);
    component = fixture.componentInstance;
  });

  it('renders title, subtitle, breadcrumb, actions and status', () => {
    const hostFixture = TestBed.createComponent(PageHeaderTestHostComponent);
    hostFixture.detectChanges();

    const text = hostFixture.nativeElement.textContent;
    expect(text).toContain('A very long title');
    expect(text).toContain('Subtitle');
    expect(text).toContain('Admin');
    expect(text).toContain('Ready');
    expect(text).toContain('Create');
    expect(hostFixture.nativeElement.querySelector('.page-header__actions')).toBeTruthy();
  });

  it('emits back action when enabled', () => {
    const back = vi.spyOn(component.back, 'emit');
    component.title = 'Detail';
    component.showBack = true;
    fixture.detectChanges();

    fixture.nativeElement.querySelector('button')?.click();

    expect(back).toHaveBeenCalledOnce();
  });
});
