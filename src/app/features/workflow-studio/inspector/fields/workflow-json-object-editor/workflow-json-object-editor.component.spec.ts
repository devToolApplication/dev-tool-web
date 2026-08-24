import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Pipe, PipeTransform } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { WorkflowJsonObjectEditorComponent } from './workflow-json-object-editor.component';
import { InputText } from '@shared/ui/primitives/input-text/input-text';
import { Button } from '@shared/ui/primitives/button/button';
import { InputArea } from '@shared/ui/primitives/input-area/input-area';
import { InputNumber } from '@shared/ui/primitives/input-number/input-number';
import { Select } from '@shared/ui/primitives/select/select';
import { AlertComponent } from '@shared/ui/feedback/alert/alert.component';

@Pipe({ name: 'translateContent', standalone: false })
class TranslateContentPipeStub implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe('WorkflowJsonObjectEditorComponent', () => {
  let component: WorkflowJsonObjectEditorComponent;
  let fixture: ComponentFixture<WorkflowJsonObjectEditorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        WorkflowJsonObjectEditorComponent,
        TranslateContentPipeStub,
        InputText,
        Button,
        InputArea,
        InputNumber,
        Select,
        AlertComponent,
      ],
      imports: [FormsModule],
    });

    fixture = TestBed.createComponent(WorkflowJsonObjectEditorComponent);
    component = fixture.componentInstance;
  });

  it('populates structured rows for various primitive types and JSON objects', () => {
    component.value = {
      name: 'test-rule',
      threshold: 80,
      enabled: true,
      extra: null,
      nested: { foo: 'bar' },
    };
    component.ngOnChanges({
      value: {
        currentValue: component.value,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    fixture.detectChanges();

    expect(component.rows().length).toBe(5);
    expect(component.rows()[0]).toMatchObject({ key: 'name', type: 'string', stringValue: 'test-rule' });
    expect(component.rows()[1]).toMatchObject({ key: 'threshold', type: 'number', numberValue: 80 });
    expect(component.rows()[2]).toMatchObject({ key: 'enabled', type: 'boolean', booleanValue: true });
    expect(component.rows()[3]).toMatchObject({ key: 'extra', type: 'null' });
    expect(component.rows()[4]).toMatchObject({ key: 'nested', type: 'json' });
    expect(component.validationError()).toBeNull();
  });

  it('adds, edits, changes type, and removes rows with proper value change emission', () => {
    component.value = {};
    component.ngOnChanges({
      value: {
        currentValue: component.value,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true,
      },
    });

    const emitSpy = vi.spyOn(component.valueChange, 'emit');

    component.addRow();
    expect(component.rows().length).toBe(1);
    expect(component.validationError()).toBe('workflowStudio.inspector.emptyCriteriaKey');
    expect(emitSpy).not.toHaveBeenCalled();

    const rowId = component.rows()[0].id;
    component.onKeyChange(rowId, 'minScore');
    component.onTypeChange(rowId, 'number');
    component.onNumberValueChange(rowId, 95);

    expect(component.validationError()).toBeNull();
    expect(emitSpy).toHaveBeenCalledWith({
      minScore: 95,
    });

    component.removeRow(rowId);
    expect(component.rows().length).toBe(0);
    expect(emitSpy).toHaveBeenCalledWith({});
  });

  it('shows error on duplicate keys and blocks emission', () => {
    component.value = { existing: 'val' };
    component.ngOnChanges({
      value: {
        currentValue: component.value,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true,
      },
    });

    const emitSpy = vi.spyOn(component.valueChange, 'emit');

    component.addRow();
    const newRowId = component.rows()[1].id;
    component.onKeyChange(newRowId, 'existing');
    component.onStringValueChange(newRowId, 'other');

    expect(component.validationError()).toBe('workflowStudio.inspector.duplicateCriteriaKey');
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('disables mutation in readonly mode', () => {
    component.readonly = true;
    component.value = { existing: 'val' };
    component.ngOnChanges({
      value: {
        currentValue: component.value,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true,
      },
    });

    const emitSpy = vi.spyOn(component.valueChange, 'emit');

    component.addRow();
    expect(component.rows().length).toBe(1);

    component.removeRow(component.rows()[0].id);
    expect(component.rows().length).toBe(1);

    component.onKeyChange(component.rows()[0].id, 'mutated');
    expect(component.rows()[0].key).toBe('existing');

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('synchronizes raw JSON edits and handles invalid JSON format', () => {
    component.value = {};
    component.ngOnChanges({
      value: {
        currentValue: component.value,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true,
      },
    });

    const emitSpy = vi.spyOn(component.valueChange, 'emit');

    component.onRawJsonChange('{"rule":"strict","count":5}');
    expect(component.validationError()).toBeNull();
    expect(component.rows().length).toBe(2);
    expect(emitSpy).toHaveBeenCalledWith({ rule: 'strict', count: 5 });

    component.onRawJsonChange('{broken json');
    expect(component.validationError()).toBe('workflowStudio.inspector.invalidCriteriaJson');
  });
});