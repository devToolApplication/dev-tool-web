import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '../../../../shared.module';
import { createFieldState } from '../../../../testing/field-state.stub';
import { provideSharedTesting } from '../../../../testing/shared-test.providers';


import { FieldRenderer } from './field-renderer';

describe('FieldRenderer', () => {
  let component: FieldRenderer;
  let fixture: ComponentFixture<FieldRenderer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: provideSharedTesting()
    }).compileComponents();

    fixture = TestBed.createComponent(FieldRenderer);
    component = fixture.componentInstance;
    component.field = createFieldState({ type: 'text', name: 'name', label: 'name' });
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
