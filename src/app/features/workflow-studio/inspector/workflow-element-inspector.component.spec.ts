import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { WorkflowElementInspectorComponent } from './workflow-element-inspector.component';

describe('WorkflowElementInspectorComponent', () => {
  let fixture: ComponentFixture<WorkflowElementInspectorComponent>;
  let component: WorkflowElementInspectorComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WorkflowElementInspectorComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkflowElementInspectorComponent);
    component = fixture.componentInstance;
  });

  it('renders node inspector when node is selected', () => {
    component.selectedElement = {
      kind: 'node',
      value: { id: 'start-1', type: 'START' },
    };

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-workflow-node-inspector')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-workflow-edge-inspector')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-empty-state')).toBeNull();
  });

  it('renders edge inspector when edge is selected and forwards deleteRequested', () => {
    let deleteEmitted = false;
    component.selectedElement = {
      kind: 'edge',
      value: { source: 'start-1', target: 'end-1' },
    };
    component.deleteRequested.subscribe(() => {
      deleteEmitted = true;
    });

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-workflow-edge-inspector')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-workflow-node-inspector')).toBeNull();

    component.deleteRequested.emit();
    expect(deleteEmitted).toBe(true);
  });

  it('renders empty state when nothing is selected', () => {
    component.selectedElement = null;

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-empty-state')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-workflow-node-inspector')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-workflow-edge-inspector')).toBeNull();
  });
});

