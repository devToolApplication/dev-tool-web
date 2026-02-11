import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToggleButton } from './toggle-button';

describe('ToggleButton', () => {
  let component: ToggleButton;
  let fixture: ComponentFixture<ToggleButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ToggleButton]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ToggleButton);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
