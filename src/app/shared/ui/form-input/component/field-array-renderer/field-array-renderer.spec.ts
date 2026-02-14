import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FieldArrayRenderer } from './field-array-renderer';

describe('FieldRenderer', () => {
  let component: FieldArrayRenderer;
  let fixture: ComponentFixture<FieldArrayRenderer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FieldArrayRenderer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FieldArrayRenderer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
