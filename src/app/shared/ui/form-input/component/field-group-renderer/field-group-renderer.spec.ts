import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '../../../../shared.module';
import { createGroupFieldState } from '../../../../testing/field-state.stub';
import { provideSharedTesting } from '../../../../testing/shared-test.providers';


import { FieldGroupRenderer } from './field-group-renderer';

describe('FieldRenderer', () => {
  let component: FieldGroupRenderer;
  let fixture: ComponentFixture<FieldGroupRenderer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: provideSharedTesting()
    }).compileComponents();

    fixture = TestBed.createComponent(FieldGroupRenderer);
    component = fixture.componentInstance;
    component.field = createGroupFieldState();
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
