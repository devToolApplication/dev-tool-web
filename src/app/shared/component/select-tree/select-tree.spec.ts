import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectTree } from './select-tree';

describe('SelectTree', () => {
  let component: SelectTree;
  let fixture: ComponentFixture<SelectTree>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SelectTree]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectTree);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
