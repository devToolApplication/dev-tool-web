import { Component, NgModule } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '../../../shared.module';
import { provideSharedTesting } from '../../../testing/shared-test.providers';
import { LoadingSkeletonComponent, LoadingSkeletonType } from './loading-skeleton.component';

@Component({
  selector: 'app-skeleton-wrapper-test-host',
  standalone: false,
  template: `
    <app-skeleton-table [rows]="2" [columns]="3"></app-skeleton-table>
    <app-skeleton-form [rows]="2"></app-skeleton-form>
    <app-skeleton-card [rows]="2"></app-skeleton-card>
  `
})
class SkeletonWrapperTestHostComponent {}

@NgModule({
  declarations: [SkeletonWrapperTestHostComponent],
  imports: [SharedModule]
})
class SkeletonWrapperTestHostModule {}

describe('LoadingSkeletonComponent', () => {
  let fixture: ComponentFixture<LoadingSkeletonComponent>;
  let component: LoadingSkeletonComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule, SkeletonWrapperTestHostModule],
      providers: provideSharedTesting()
    }).compileComponents();

    fixture = TestBed.createComponent(LoadingSkeletonComponent);
    component = fixture.componentInstance;
  });

  it('renders card, table, form and detail variants', () => {
    const types: LoadingSkeletonType[] = ['card', 'table', 'form', 'detail'];

    types.forEach((type) => {
      render({ type });
      expect(fixture.nativeElement.querySelector(`.loading-skeleton--${type}`)).toBeTruthy();
    });
  });

  it('renders configured rows and columns', () => {
    render({ type: 'table', rows: 2, columns: 3 });

    const lines = fixture.nativeElement.querySelectorAll('.loading-skeleton__line');
    expect(lines.length).toBe(9);
    expect(component.resolvedRows).toBe(2);
    expect(component.resolvedColumns).toBe(3);
  });

  it('falls back for invalid input and exposes loading semantics', () => {
    render({ type: 'invalid' as LoadingSkeletonType, rows: -10, columns: Number.NaN });

    const skeleton: HTMLElement = fixture.nativeElement.querySelector('.loading-skeleton');
    expect(skeleton.classList.contains('loading-skeleton--card')).toBe(true);
    expect(skeleton.getAttribute('role')).toBe('status');
    expect(skeleton.getAttribute('aria-busy')).toBe('true');
    expect(component.sequence(-1)).toEqual([0]);
  });

  it('exposes table, form and card skeleton wrapper selectors', () => {
    const hostFixture = TestBed.createComponent(SkeletonWrapperTestHostComponent);
    hostFixture.detectChanges();

    expect(hostFixture.nativeElement.querySelector('app-skeleton-table .loading-skeleton--table')).toBeTruthy();
    expect(hostFixture.nativeElement.querySelector('app-skeleton-form .loading-skeleton--form')).toBeTruthy();
    expect(hostFixture.nativeElement.querySelector('app-skeleton-card .loading-skeleton--card')).toBeTruthy();
  });

  function render(inputs: Partial<LoadingSkeletonComponent>): void {
    fixture.destroy();
    fixture = TestBed.createComponent(LoadingSkeletonComponent);
    component = fixture.componentInstance;
    Object.assign(component, inputs);
    fixture.detectChanges();
  }
});
