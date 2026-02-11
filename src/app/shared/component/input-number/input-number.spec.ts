import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InputNumber } from './input-number';

describe('InputNumber', () => {
  let component: InputNumber;
  let fixture: ComponentFixture<InputNumber>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InputNumber]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InputNumber);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
