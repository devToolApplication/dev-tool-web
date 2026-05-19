import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '../../shared.module';
import { provideSharedTesting } from '../../testing/shared-test.providers';
import { BasePopupComponent } from './base-popup.component';

describe('BasePopupComponent', () => {
  let fixture: ComponentFixture<BasePopupComponent>;
  let component: BasePopupComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: provideSharedTesting()
    }).compileComponents();

    fixture = TestBed.createComponent(BasePopupComponent);
    component = fixture.componentInstance;
  });

  it('renders popups from body above the app shell by default', () => {
    expect(component.appendTo).toBe('body');
    expect(component.baseZIndex).toBe(2400);

    component.visible = true;
    fixture.detectChanges();

    expect(component.resolvedStyleClass).toContain('base-popup');
  });
});
