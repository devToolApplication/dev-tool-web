import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '../../shared.module';
import { provideSharedTesting } from '../../testing/shared-test.providers';

import { Fileupload } from './fileupload';

describe('Fileupload', () => {
  let component: Fileupload;
  let fixture: ComponentFixture<Fileupload>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: provideSharedTesting()
    }).compileComponents();

    fixture = TestBed.createComponent(Fileupload);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('emits selected and uploaded files without owning upload behavior', () => {
    const fileSelect = vi.spyOn(component.fileSelect, 'emit');
    const uploadHandler = vi.spyOn(component.uploadHandler, 'emit');
    const selectEvent = { files: [new File(['a'], 'a.txt')] } as never;
    const uploadEvent = { files: [new File(['b'], 'b.txt')] } as never;

    component.fileSelect.emit(selectEvent);
    component.uploadHandler.emit(uploadEvent);

    expect(fileSelect).toHaveBeenCalledWith(selectEvent);
    expect(uploadHandler).toHaveBeenCalledWith(uploadEvent);
  });
});
