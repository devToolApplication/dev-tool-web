import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '../../shared.module';
import { provideSharedTesting } from '../../testing/shared-test.providers';
import { TabsComponent } from './tabs.component';

describe('TabsComponent', () => {
  let component: TabsComponent;
  let fixture: ComponentFixture<TabsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: provideSharedTesting()
    }).compileComponents();

    fixture = TestBed.createComponent(TabsComponent);
    component = fixture.componentInstance;
  });

  it('renders tabs and emits the selected value when clicked', () => {
    const valueChange = vi.spyOn(component.valueChange, 'emit');
    component.tabs = [
      { label: 'First', value: 'first' },
      { label: 'Second', value: 'second' }
    ];
    component.value = 'first';

    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('[role="tab"]') as NodeListOf<HTMLButtonElement>;
    buttons[1].click();

    expect(buttons.length).toBe(2);
    expect(buttons[0].getAttribute('aria-selected')).toBe('true');
    expect(valueChange).toHaveBeenCalledWith('second');
  });
});
