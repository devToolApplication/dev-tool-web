import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideSharedTesting } from '@shared/testing/shared-test.providers';
import { FlowBuilderModule } from '../../flow-builder.module';
import { FlowDefinition } from '../../models';
import { FlowBuilderComponent } from './flow-builder.component';

describe('FlowBuilderComponent', () => {
  let fixture: ComponentFixture<FlowBuilderComponent>;
  let component: FlowBuilderComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlowBuilderModule],
      providers: provideSharedTesting(),
    }).compileComponents();

    fixture = TestBed.createComponent(FlowBuilderComponent);
    component = fixture.componentInstance;
    component.value = flowDefinition;
  });

  it('emits export intent without browser download side effects', () => {
    const exportSpy = vi.spyOn(component.exportRequested, 'emit');
    const commandSpy = vi.spyOn(component.command, 'emit');
    const createElementSpy = vi.spyOn(document, 'createElement');

    component.executeCommand('exportJson');

    expect(exportSpy).toHaveBeenCalledWith(flowDefinition);
    expect(exportSpy.mock.calls[0][0]).not.toBe(flowDefinition);
    expect(commandSpy).toHaveBeenCalledWith({ command: 'exportJson' });
    expect(createElementSpy).not.toHaveBeenCalledWith('a');
  });

  it('emits import intent instead of opening a hidden file input', () => {
    const importSpy = vi.spyOn(component.importRequested, 'emit');
    const commandSpy = vi.spyOn(component.command, 'emit');

    component.executeCommand('importJson');

    expect(importSpy).toHaveBeenCalled();
    expect(commandSpy).toHaveBeenCalledWith({ command: 'importJson' });
  });

  it('applies imported definitions through the public contract', () => {
    const valueSpy = vi.spyOn(component.valueChange, 'emit');
    const commandSpy = vi.spyOn(component.command, 'emit');
    component.selectedId = 'node-1';
    component.selection = { primaryId: 'node-1', items: [{ id: 'node-1', kind: 'node' }] };

    component.applyImportedDefinition({
      id: 'imported',
      version: 1,
      nodes: [{ id: 'node-2', type: 'task', label: 'Imported' }],
      edges: [],
    });

    expect(component.selectedId).toBeNull();
    expect(valueSpy).toHaveBeenCalledWith({
      id: 'imported',
      version: 1,
      name: undefined,
      readonly: undefined,
      viewport: undefined,
      nodes: [{ id: 'node-2', type: 'task', label: 'Imported' }],
      edges: [],
      metadata: undefined,
    });
    expect(commandSpy).toHaveBeenCalledWith({ command: 'importJson' });
  });

  it('reports invalid imported definitions without mutating the current flow', () => {
    const validationSpy = vi.spyOn(component.validationChange, 'emit');

    component.applyImportedDefinition({ id: 'bad' } as FlowDefinition);

    expect(component.value).toBe(flowDefinition);
    expect(validationSpy).toHaveBeenCalledWith([
      {
        message: 'Invalid flow JSON',
        severity: 'error',
      },
    ]);
  });
});

const flowDefinition: FlowDefinition = {
  id: 'flow-1',
  version: 1,
  name: 'Demo flow',
  nodes: [{ id: 'node-1', type: 'task', label: 'Task' }],
  edges: [],
};
