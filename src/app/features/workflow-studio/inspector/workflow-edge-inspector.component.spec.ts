import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, Pipe, PipeTransform } from '@angular/core';

import { WorkflowEdgeInspectorComponent } from './workflow-edge-inspector.component';

@Pipe({ name: 'translateContent', standalone: false })
class TranslateContentPipeStub implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe('WorkflowEdgeInspectorComponent', () => {
  let fixture: ComponentFixture<WorkflowEdgeInspectorComponent>;
  let component: WorkflowEdgeInspectorComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WorkflowEdgeInspectorComponent, TranslateContentPipeStub],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkflowEdgeInspectorComponent);
    component = fixture.componentInstance;
    component.edge = { source: 'start-1', target: 'end-1' };
  });

  it('renders readonly source and target', () => {
    fixture.detectChanges();

    const inputs = fixture.nativeElement.querySelectorAll('app-input-text');
    expect(inputs.length).toBe(2);
  });

  it('emits deleteRequested when delete button is clicked', () => {
    let deleteCalled = false;
    component.deleteRequested.subscribe(() => {
      deleteCalled = true;
    });

    fixture.detectChanges();
    component.requestDelete();

    expect(deleteCalled).toBe(true);
  });

  it('does not emit deleteRequested when in readonly mode', () => {
    let deleteCalled = false;
    component.readonly = true;
    component.deleteRequested.subscribe(() => {
      deleteCalled = true;
    });

    fixture.detectChanges();
    component.requestDelete();

    expect(deleteCalled).toBe(false);
    expect(fixture.nativeElement.querySelector('.workflow-edge-inspector__actions')).toBeNull();
  });
});

