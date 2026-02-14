import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FieldGroupRenderer } from './field-group-renderer';

describe('FieldRenderer', () => {
  let component: FieldGroupRenderer;
  let fixture: ComponentFixture<FieldGroupRenderer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FieldGroupRenderer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FieldGroupRenderer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
