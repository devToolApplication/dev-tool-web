import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SharedModule } from '@shared/shared.module';
import { provideSharedTesting } from '@shared/testing/shared-test.providers';
import { ActionToolbarComponent } from './action-toolbar.component';

describe('ActionToolbarComponent', () => {
  let fixture: ComponentFixture<ActionToolbarComponent>;
  let component: ActionToolbarComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: provideSharedTesting(),
    }).compileComponents();

    fixture = TestBed.createComponent(ActionToolbarComponent);
    component = fixture.componentInstance;
  });

  it('emits primary action clicks directly without confirmation coupling', () => {
    const action = {
      id: 'create',
      label: 'Create',
      placement: 'primary' as const,
      variant: 'primary' as const,
    };
    const emit = vi.spyOn(component.actionClick, 'emit');
    component.actions = [action];
    component.ngOnChanges();
    fixture.detectChanges();

    component.emitAction(action);

    expect(emit).toHaveBeenCalledWith(action);
  });

  it('does not emit disabled or loading actions', () => {
    const emit = vi.spyOn(component.actionClick, 'emit');

    component.emitAction({ id: 'disabled', label: 'Disabled', disabled: true });
    component.emitAction({ id: 'loading', label: 'Loading', loading: true });

    expect(emit).not.toHaveBeenCalled();
  });

  it('renders and emits more actions through the menu', () => {
    const moreAction = { id: 'archive', label: 'Archive', placement: 'more' as const };
    const emit = vi.spyOn(component.actionClick, 'emit');
    component.actions = [moreAction];
    component.ngOnChanges();
    fixture.detectChanges();

    component.toggleMore();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="menu"]')).toBeTruthy();
    component.emitAction(moreAction);

    expect(emit).toHaveBeenCalledWith(moreAction);
    expect(component.moreOpen()).toBe(false);
  });
});
