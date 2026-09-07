import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { KeycloakService } from '../../../core/auth/keycloak.service';
import { createBasePageResponse } from '../../../core/http/base-response.model';
import { ToastService } from '../../../core/notifications/toast.service';
import { WorkflowApiService } from '../api/workflow-api.service';
import { WorkflowTask } from '../model/workflow-studio.model';
import { WorkflowTaskListPageComponent } from './workflow-task-list-page.component';

describe('WorkflowTaskListPageComponent', () => {
  let fixture: ComponentFixture<WorkflowTaskListPageComponent>;
  let component: WorkflowTaskListPageComponent;
  let api: {
    getWorkflowPage: ReturnType<typeof vi.fn>;
    getTasksPage: ReturnType<typeof vi.fn>;
    completeTask: ReturnType<typeof vi.fn>;
    claimTask: ReturnType<typeof vi.fn>;
    unclaimTask: ReturnType<typeof vi.fn>;
  };
  let router: { navigate: ReturnType<typeof vi.fn> };
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let keycloak: { userInfo?: { preferred_username?: string } };

  const task: WorkflowTask = {
    id: 'task-1',
    name: 'Approve Campaign Content',
    processInstanceId: 'proc-1',
    executionId: 'exec-1',
    taskDefinitionKey: 'approve_task',
    formKey: null,
    workflowId: 'wf-1',
    workflowName: 'Campaign Approval',
    assignee: 'admin',
    createTime: '2026-09-05T10:00:00Z',
    dueDate: '2026-09-06T10:00:00Z',
    priority: 50,
    variables: { approved: false, amount: 100 },
  };

  beforeEach(async () => {
    api = {
      getWorkflowPage: vi.fn(() => of(createBasePageResponse([{ id: 'wf-1', name: 'Workflow 1' } as any], 0, 100, 1))),
      getTasksPage: vi.fn(() => of(createBasePageResponse([task], 0, 20, 1))),
      completeTask: vi.fn(() => of(true)),
      claimTask: vi.fn(() => of(true)),
      unclaimTask: vi.fn(() => of(true)),
    };
    router = { navigate: vi.fn(() => Promise.resolve(true)) };
    toast = {
      success: vi.fn(),
      error: vi.fn(),
    };
    keycloak = {
      userInfo: { preferred_username: 'current-user' },
    };

    await TestBed.configureTestingModule({
      declarations: [WorkflowTaskListPageComponent],
      providers: [
        { provide: WorkflowApiService, useValue: api },
        { provide: Router, useValue: router },
        { provide: ToastService, useValue: toast },
        { provide: KeycloakService, useValue: keycloak },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(WorkflowTaskListPageComponent, {
        set: { template: '<div></div>', styles: [] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(WorkflowTaskListPageComponent);
    component = fixture.componentInstance;
  });

  it('loads workflow options and tasks on init', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(api.getWorkflowPage).toHaveBeenCalledWith({ size: 100 });
    expect(api.getTasksPage).toHaveBeenCalledWith({
      page: 0,
      size: 20,
      workflowId: undefined,
      assignee: undefined,
    });
    expect(component.tasks()).toEqual([task]);
    expect(component.workflows().length).toBe(1);
    expect(component.totalRecords()).toBe(1);
  });

  it('filters tasks by workflowId and assignee', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    component.onFilterChange({ workflowId: 'wf-1', assignee: 'john' });
    expect(api.getTasksPage).toHaveBeenCalledWith({
      page: 0,
      size: 20,
      workflowId: 'wf-1',
      assignee: 'john',
    });
  });

  it('resets filters and reloads page 0', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    component.onFilterReset();
    expect(api.getTasksPage).toHaveBeenCalledWith({
      page: 0,
      size: 20,
      workflowId: undefined,
      assignee: undefined,
    });
    expect(component.selectedWorkflowId).toBeNull();
    expect(component.selectedAssignee).toBeNull();
  });

  it('opens and closes drawer with task data', () => {
    component.openDrawer(task);
    expect(component.drawerOpen()).toBe(true);
    expect(component.selectedTask()).toEqual(task);
    expect(component.variableOverrideText()).toContain('"approved": false');

    component.closeDrawer();
    expect(component.drawerOpen()).toBe(false);
    expect(component.selectedTask()).toBeNull();
    expect(component.variableOverrideText()).toBe('');
  });

  it('navigates when formKey is route path', () => {
    const navTask: WorkflowTask = {
      ...task,
      formKey: '/campaign/review',
    };
    component.navigateToForm(navTask);
    expect(router.navigate).toHaveBeenCalledWith(['/campaign/review'], {
      queryParams: { taskId: 'task-1', runId: 'proc-1' },
    });
  });

  it('completes task successfully and reloads tasks', async () => {
    component.openDrawer(task);
    component.variableOverrideText.set('{"approved": true}');

    await component.completeTask();

    expect(api.completeTask).toHaveBeenCalledWith('task-1', { approved: true });
    expect(toast.success).toHaveBeenCalledWith('workflowStudio.lifecycle.taskCompleteSuccess');
    expect(component.drawerOpen()).toBe(false);
  });

  it('handles complete task error with BE errorMessage', async () => {
    api.completeTask.mockReturnValueOnce(
      throwError(() => ({
        error: { errorMessage: 'Task already completed by another user' },
      }))
    );

    component.openDrawer(task);
    await component.completeTask();

    expect(toast.error).toHaveBeenCalledWith('Task already completed by another user');
    expect(component.completing()).toBe(false);
  });

  it('shows error toast when variable override has invalid JSON format', async () => {
    component.openDrawer(task);
    component.variableOverrideText.set('{ invalid_json }');

    await component.completeTask();

    expect(api.completeTask).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('workflowStudio.bpmn.drawer.invalidJson');
  });

  it('filters tasks by assignmentStatus (unassigned and myTasks)', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    component.onFilterChange({ assignmentStatus: 'unassigned' });
    expect(api.getTasksPage).toHaveBeenCalledWith({
      page: 0,
      size: 20,
      workflowId: undefined,
      assignee: undefined,
      unassignedOnly: true,
    });

    component.onFilterChange({ assignmentStatus: 'myTasks' });
    expect(api.getTasksPage).toHaveBeenCalledWith({
      page: 0,
      size: 20,
      workflowId: undefined,
      assignee: 'current-user',
      unassignedOnly: undefined,
    });
  });

  it('claims task and updates assignee', async () => {
    component.openDrawer(task);
    await component.claimTask(task);

    expect(api.claimTask).toHaveBeenCalledWith('task-1', 'current-user');
    expect(toast.success).toHaveBeenCalledWith('workflowStudio.lifecycle.taskClaimSuccess');
    expect(component.selectedTask()?.assignee).toBe('current-user');
  });

  it('unclaims task and clears assignee', async () => {
    const assignedTask = { ...task, assignee: 'current-user' };
    component.openDrawer(assignedTask);
    await component.unclaimTask(assignedTask);

    expect(api.unclaimTask).toHaveBeenCalledWith('task-1');
    expect(toast.success).toHaveBeenCalledWith('workflowStudio.lifecycle.taskUnclaimSuccess');
    expect(component.selectedTask()?.assignee).toBeNull();
  });

  it('toggles polling on and off', () => {
    expect(component.pollingActive()).toBe(false);

    component.onToolbarAction({ id: 'polling' });
    expect(component.pollingActive()).toBe(true);

    component.onToolbarAction({ id: 'polling' });
    expect(component.pollingActive()).toBe(false);
  });

  it('routes table actions claim and unclaim', async () => {
    const claimSpy = vi.spyOn(component, 'claimTask');
    const unclaimSpy = vi.spyOn(component, 'unclaimTask');

    component.onTableAction({ action: { id: 'claim', label: 'Claim', onClick: () => {} }, row: task });
    expect(claimSpy).toHaveBeenCalledWith(task);

    component.onTableAction({ action: { id: 'unclaim', label: 'Unclaim', onClick: () => {} }, row: task });
    expect(unclaimSpy).toHaveBeenCalledWith(task);
  });

  it('handles toolbar action refresh', () => {
    component.onToolbarAction({ id: 'refresh' });
    expect(api.getTasksPage).toHaveBeenCalled();
  });

  it('maps priority labels and badge variants correctly', () => {
    expect(component.priorityBadgeVariant(10)).toBe('info');
    expect(component.priorityBadgeVariant(30)).toBe('warning');
    expect(component.priorityBadgeVariant(60)).toBe('danger');

    expect(component.priorityLabel(10)).toBe('Low (10)');
    expect(component.priorityLabel(30)).toBe('Normal (30)');
    expect(component.priorityLabel(60)).toBe('High (60)');
  });
});
