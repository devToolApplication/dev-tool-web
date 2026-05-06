import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '../../../../shared.module';
import { createArrayFieldState } from '../../../../testing/field-state.stub';
import { provideSharedTesting } from '../../../../testing/shared-test.providers';


import { FieldArrayRenderer } from './field-array-renderer';

describe('FieldRenderer', () => {
  let component: FieldArrayRenderer;
  let fixture: ComponentFixture<FieldArrayRenderer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: provideSharedTesting()
    }).compileComponents();

    fixture = TestBed.createComponent(FieldArrayRenderer);
    component = fixture.componentInstance;
    component.field = createArrayFieldState();
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
