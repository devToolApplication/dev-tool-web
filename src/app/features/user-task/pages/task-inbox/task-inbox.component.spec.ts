import { NO_ERRORS_SCHEMA, Pipe, PipeTransform } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import { KeycloakService } from '../../../../core/auth/keycloak.service';
import { createBasePageResponse } from '../../../../core/http/base-response.model';
import { UserTaskSummary } from '../../models/user-task.model';
import { UserTaskApiService } from '../../services/user-task-api.service';
import { TaskInboxComponent } from './task-inbox.component';

@Pipe({ name: 'translateContent', standalone: false })
class TranslateContentPipeStub implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe('TaskInboxComponent', () => {
  let fixture: ComponentFixture<TaskInboxComponent>;
  let component: TaskInboxComponent;
  let queryParams$: BehaviorSubject<Record<string, unknown>>;
  let api: { getTasks: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };
  let keycloak: { userInfo: unknown; hasRole: ReturnType<typeof vi.fn> };

  const mockTask: UserTaskSummary = {
    taskId: 'task-101',
    processInstanceId: 'proc-888',
    businessKey: 'CAMPAIGN-KOC-01',
    formKey: 'APPROVAL',
    taskName: 'Approve Campaign Influencer',
    processDefinitionName: 'Influencer Workflow',
    assignee: 'john.doe',
    createdAt: '2026-09-08T09:00:00Z',
    dueAt: '2026-09-12T09:00:00Z',
    priority: 50,
    completed: false,
    claimable: false,
    readOnly: false,
    canAct: true,
    allowedActions: ['APPROVE', 'REJECT'],
  };

  beforeEach(async () => {
    queryParams$ = new BehaviorSubject<Record<string, unknown>>({});
    api = {
      getTasks: vi.fn(() => of(createBasePageResponse([mockTask], 0, 10, 1))),
    };
    router = {
      navigate: vi.fn(() => Promise.resolve(true)),
    };
    keycloak = {
      userInfo: {
        preferred_username: 'test-user',
        realm_access: { roles: ['offline_access'] },
      },
      hasRole: vi.fn((role: string) => false),
    };

    await TestBed.configureTestingModule({
      declarations: [TaskInboxComponent, TranslateContentPipeStub],
      providers: [
        { provide: UserTaskApiService, useValue: api },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: queryParams$.asObservable(),
            snapshot: { queryParams: {} },
          },
        },
        { provide: KeycloakService, useValue: keycloak },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskInboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('initializes with default query and loads tasks for non-admin', () => {
    expect(component.isAdmin()).toBe(false);
    expect(component.viewTabs().map((t) => t.value)).toEqual(['MY', 'CLAIMABLE']);
    expect(api.getTasks).toHaveBeenCalledWith(
      expect.objectContaining({
        view: 'MY',
        page: 0,
        size: 10,
        sort: 'createdAt,desc',
      }),
    );
    expect(component.tasks().length).toBe(1);
    expect(component.tasks()[0].taskId).toBe('task-101');
    expect(component.totalRecords()).toBe(1);
    expect(component.errorState()).toBeNull();
  });

  it('exposes ALL tab when user has exact realm role ai_agent_admin', () => {
    keycloak.userInfo = {
      realm_access: { roles: ['offline_access', 'ai_agent_admin'] },
    };
    component.ngOnInit();
    fixture.detectChanges();

    expect(component.isAdmin()).toBe(true);
    expect(component.viewTabs().map((t) => t.value)).toEqual(['MY', 'CLAIMABLE', 'ALL']);
  });

  it('sanitizes view=ALL to MY and redirects when non-admin navigates to ALL', () => {
    queryParams$.next({ view: 'ALL' });
    fixture.detectChanges();

    expect(router.navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: expect.objectContaining({ view: 'MY' }),
        replaceUrl: true,
      }),
    );
  });

  it('initializes businessKey filter from deep link query parameter', () => {
    queryParams$.next({ businessKey: 'CAMP-DEEP-LINK-42' });
    fixture.detectChanges();

    expect(api.getTasks).toHaveBeenCalledWith(
      expect.objectContaining({
        businessKey: 'CAMP-DEEP-LINK-42',
      }),
    );
    expect(component.filterValues()['businessKey']).toBe('CAMP-DEEP-LINK-42');
  });

  it('updates queryParams and page=0 when changing view tab', () => {
    component.onViewTabChange('CLAIMABLE');

    expect(router.navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: expect.objectContaining({
          view: 'CLAIMABLE',
          page: 0,
        }),
      }),
    );
  });

  it('applies filters with dueAfter and dueBefore and updates queryParams', () => {
    component.onFilterApply({
      keyword: 'Approval Test',
      formKey: 'APPROVAL',
      status: 'ACTIVE',
      businessKey: 'BK-555',
      dueRange: {
        from: new Date('2026-09-01T00:00:00.000Z'),
        to: new Date('2026-09-10T00:00:00.000Z'),
      },
    });

    expect(router.navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: expect.objectContaining({
          keyword: 'Approval Test',
          formKey: 'APPROVAL',
          status: 'ACTIVE',
          businessKey: 'BK-555',
          dueAfter: '2026-09-01T00:00:00.000Z',
          dueBefore: '2026-09-10T00:00:00.000Z',
          page: 0,
        }),
      }),
    );
  });

  it('resets filters while preserving current view', () => {
    component.onFilterReset();

    expect(router.navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: expect.objectContaining({
          view: 'MY',
          page: 0,
        }),
      }),
    );
  });

  it('updates page and size on table pagination change', () => {
    component.onPageChange({ page: 3, rows: 20, first: 60 });

    expect(router.navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: expect.objectContaining({
          page: 3,
          size: 20,
        }),
      }),
    );
  });

  it('reloads tasks on refresh toolbar action', () => {
    api.getTasks.mockClear();
    component.onToolbarAction({ id: 'refresh', label: 'refresh' });

    expect(api.getTasks).toHaveBeenCalledOnce();
  });

  it('navigates to /tasks/:taskId on row click', () => {
    component.onRowClick(mockTask);

    expect(router.navigate).toHaveBeenCalledWith(['/tasks', 'task-101']);
  });

  it('navigates to /tasks/:taskId on open table action', () => {
    component.onTableAction({
      action: {
        id: 'open',
        label: 'userTask.actions.open',
        onClick: vi.fn(),
      },
      row: mockTask,
    });

    expect(router.navigate).toHaveBeenCalledWith(['/tasks', 'task-101']);
  });

  it('table config open action triggers navigate to /tasks/:taskId', () => {
    const actionsCol = component.tableConfig.columns.find((c) => c.field === 'actions');
    const openAction = actionsCol?.actions?.[0];
    expect(openAction).toBeDefined();

    openAction?.onClick(mockTask);
    expect(router.navigate).toHaveBeenCalledWith(['/tasks', 'task-101']);
  });

  it('handles empty state with zero records and empty array', () => {
    api.getTasks.mockReturnValue(of(createBasePageResponse([], 0, 10, 0)));
    component.onRefresh();

    expect(component.tasks().length).toBe(0);
    expect(component.totalRecords()).toBe(0);
    expect(component.loading()).toBe(false);
    expect(component.errorState()).toBeNull();
  });

  it('handles backend error state without mock fallback', () => {
    const backendError = {
      status: 500,
      error: {
        errorCode: 'FLOWABLE_TASK_SERVICE_UNAVAILABLE',
        errorMessage: 'The task service is temporarily unavailable',
      },
    };
    api.getTasks.mockReturnValue(throwError(() => backendError));

    component.onRefresh();

    expect(component.tasks().length).toBe(0);
    expect(component.totalRecords()).toBe(0);
    expect(component.loading()).toBe(false);
    expect(component.errorState()).toEqual({
      errorCode: 'FLOWABLE_TASK_SERVICE_UNAVAILABLE',
      errorMessage: 'The task service is temporarily unavailable',
    });
  });

  it('hides secondary columns on mobile viewport', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 });
    component.onResize();

    expect(component.isMobile()).toBe(true);
    expect(component.visibleColumnFields()).toEqual(['task', 'status', 'actions']);

    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1200 });
    component.onResize();

    expect(component.isMobile()).toBe(false);
    expect(component.visibleColumnFields()).toEqual([
      'task',
      'workflow',
      'formKey',
      'assignee',
      'createdAt',
      'status',
      'actions',
    ]);
  });
});