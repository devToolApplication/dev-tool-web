import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ButtonSpeedDial } from './button-speed-dial';

describe('ButtonSpeedDial', () => {
  let component: ButtonSpeedDial;
  let fixture: ComponentFixture<ButtonSpeedDial>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ButtonSpeedDial]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ButtonSpeedDial);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
