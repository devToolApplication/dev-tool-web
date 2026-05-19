import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { SharedModule } from '../../../shared.module';
import { provideSharedTesting } from '../../../testing/shared-test.providers';
import { JsonViewerComponent } from '../json-viewer/json-viewer.component';
import { DiffViewerComponent } from './diff-viewer.component';

describe('DiffViewerComponent', () => {
  let fixture: ComponentFixture<DiffViewerComponent>;
  let component: DiffViewerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: provideSharedTesting()
    }).compileComponents();

    fixture = TestBed.createComponent(DiffViewerComponent);
    component = fixture.componentInstance;
  });

  it('renders added, removed and changed rows', () => {
    component.before = { removed: true, changed: 1 };
    component.after = { added: true, changed: 2 };
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.diff-viewer__row--added')?.textContent).toContain('added');
    expect(fixture.nativeElement.querySelector('.diff-viewer__row--removed')?.textContent).toContain('removed');
    expect(fixture.nativeElement.querySelector('.diff-viewer__row--changed')?.textContent).toContain('changed');
  });

  it('shows an empty state for an empty diff', () => {
    component.before = {};
    component.after = {};
    fixture.detectChanges();

    expect(component.rows).toEqual([]);
    expect(fixture.nativeElement.querySelector('app-empty-state')).toBeTruthy();
  });

  it('keeps raw JSON available through collapsed viewers', () => {
    component.before = { enabled: false };
    component.after = { enabled: true };
    fixture.detectChanges();

    const viewers = fixture.debugElement.queryAll(By.directive(JsonViewerComponent));
    expect(viewers.length).toBe(2);
    viewers.forEach((viewer) => {
      expect((viewer.componentInstance as JsonViewerComponent).collapsed).toBe(true);
    });
  });

  it('falls back safely for circular input', () => {
    const circular: Record<string, unknown> = { id: 'root' };
    circular['self'] = circular;
    component.before = circular;
    component.after = { id: 'root' };

    expect(() => fixture.detectChanges()).not.toThrow();
    expect(component.rows.some((row) => row.before === '[Circular]')).toBe(true);
  });
});
