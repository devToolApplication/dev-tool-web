import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';

import { SharedModule } from '../../shared.module';
import { provideSharedTesting } from '../../testing/shared-test.providers';
import { InputMulti } from './input-multi';

describe('InputMulti', () => {
  let component: InputMulti;
  let fixture: ComponentFixture<InputMulti>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: provideSharedTesting()
    }).compileComponents();

    fixture = TestBed.createComponent(InputMulti);
    component = fixture.componentInstance;
  });

  it('normalizes value changes into unique string values', () => {
    const valueChange = vi.spyOn(component.valueChange, 'emit');

    component.value = [
      'alpha',
      'beta',
      'alpha',
      ''
    ];
    component.ngOnChanges({
      value: new SimpleChange(null, component.value, false)
    });

    expect(component.model).toEqual(['alpha', 'beta']);
    expect(component.selectedOptions).toEqual([
      { label: 'alpha', value: 'alpha' },
      { label: 'beta', value: 'beta' }
    ]);
    expect(valueChange).not.toHaveBeenCalled();
  });

  it('commits a typed value on enter without duplicating existing chips', () => {
    const valueChange = vi.spyOn(component.valueChange, 'emit');
    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    const preventDefault = vi.spyOn(event, 'preventDefault');

    component.onSearch('gamma');
    component.onInputKeydown(event);
    component.onSearch('gamma');
    component.onInputKeydown(event);

    expect(preventDefault).toHaveBeenCalledTimes(2);
    expect(component.model).toEqual(['gamma']);
    expect(valueChange).toHaveBeenCalledTimes(1);
    expect(valueChange).toHaveBeenCalledWith(['gamma']);
  });

  it('keeps selected values out of future suggestions', () => {
    component.options = [
      { label: 'Alpha', value: 'alpha' },
      { label: 'Beta', value: 'beta' }
    ];
    component.value = ['alpha'];
    component.ngOnChanges({
      value: new SimpleChange(null, component.value, false)
    });

    component.onSearch('');

    expect(component.suggestions).toEqual([
      { label: 'Beta', value: 'beta' }
    ]);
  });
});
