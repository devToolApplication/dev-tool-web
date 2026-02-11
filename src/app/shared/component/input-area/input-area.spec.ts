import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InputArea } from './input-area';

describe('InputArea', () => {
  let component: InputArea;
  let fixture: ComponentFixture<InputArea>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InputArea]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InputArea);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
