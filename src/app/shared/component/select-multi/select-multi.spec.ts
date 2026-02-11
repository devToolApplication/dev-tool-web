import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectMulti } from './select-multi';

describe('SelectMulti', () => {
  let component: SelectMulti;
  let fixture: ComponentFixture<SelectMulti>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SelectMulti]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectMulti);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
