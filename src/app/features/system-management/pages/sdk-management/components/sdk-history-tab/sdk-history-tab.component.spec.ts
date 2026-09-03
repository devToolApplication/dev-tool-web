import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { SdkAdminApiService } from '../../../../api/sdk-admin-api.service';
import type {
  SdkTaskRunDetail,
  SdkTaskRunListResponse,
  SdkTaskRunSummary,
} from '../../../../model/sdk-management.model';
import { SdkHistoryTabComponent } from './sdk-history-tab.component';
import { SharedModule } from '@shared/shared.module';

describe('SdkHistoryTabComponent', () => {
  let component: SdkHistoryTabComponent;
  let fixture: ComponentFixture<SdkHistoryTabComponent>;
  let apiSpy: jasmine.SpyObj<SdkAdminApiService>;

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
    apiSpy = jasmine.createSpyObj('SdkAdminApiService', ['listTaskRuns', 'getTaskRunDetail']);
    apiSpy.listTaskRuns.and.returnValue(of(mockListResponse));
    apiSpy.getTaskRunDetail.and.returnValue(of(mockDetail));

    await TestBed.configureTestingModule({
      declarations: [SdkHistoryTabComponent],
      imports: [SharedModule],
      providers: [{ provide: SdkAdminApiService, useValue: apiSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(SdkHistoryTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load task runs on init', () => {
    expect(apiSpy.listTaskRuns).toHaveBeenCalled();
    expect(component.runs()).toEqual([mockRun]);
    expect(component.total()).toBe(1);
  });

  it('should open detail drawer and load task detail', async () => {
    await component.onOpenDetail('task-100');
    expect(apiSpy.getTaskRunDetail).toHaveBeenCalledWith('task-100');
    expect(component.selectedDetail()).toEqual(mockDetail);
    expect(component.isDetailDrawerOpen()).toBeTrue();
  });

  it('should handle load detail error', async () => {
    apiSpy.getTaskRunDetail.and.returnValue(throwError(() => new Error('Error')));
    await component.onOpenDetail('task-100');
    expect(component.errorMessage()).toContain('Could not load task detail');
  });

  it('should emit rerunTask when rerun action clicked', () => {
    spyOn(component.rerunTask, 'emit');
    const actionsCol = component.tableConfig.columns.find((c) => c.field === 'actions');
    const rerunAction = actionsCol?.actions?.find((a) => a.variant === 'primary');
    rerunAction?.onClick(mockRun);
    expect(component.rerunTask.emit).toHaveBeenCalledWith(mockRun);
  });

  it('should close detail drawer', () => {
    component.isDetailDrawerOpen.set(true);
    component.selectedDetail.set(mockDetail);
    component.closeDetailDrawer();
    expect(component.isDetailDrawerOpen()).toBeFalse();
    expect(component.selectedDetail()).toBeNull();
  });
});