import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '@shared/shared.module';
import { provideSharedTesting } from '@shared/testing/shared-test.providers';


import { SelectTree } from './select-tree';

describe('SelectTree', () => {
  let component: SelectTree;
  let fixture: ComponentFixture<SelectTree>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: provideSharedTesting()
    }).compileComponents();

    fixture = TestBed.createComponent(SelectTree);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
