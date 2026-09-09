import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { ToastService } from '@core/notifications/toast.service';
import { KocCampaignListComponent } from './koc-campaign-list.component';
import { KocCampaignService } from '../../services/koc-campaign.service';
import { KocCampaignItem } from '../../models/koc-campaign.model';
import { TranslateContentPipe } from '@shared/pipes/translate-content.pipe';

describe('KocCampaignListComponent', () => {
  let fixture: ComponentFixture<KocCampaignListComponent>;
  let component: KocCampaignListComponent;
  let campaignService: {
    getCampaignPage: ReturnType<typeof vi.fn>;
    getCampaignCandidates: ReturnType<typeof vi.fn>;
    createAndStartCampaign: ReturnType<typeof vi.fn>;
    cloneCampaign: ReturnType<typeof vi.fn>;
    updateCampaign: ReturnType<typeof vi.fn>;
    deleteCampaign: ReturnType<typeof vi.fn>;
  };
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };

  const mockCampaign: KocCampaignItem = {
    id: 'camp-1',
    name: 'Tech KOC Campaign',
    niche: 'TECH',
    targetCount: 5,
    minScore: 75.0,
    workflowStatus: 'USER_TASK',
    approvedKocCount: 0,
  };

  beforeEach(async () => {
    campaignService = {
      getCampaignPage: vi.fn().mockReturnValue(
        of({
          data: [mockCampaign],
          metadata: { totalElements: 1, pageNumber: 0, pageSize: 10 },
        })
      ),
      getCampaignCandidates: vi.fn().mockReturnValue(of([])),
      createAndStartCampaign: vi.fn().mockReturnValue(of(mockCampaign)),
      cloneCampaign: vi.fn().mockReturnValue(of({ ...mockCampaign, id: 'camp-cloned', name: '(Bản sao) Tech KOC Campaign' })),
      updateCampaign: vi.fn().mockReturnValue(of(mockCampaign)),
      deleteCampaign: vi.fn().mockReturnValue(of({ id: 'camp-1' })),
    };
    toast = { success: vi.fn(), error: vi.fn() };
    router = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      declarations: [KocCampaignListComponent, TranslateContentPipe],
      providers: [
        FormBuilder,
        { provide: KocCampaignService, useValue: campaignService },
        { provide: ToastService, useValue: toast },
        { provide: Router, useValue: router },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(KocCampaignListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create component and load campaign list', () => {
    expect(component).toBeTruthy();
    expect(campaignService.getCampaignPage).toHaveBeenCalled();
    expect(component.campaigns().length).toBe(1);
    expect(component.campaigns()[0].name).toBe('Tech KOC Campaign');
  });

  it('should filter campaigns on onFilterChange', () => {
    component.onFilterChange({ keyword: 'Tech', niche: 'TECH' });
    expect(component.pageIndex()).toBe(0);
    expect(campaignService.getCampaignPage).toHaveBeenCalled();
  });

  it('should open create dialog when toolbar create action clicked', () => {
    component.onToolbarAction({ id: 'create' });
    expect(component.formDialogVisible).toBe(true);
    expect(component.isEdit).toBe(false);
  });

  it('should submit create campaign form', async () => {
    component.openCreateDialog();
    component.form.patchValue({
      name: 'New Tech Campaign',
      niche: 'TECH',
      targetCount: 5,
      minScore: 70.0,
    });

    await component.submitForm();

    expect(campaignService.createAndStartCampaign).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('kocCampaign.toast.createSuccess');
    expect(component.formDialogVisible).toBe(false);
  });

  it('should open detail drawer and fetch approved candidates', async () => {
    await component.openDetail(mockCampaign);
    expect(component.drawerOpen()).toBe(true);
    expect(component.selectedCampaign()?.id).toBe('camp-1');
    expect(campaignService.getCampaignCandidates).toHaveBeenCalledWith('camp-1');
  });

  it('should navigate to the filtered task inbox on approveTask action', () => {
    component.onTableAction({
      action: { id: 'approveTask', label: '', onClick: () => undefined },
      row: mockCampaign,
    });
    expect(router.navigate).toHaveBeenCalledWith(['/tasks'], {
      queryParams: { businessKey: 'camp-1' },
    });
  });

  it('should navigate to the filtered task inbox from the drawer', () => {
    component.selectedCampaign.set(mockCampaign);

    component.onApproveTaskFromDrawer();

    expect(router.navigate).toHaveBeenCalledWith(['/tasks'], {
      queryParams: { businessKey: 'camp-1' },
    });
    expect(component.drawerOpen()).toBe(false);
  });

  it('should open clone dialog with prefilled values when clone action triggered', () => {
    component.onTableAction({
      action: { id: 'clone', label: '', onClick: () => undefined },
      row: mockCampaign,
    });
    expect(component.formDialogVisible).toBe(true);
    expect(component.isClone).toBe(true);
    expect(component.isEdit).toBe(false);
    expect(component.cloneSourceId).toBe('camp-1');
    expect(component.form.value.name).toBe('(Bản sao) Tech KOC Campaign');
    expect(component.form.value.niche).toBe('TECH');
    expect(component.form.value.targetCount).toBe(5);
    expect(component.form.value.minScore).toBe(75.0);
  });

  it('should submit clone campaign form and show cloneSuccess toast', async () => {
    component.openCloneDialog(mockCampaign);
    await component.submitForm();

    expect(campaignService.cloneCampaign).toHaveBeenCalledWith(
      'camp-1',
      expect.objectContaining({
        name: '(Bản sao) Tech KOC Campaign',
        niche: 'TECH',
      })
    );
    expect(toast.success).toHaveBeenCalledWith('kocCampaign.toast.cloneSuccess');
    expect(component.formDialogVisible).toBe(false);
    expect(component.isClone).toBe(false);
  });

  it('should initialize activeStepDetail with null', () => {
    expect(component.activeStepDetail()).toBeNull();
  });

  it('should render detailed two-line status with step title and round in workflowStatus template', () => {
    const testItem: KocCampaignItem = {
      ...mockCampaign,
      workflowStatus: 'RUNNING',
      currentStep: 'AI_SEARCH',
      currentStepTitle: 'Quét tìm KOC',
      currentRound: 1,
      maxRounds: 3,
      stepDetail: 'Đang quét bài đăng Facebook',
    };

    expect(component.workflowStatusCellTpl).toBeDefined();
    const viewRef = component.workflowStatusCellTpl!.createEmbeddedView({ row: testItem });
    viewRef.detectChanges();
    const compiled = viewRef.rootNodes[0] as HTMLElement;

    expect(compiled.textContent).toContain('Quét tìm KOC');
    expect(compiled.textContent).toContain('(1/3)');
  });

  it('should toggle step detail popover when info button is clicked', () => {
    const testItem: KocCampaignItem = {
      ...mockCampaign,
      id: 'camp-popover-1',
      workflowStatus: 'RUNNING',
      currentStep: 'AI_SEARCH',
      currentStepTitle: 'Quét tìm KOC',
      currentRound: 2,
      maxRounds: 3,
      stepDetail: 'Đang quét bài đăng Facebook theo tiêu chí',
      workflowRunId: 'run-999',
      approvedKocCount: 3,
      targetCount: 10,
    };

    const viewRef = component.workflowStatusCellTpl!.createEmbeddedView({ row: testItem });
    viewRef.detectChanges();
    const compiled = viewRef.rootNodes[0] as HTMLElement;

    // Initially popover is not visible
    expect(component.activeStepDetail()).toBeNull();
    expect(compiled.textContent).not.toContain('Đang quét bài đăng Facebook theo tiêu chí');

    // Click info button to open popover
    const infoBtn = compiled.querySelector('button[aria-label]') as HTMLButtonElement;
    expect(infoBtn).toBeTruthy();
    infoBtn.click();
    fixture.detectChanges();
    viewRef.detectChanges();

    expect(component.activeStepDetail()).toBe('camp-popover-1');
    expect(compiled.textContent).toContain('Đang quét bài đăng Facebook theo tiêu chí');
    expect(compiled.textContent).toContain('3 / 10 KOC');

    // Close button inside popover
    const closeBtn = compiled.querySelector('button i.pi-times')?.parentElement as HTMLButtonElement;
    expect(closeBtn).toBeTruthy();
    closeBtn.click();
    fixture.detectChanges();
    viewRef.detectChanges();

    expect(component.activeStepDetail()).toBeNull();
  });
});
