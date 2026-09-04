import '@angular/compiler';
import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { WorkflowRunTriggerDialogComponent } from './workflow-run-trigger-dialog.component';

describe('WorkflowRunTriggerDialogComponent', () => {
  let component: WorkflowRunTriggerDialogComponent;
  let apiService: any;
  let formBuilder: FormBuilder;

  beforeEach(() => {
    formBuilder = new FormBuilder();
    apiService = {
      getWorkflowPage: vi.fn(() =>
        of({
          data: [
            { id: 'wf-1', name: 'Trading Agent' },
            { id: 'wf-2', name: 'Content Screening' },
          ],
          total: 2,
        })
      ),
      startWorkflow: vi.fn(() =>
        of({
          id: 'run-123',
          workflowDefinitionId: 'wf-1',
          status: 'PENDING',
        })
      ),
    };

    component = new WorkflowRunTriggerDialogComponent(apiService, formBuilder);
  });

  it('initializes form and loads workflows on open', () => {
    component.open('wf-1');
    expect(component.visible).toBe(true);
    expect(component.form.value.workflowId).toBe('wf-1');
    expect(apiService.getWorkflowPage).toHaveBeenCalled();
    expect(component.workflows.length).toBe(2);
  });

  it('validates JSON input format before submission', () => {
    component.open();
    component.form.patchValue({
      workflowId: 'wf-1',
      inputPayload: '{ invalid json }',
    });

    component.submit();
    expect(component.jsonError).toBeTruthy();
    expect(apiService.startWorkflow).not.toHaveBeenCalled();
  });

  it('submits valid JSON and emits runStarted', () => {
    const emitted: any[] = [];
    component.runStarted.subscribe((run) => emitted.push(run));

    component.open();
    component.form.patchValue({
      workflowId: 'wf-1',
      inputPayload: '{"symbol": "BTCUSDT"}',
    });

    component.submit();
    expect(apiService.startWorkflow).toHaveBeenCalledWith('wf-1', { symbol: 'BTCUSDT' });
    expect(emitted.length).toBe(1);
    expect(emitted[0].id).toBe('run-123');
    expect(component.visible).toBe(false);
  });
});
