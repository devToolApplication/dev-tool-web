import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Pipe, PipeTransform } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { WorkflowInputMappingEditorComponent } from './workflow-input-mapping-editor.component';
import { InputText } from '@shared/ui/primitives/input-text/input-text';
import { Button } from '@shared/ui/primitives/button/button';
import { InputArea } from '@shared/ui/primitives/input-area/input-area';
import { AlertComponent } from '@shared/ui/feedback/alert/alert.component';

@Pipe({ name: 'translateContent', standalone: false })
class TranslateContentPipeStub implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe('WorkflowInputMappingEditorComponent', () => {
  let component: WorkflowInputMappingEditorComponent;
  let fixture: ComponentFixture<WorkflowInputMappingEditorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        WorkflowInputMappingEditorComponent,
        TranslateContentPipeStub,
        InputText,
        Button,
        InputArea,
        AlertComponent,
      ],
      imports: [FormsModule],
    });

    fixture = TestBed.createComponent(WorkflowInputMappingEditorComponent);
    component = fixture.componentInstance;
  });

  it('populates structured rows from InputMapping value', () => {
    component.value = {
      mapping: {
        candidate: '${input.candidate}',
        score: 100,
      },
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

    expect(component.rows().length).toBe(2);
    expect(component.rows()[0]).toMatchObject({ key: 'candidate', value: '${input.candidate}' });
    expect(component.rows()[1]).toMatchObject({ key: 'score', value: '100' });
    expect(component.validationError()).toBeNull();
  });

  it('adds, edits, and removes rows, emitting updated InputMapping', () => {
    component.value = { mapping: {} };
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
    expect(component.validationError()).toBe('workflowStudio.inspector.emptyMappingKey');
    expect(emitSpy).not.toHaveBeenCalled();

    const rowId = component.rows()[0].id;
    component.onKeyChange(rowId, 'profile');
    component.onValueChange(rowId, '${input.profile}');

    expect(component.validationError()).toBeNull();
    expect(emitSpy).toHaveBeenCalledWith({
      mapping: {
        profile: '${input.profile}',
      },
    });

    component.removeRow(rowId);
    expect(component.rows().length).toBe(0);
    expect(emitSpy).toHaveBeenCalledWith({ mapping: {} });
  });

  it('shows error for duplicate keys and prevents emitting update', () => {
    component.value = { mapping: { test: '1' } };
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
    component.onKeyChange(newRowId, 'test');
    component.onValueChange(newRowId, '2');

    expect(component.validationError()).toBe('workflowStudio.inspector.duplicateMappingKey');
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('disables mutation in readonly mode', () => {
    component.readonly = true;
    component.value = { mapping: { initial: 'val' } };
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

    component.onKeyChange(component.rows()[0].id, 'changed');
    expect(component.rows()[0].key).toBe('initial');

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('synchronizes raw JSON edits with structured rows and validates invalid JSON', () => {
    component.value = { mapping: {} };
    component.ngOnChanges({
      value: {
        currentValue: component.value,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true,
      },
    });

    const emitSpy = vi.spyOn(component.valueChange, 'emit');

    component.onRawJsonChange('{"mapping":{"alpha":"beta"}}');
    expect(component.validationError()).toBeNull();
    expect(component.rows().length).toBe(1);
    expect(component.rows()[0]).toMatchObject({ key: 'alpha', value: 'beta' });
    expect(emitSpy).toHaveBeenCalledWith({ mapping: { alpha: 'beta' } });

    component.onRawJsonChange('{invalid json');
    expect(component.validationError()).toBe('workflowStudio.inspector.invalidMappingJson');
  });
});
