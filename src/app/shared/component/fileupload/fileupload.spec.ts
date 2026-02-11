import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Fileupload } from './fileupload';

describe('Fileupload', () => {
  let component: Fileupload;
  let fixture: ComponentFixture<Fileupload>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Fileupload]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Fileupload);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
