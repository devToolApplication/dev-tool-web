import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '../../shared.module';
import { provideSharedTesting } from '../../testing/shared-test.providers';
import { Tag } from './tag';

describe('Tag', () => {
  let component: Tag;
  let fixture: ComponentFixture<Tag>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: provideSharedTesting()
    }).compileComponents();

    fixture = TestBed.createComponent(Tag);
    component = fixture.componentInstance;
  });

  it('renders a translated value through the PrimeNG tag wrapper', () => {
    component.value = 'shared.status.ready';
    component.severity = 'success';
    component.icon = 'pi pi-check';

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('shared.status.ready');
    expect(component.severity).toBe('success');
    expect(component.icon).toBe('pi pi-check');
  });
});
