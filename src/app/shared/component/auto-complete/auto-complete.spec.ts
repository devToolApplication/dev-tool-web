import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '../../shared.module';
import { provideSharedTesting } from '../../testing/shared-test.providers';
import { AutoComplete } from './auto-complete';

describe('AutoComplete', () => {
  let component: AutoComplete;
  let fixture: ComponentFixture<AutoComplete>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: provideSharedTesting()
    }).compileComponents();

    fixture = TestBed.createComponent(AutoComplete);
    component = fixture.componentInstance;
  });

  it('creates suggestions from configured options and a free typed value', () => {
    component.options = [
      { label: 'Alpha', value: 'alpha' },
      { label: 'Beta', value: 'beta' }
    ];

    component.onSearch('alp');

    expect(component.suggestions).toEqual(['alp', 'alpha']);
  });

  it('emits value changes and enter presses', () => {
    const valueChange = vi.spyOn(component.valueChange, 'emit');
    const enterPress = vi.spyOn(component.enterPress, 'emit');
    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    const preventDefault = vi.spyOn(event, 'preventDefault');

    component.onInput('typed');
    component.onEnter(event);

    expect(valueChange).toHaveBeenCalledWith('typed');
    expect(preventDefault).toHaveBeenCalled();
    expect(enterPress).toHaveBeenCalled();
  });
});
