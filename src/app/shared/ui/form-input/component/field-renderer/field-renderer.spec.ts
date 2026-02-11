import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FieldRenderer } from './field-renderer';

describe('FieldRenderer', () => {
  let component: FieldRenderer;
  let fixture: ComponentFixture<FieldRenderer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FieldRenderer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FieldRenderer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
