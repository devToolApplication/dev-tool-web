import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ButtonSplit } from './button-split';

describe('ButtonSplit', () => {
  let component: ButtonSplit;
  let fixture: ComponentFixture<ButtonSplit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ButtonSplit]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ButtonSplit);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
