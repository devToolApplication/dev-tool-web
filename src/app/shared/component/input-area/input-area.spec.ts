import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '../../shared.module';
import { provideSharedTesting } from '../../testing/shared-test.providers';

import { InputArea } from './input-area';

describe('InputArea', () => {
  let component: InputArea;
  let fixture: ComponentFixture<InputArea>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: provideSharedTesting()
    }).compileComponents();

    fixture = TestBed.createComponent(InputArea);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('guards zoom state when disabled and closes the dialog editor cleanly', () => {
    component.disabled = true;

    component.openZoom();

    expect(component.zoomVisible).toBe(false);

    component.disabled = false;
    component.openZoom();
    expect(component.zoomVisible).toBe(true);

    component.closeZoom();
    expect(component.zoomVisible).toBe(false);
  });

  it('derives stable text and JSON editor heights from row settings', () => {
    component.rows = 4;
    component.maxRows = 2;

    expect(component.inlineTextMaxHeight).toBe('calc(4 * 1lh + 1.25rem)');
    expect(component.inlineJsonHeight).toBe('calc(4 * 1lh + 2rem)');

    component.maxRows = 0;

    expect(component.inlineTextMaxHeight).toBeNull();
    expect(component.inlineJsonHeight).toBeNull();
  });
});
