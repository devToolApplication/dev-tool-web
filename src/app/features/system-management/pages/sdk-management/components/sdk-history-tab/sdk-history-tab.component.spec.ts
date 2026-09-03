import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { SdkAdminApiService } from '../../../../api/sdk-admin-api.service';
import type {
  SdkTaskRunDetail,
  SdkTaskRunListResponse,
  SdkTaskRunSummary,
} from '../../../../model/sdk-management.model';
import { SdkHistoryTabComponent } from './sdk-history-tab.component';
import { TranslateContentPipe } from '@shared/pipes/translate-content.pipe';

describe('SdkHistoryTabComponent', () => {
  let component: SdkHistoryTabComponent;
  let fixture: ComponentFixture<SdkHistoryTabComponent>;
  let apiService: {
    listTaskRuns: ReturnType<typeof vi.fn>;
    getTaskRunDetail: ReturnType<typeof vi.fn>;
  };

  const mockRun: SdkTaskRunSummary = {
    taskId: 'task-100',
    agentCode: 'ba-agent',
    provider: 'codex',
    status: 'COMPLETED',
    promptPreview: 'Write spec',
    createdAt: '2026-09-03T00:00:00Z',
    updatedAt: '2026-09-03T00:01:00Z',
  };

  const mockListResponse: SdkTaskRunListResponse = {
    items: [mockRun],
    page: 1,
    size: 20,
    total: 1,
  };

  const mockDetail: SdkTaskRunDetail = {
    ...mockRun,
    events: [
      {
        sequence: 1,
        at: '2026-09-03T00:00:01Z',
        type: 'accepted',
      },
    ],
  };

  beforeEach(async () => {
    apiService = {
      listTaskRuns: vi.fn().mockReturnValue(of(mockListResponse)),
      getTaskRunDetail: vi.fn().mockReturnValue(of(mockDetail)),
    };

    await TestBed.configureTestingModule({
      declarations: [SdkHistoryTabComponent, TranslateContentPipe],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [{ provide: SdkAdminApiService, useValue: apiService }],
    }).compileComponents();

    fixture = TestBed.createComponent(SdkHistoryTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load task runs on init', () => {
    expect(apiService.listTaskRuns).toHaveBeenCalled();
    expect(component.runs()).toEqual([mockRun]);
    expect(component.total()).toBe(1);
  });

  it('should open detail drawer and load task detail', async () => {
    await component.onOpenDetail('task-100');
    expect(apiService.getTaskRunDetail).toHaveBeenCalledWith('task-100');
    expect(component.selectedDetail()).toEqual(mockDetail);
    expect(component.isDetailDrawerOpen()).toBeTruthy();
  });

  it('should handle load detail error', async () => {
    apiService.getTaskRunDetail.mockReturnValue(throwError(() => new Error('Error')));
    await component.onOpenDetail('task-100');
    expect(component.errorMessage()).toContain('Could not load task detail');
  });

  it('should emit rerunTask when rerun action clicked', () => {
    const emitSpy = vi.spyOn(component.rerunTask, 'emit');
    const actionsCol = component.tableConfig.columns.find((col) => col.field === 'actions');
    const rerunAction = actionsCol?.actions?.find((act) => act.variant === 'primary');
    runAction(rerunAction, mockRun);
    expect(emitSpy).toHaveBeenCalledWith(mockRun);

    function runAction(action: any, row: any) {
      action?.onClick(row);
    }
  });

  it('should close detail drawer', () => {
    component.isDetailDrawerOpen.set(true);
    component.selectedDetail.set(mockDetail);
    component.closeDetailDrawer();
    expect(component.isDetailDrawerOpen()).toBeFalsy();
    expect(component.selectedDetail()).toBeNull();
  });
});